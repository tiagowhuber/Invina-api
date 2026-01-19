import Order from '../models/Order';
import Ticket from '../models/Ticket';
import { sequelize } from '../config/database';

/**
 * Manually expire pending orders
 * This function can be called via API endpoint or before payment processing
 * Suitable for serverless environments (Vercel, AWS Lambda, etc.)
 */
export async function expireOldOrders(): Promise<{ expired: number; errors: number }> {
  const expirationMinutes = parseInt(process.env.ORDER_EXPIRATION_MINUTES || '15');
  
  try {
    console.log('[OrderExpiration] Checking for expired orders...');
    
    // Find expired pending orders using raw SQL
    const expiredOrders = await sequelize.query(
      `SELECT * FROM orders 
       WHERE status = 'pending' 
       AND created_at < NOW() - INTERVAL '${expirationMinutes} minutes'`,
      { type: 'SELECT', model: Order, mapToModel: true }
    );
    
    if (expiredOrders.length === 0) {
      console.log('[OrderExpiration] No expired orders found');
      return { expired: 0, errors: 0 };
    }
    
    console.log(`[OrderExpiration] Found ${expiredOrders.length} expired order(s)`);
    
    let errorCount = 0;
    
    // Cancel and expire each order
    for (const order of expiredOrders) {
      try {
        await sequelize.transaction(async (t) => {
          // Update order status to expired
          await Order.update(
            { status: 'expired' },
            { where: { id: order.id }, transaction: t }
          );
          
          // Update all tickets status to cancelled
          await Ticket.update(
            { status: 'cancelled' },
            { where: { order_id: order.id }, transaction: t }
          );
        });
        
        console.log(`[OrderExpiration] Expired order ${(order as any).order_number} (ID: ${order.id})`);
      } catch (error: any) {
        errorCount++;
        console.error(`[OrderExpiration] Error expiring order ${(order as any).order_number}:`, error.message);
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
  
  const order = await Order.findByPk(orderId);
  if (!order || order.status !== 'pending') {
    return false;
  }
  
  const createdAt = new Date(order.created_at);
  const now = new Date();
  const minutesElapsed = (now.getTime() - createdAt.getTime()) / (1000 * 60);
  
  if (minutesElapsed >= expirationMinutes) {
    await sequelize.transaction(async (t) => {
      // Update order status to expired
      await Order.update(
        { status: 'expired' },
        { where: { id: orderId }, transaction: t }
      );
      
      // Update all tickets status to cancelled
      await Ticket.update(
        { status: 'cancelled' },
        { where: { order_id: orderId }, transaction: t }
      );
    });
    
    console.log(`[OrderExpiration] Order ${order.order_number} expired`);
    return true;
  }
  
  return false;
}
