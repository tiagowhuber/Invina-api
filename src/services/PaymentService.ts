import { Transaction } from 'sequelize';
import Order from '../models/Order';
import Payment from '../models/Payment';
import { VIRTUALPOS_API_URL, signRequest, getAuthHeaders } from '../utils/virtualpos';

export class PaymentService {
  
  async createTransaction(order: Order, t?: Transaction) {
    const amount = Math.round(order.totalAmount);
    
    // Split name for VirtualPOS requirements
    const names = order.customerName.split(' ');
    const firstName = names[0] || 'Guest';
    const lastName = names.slice(1).join(' ') || 'User';

    // 1. Prepare Payload
    const paymentPayload = {
        amount: amount,
        email: order.customerEmail,
        social_id: order.customerRut, 
        first_name: firstName,
        last_name: lastName,
        phone: order.customerPhone || '56900000000',
        description: `Order #${order.orderNumber}`,
        merchant_internal_code: String(order.id),
        merchant_internal_channel: "Web"
    };

    const signature = signRequest(paymentPayload);

    // 2. Create Payment Object (Step 1)
    const createResponse = await fetch(`${VIRTUALPOS_API_URL}/payment`, {       
        method: "POST",
        headers: { ...(getAuthHeaders(signature) as any), 'Content-Type': 'application/json' },
        body: JSON.stringify(paymentPayload),
    });
    
    if (!createResponse.ok) {
        const errText = await createResponse.text();
        console.error('VirtualPOS Create Error:', errText);
        throw new Error(`VirtualPOS Create Failed: ${createResponse.status} ${errText}`);
    }

    const createData = await createResponse.json() as any;
    console.log('[PaymentService] createData:', JSON.stringify(createData, null, 2));

    const uuid = createData?.payment?.order?.uuid;

    if (!uuid) {
      throw new Error(`VirtualPOS Create returned no UUID. Response: ${JSON.stringify(createData)}`);
    }

    // 3. Get Web Checkout URL (Step 2)
    // VirtualPOS redirects to this URL after payment logic at gateway
    // We want the user to land on our API which then redirects to Frontend
    const returnUrl = `${process.env.API_URL}/api/payments/return?token=${uuid}`;
    const webhookUrl = `${process.env.API_URL}/api/payments/webhook?token=${uuid}`;

    const checkoutPayload = {
        return_url: Buffer.from(returnUrl).toString('base64'),
        callback_url: Buffer.from(webhookUrl).toString('base64'),
        payment_method: "webpay"
    };
    const checkoutSignature = signRequest(checkoutPayload);

    const checkoutResponse = await fetch(`${VIRTUALPOS_API_URL}/payment/${uuid}/webcheckout`, {
        method: "POST",
        headers: { ...(getAuthHeaders(checkoutSignature) as any), 'Content-Type': 'application/json' },
        body: JSON.stringify(checkoutPayload),
    });

    if (!checkoutResponse.ok) {
         const errText = await checkoutResponse.text();
         throw new Error(`VirtualPOS Checkout Failed: ${checkoutResponse.status} ${errText}`);
    }

    const checkoutData = await checkoutResponse.json() as { url: string };
    console.log('[PaymentService] checkoutData:', JSON.stringify(checkoutData, null, 2));

    if (!checkoutData || !checkoutData.url) {
       throw new Error(`VirtualPOS Checkout returned no URL. Response: ${JSON.stringify(checkoutData)}`);
    }

    // Create Payment Record
    await Payment.create({
      orderId: order.id,
      provider: 'VirtualPOS',
      transactionId: uuid, 
      amount: amount,
      status: 'Pending',
      responsePayload: { ...createData, ...checkoutData }
    }, { transaction: t });

    return { token: uuid, url: checkoutData.url };
  }

  async commitTransaction(token: string) {
     // For VirtualPOS, "commit" is verifying the status.
     const signature = signRequest({});

     const response = await fetch(`${VIRTUALPOS_API_URL}/payment/${token}`, {       
        method: "GET",
        headers: { ...(getAuthHeaders(signature) as any), 'Content-Type': 'application/json' }
     });

     if (!response.ok) {
        const errText = await response.text();
        throw new Error(`VirtualPOS Verify Failed: ${response.status} ${errText}`);
     }

     const vpData = await response.json() as any;
     
     return vpData;
  }
}
