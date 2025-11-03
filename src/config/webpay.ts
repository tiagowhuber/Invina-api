// Determine environment
const isProduction = process.env.WEBPAY_ENVIRONMENT === 'production';

// Transbank WebPay Plus REST API Configuration
export const webpayConfig = {
  // API URLs
  apiUrl: isProduction 
    ? 'https://webpay3g.transbank.cl/rswebpaytransaction/api/webpay/v1.2/transactions'
    : 'https://webpay3gint.transbank.cl/rswebpaytransaction/api/webpay/v1.2/transactions',
  
  // Credentials
  commerceCode: isProduction 
    ? process.env.WEBPAY_COMMERCE_CODE || ''
    : '597055555532',
  
  apiKey: isProduction 
    ? process.env.WEBPAY_API_KEY || ''
    : '579B532A7440BB0C9079DED94D31EA1615BACEB56610332264630D42D0A36B1C',
  
  // Return URLs
  returnUrl: process.env.WEBPAY_RETURN_URL || 'http://localhost:5173/payment/return',
  
  // Environment
  environment: isProduction ? 'production' : 'integration' as const,
};

console.log(`✓ WebPay Plus configured for ${webpayConfig.environment.toUpperCase()}`);
