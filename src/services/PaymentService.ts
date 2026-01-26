import { WebpayPlus } from 'transbank-sdk';
import { Options, IntegrationApiKeys, Environment, IntegrationCommerceCodes } from 'transbank-sdk';
import Order from '../models/Order';
import Payment from '../models/Payment';

// Initialize WebPay (Assuming usage of Integration values for dev, env vars for prod)
// The SDK usually handles env vars or constructor args.
// We'll use a basic setup.

export class PaymentService {
  
  async createTransaction(order: Order) {
    // Determine environment.
    // For simplicity, using Intagration Default if no env vars.
    // const buyOrder = order.orderNumber; // UUID might be too long.
    
    // Transbank buyOrder usually prefers shorter strings. UUID is 36 chars.
    // Transbank limit is 26 chars. We need to truncate or map.
    // I'll take the first 26 chars or use a shortId generator.
    // For safety, let's use the numeric ID or a substring of UUID.
    // order.id is integer. `O-${order.id}` is safe.
    const limitBuyOrder = `O-${order.id}`; 
    const sessionId = `S-${Date.now()}`;
    const amount = order.totalAmount;
    const returnUrl = `${process.env.API_URL}/api/payments/return`; // Callback

    // Initialize Transbank Transaction
    // Use proper initialization based on SDK version 6.x
    // If env vars are set, SDK usually picks them up or we pass them?
    // Verifying SDK usage...
    // In v2/v3 it was different. v6 (TS) often uses:
    // const tx = new WebpayPlus.Transaction(new Options(CommCode, ApiKey, Env)); 
    
    let tx;
    if (process.env.WEBPAY_COMMERCE_CODE) {
       tx = new WebpayPlus.Transaction(new Options(
         process.env.WEBPAY_COMMERCE_CODE, 
         process.env.WEBPAY_API_KEY as string, 
         process.env.WEBPAY_ENV === 'production' ? Environment.Production : Environment.Integration
       ));
    } else {
       tx = new WebpayPlus.Transaction(new Options(
         IntegrationCommerceCodes.WEBPAY_PLUS, 
         IntegrationApiKeys.WEBPAY, 
         Environment.Integration
       ));
    }

    const response = await tx.create(
      limitBuyOrder, 
      sessionId, 
      amount, 
      returnUrl
    );

    // Create Payment Record (Pending)
    await Payment.create({
      orderId: order.id,
      provider: 'WebPay',
      transactionId: response.token, // Store token to retrieve status later
      amount: amount,
      status: 'Pending',
      responsePayload: response
    });

    return response; // { token, url }
  }

  async commitTransaction(token: string) {
     let tx;
     if (process.env.WEBPAY_COMMERCE_CODE) {
       tx = new WebpayPlus.Transaction(new Options(
         process.env.WEBPAY_COMMERCE_CODE, 
         process.env.WEBPAY_API_KEY as string, 
         process.env.WEBPAY_ENV === 'production' ? Environment.Production : Environment.Integration
       ));
    } else {
       tx = new WebpayPlus.Transaction(new Options(
         IntegrationCommerceCodes.WEBPAY_PLUS, 
         IntegrationApiKeys.WEBPAY, 
         Environment.Integration
       ));
    }

    const response = await tx.commit(token);
    return response;
  }
}
