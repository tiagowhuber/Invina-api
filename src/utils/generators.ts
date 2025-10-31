/**
 * Generate a unique order number
 * Format: ORD-YYYYMMDD-XXXXXX (e.g., ORD-20251031-A1B2C3)
 */
export function generateOrderNumber(): string {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  
  // Generate random alphanumeric string (6 characters)
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let randomStr = '';
  for (let i = 0; i < 6; i++) {
    randomStr += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  
  return `ORD-${year}${month}${day}-${randomStr}`;
}

/**
 * Generate a unique ticket number
 * Format: TKT-YYYYMMDD-XXXXXX (e.g., TKT-20251031-X9Y8Z7)
 */
export function generateTicketNumber(): string {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  
  // Generate random alphanumeric string (6 characters)
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let randomStr = '';
  for (let i = 0; i < 6; i++) {
    randomStr += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  
  return `TKT-${year}${month}${day}-${randomStr}`;
}

/**
 * Generate WebPay buy order
 * Format: BUY-YYYYMMDD-XXXXXX
 */
export function generateBuyOrder(): string {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  
  // Generate random numeric string (6 digits)
  const randomNum = Math.floor(Math.random() * 1000000).toString().padStart(6, '0');
  
  return `BUY-${year}${month}${day}-${randomNum}`;
}
