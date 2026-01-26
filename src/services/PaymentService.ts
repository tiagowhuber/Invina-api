import Order from '../models/Order';
import Payment from '../models/Payment';
import { VIRTUALPOS_API_URL, signRequest, getAuthHeaders } from '../utils/virtualpos';

export class PaymentService {
  
  async createTransaction(order: Order) {
    const amount = Math.round(order.totalAmount);
    
    // Split name for VirtualPOS requirements
    const names = order.customerName.split(' ');
    const firstName = names[0] || 'Guest';
    const lastName = names.slice(1).join(' ') || 'User';

    // 1. Prepare Payload
    const paymentPayload = {
        amount: amount,
        email: order.customerEmail,
        social_id: "11111111-1", // Placeholder
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
        headers: getAuthHeaders(signature) as any,
        body: JSON.stringify(paymentPayload),
    });
    
    if (!createResponse.ok) {
        const errText = await createResponse.text();
        throw new Error(`VirtualPOS Create Failed: ${createResponse.status} ${errText}`);
    }

    const createData = await createResponse.json() as { uuid: string };
    const uuid = createData.uuid;

    // 3. Get Web Checkout URL (Step 2)
    // VirtualPOS redirects to this URL after payment logic at gateway
    // We want the user to land on our API which then redirects to Frontend
    const returnUrl = `${process.env.API_URL}/api/payments/return?token=${uuid}`; 
    // const webhookUrl = `${process.env.API_URL}/api/payments/webhook`; // Optional if implemented

    const checkoutPayload = {
        return_url: Buffer.from(returnUrl).toString('base64'),
        // callback_url: Buffer.from(webhookUrl).toString('base64'), 
        payment_method: "webpay"
    };
    const checkoutSignature = signRequest(checkoutPayload);

    const checkoutResponse = await fetch(`${VIRTUALPOS_API_URL}/payment/${uuid}/webcheckout`, {
        method: "POST",
        headers: getAuthHeaders(checkoutSignature) as any,
        body: JSON.stringify(checkoutPayload),
    });

    if (!checkoutResponse.ok) {
         throw new Error("VirtualPOS Checkout Failed");
    }

    const checkoutData = await checkoutResponse.json() as { url: string };

    // Create Payment Record
    await Payment.create({
      orderId: order.id,
      provider: 'VirtualPOS',
      transactionId: uuid, 
      amount: amount,
      status: 'Pending',
      responsePayload: { ...createData, ...checkoutData }
    });

    return { token: uuid, url: checkoutData.url };
  }

  async commitTransaction(token: string) {
     // For VirtualPOS, "commit" is verifying the status.
     const signature = signRequest({});

     const response = await fetch(`${VIRTUALPOS_API_URL}/payment/${token}`, {       
        method: "GET",
        headers: getAuthHeaders(signature) as any
     });

     if (!response.ok) {
        throw new Error("VirtualPOS Verify Failed");
     }

     const vpData = await response.json() as any;
     
     return vpData;
  }
}
