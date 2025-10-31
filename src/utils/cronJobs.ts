import Order from '../models/Order'; // Ensure the file '../models/Order.ts' exists or adjust the path

/**
 * Manually expire pending orders
 * This function can be called via API endpoint or before payment processing
 * Suitable for serverless environments (Vercel, AWS Lambda, etc.)
 */
export async function expireOldOrders(): Promise<{ expired: number; errors: number }> {
  const expirationMinutes = parseInt(process.env.ORDER_EXPIRATION_MINUTES || '15');
  
  try {
    console.log('[OrderExpiration] Checking for expired orders...');
    
    // Find expired pending orders
    const expiredOrders = await Order.findExpiredPending(expirationMinutes);
    
    if (expiredOrders.length === 0) {
      console.log('[OrderExpiration] No expired orders found');
      return { expired: 0, errors: 0 };
    }
    
    console.log(`[OrderExpiration] Found ${expiredOrders.length} expired order(s)`);
    
    let errorCount = 0;
    
    // Cancel and expire each order
    for (const order of expiredOrders) {
      try {
        await Order.cancel(order.id);
        await Order.updateStatus(order.id, 'expired');
        console.log(`[OrderExpiration] Expired order ${order.orderNumber} (ID: ${order.id})`);
      } catch (error: any) {
        errorCount++;
        console.error(`[OrderExpiration] Error expiring order ${order.orderNumber}:`, error.message);
      }
    }
    
    console.log(`[OrderExpiration] Successfully expired ${expiredOrders.length - errorCount} order(s)`);
    return { expired: expiredOrders.length - errorCount, errors: errorCount };
  } catch (error) {
    console.error('[OrderExpiration] Error in order expiration:', error);
    throw error;
  }
}

/**
 * Check if an order is expired and expire it if necessary
 * Useful to call before processing payments
 */
export async function checkAndExpireOrder(orderId: number): Promise<boolean> {
  const expirationMinutes = parseInt(process.env.ORDER_EXPIRATION_MINUTES || '15');
  
  const order = await Order.findById(orderId);
  if (!order || order.status !== 'pending') {
    return false;
  }
  
  const createdAt = new Date(order.createdAt);
  const now = new Date();
  const minutesElapsed = (now.getTime() - createdAt.getTime()) / (1000 * 60);
  
  if (minutesElapsed >= expirationMinutes) {
    await Order.cancel(orderId);
    await Order.updateStatus(orderId, 'expired');
    console.log(`[OrderExpiration] Order ${order.orderNumber} expired`);
    return true;
  }
  
  return false;
}
