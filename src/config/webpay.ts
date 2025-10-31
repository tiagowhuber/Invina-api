import { WebpayPlus, Options, IntegrationApiKeys, Environment, IntegrationCommerceCodes } from 'transbank-sdk';

// Determine environment
const isProduction = process.env.WEBPAY_ENVIRONMENT === 'production';

// Configure WebPay Plus
let webpayPlus: any;

if (isProduction) {
  // Production configuration
  const commerceCode = process.env.WEBPAY_COMMERCE_CODE;
  const apiKey = process.env.WEBPAY_API_KEY;

  if (!commerceCode || !apiKey) {
    throw new Error('Production WebPay credentials not configured. Set WEBPAY_COMMERCE_CODE and WEBPAY_API_KEY.');
  }

  webpayPlus = new WebpayPlus.Transaction(
    new Options(commerceCode, apiKey, Environment.Production)
  );
  
  console.log('✓ WebPay Plus configured for PRODUCTION');
} else {
  // Integration/Testing configuration
  webpayPlus = new WebpayPlus.Transaction(
    new Options(
      IntegrationCommerceCodes.WEBPAY_PLUS,
      IntegrationApiKeys.WEBPAY,
      Environment.Integration
    )
  );
  
  console.log('✓ WebPay Plus configured for INTEGRATION/TESTING');
}

// WebPay configuration values
export const webpayConfig = {
  returnUrl: process.env.WEBPAY_RETURN_URL || 'http://localhost:3000/api/webpay/return',
  callbackUrl: process.env.WEBPAY_CALLBACK_URL || 'http://localhost:3000/api/webpay/callback',
  environment: isProduction ? 'production' : 'integration' as const,
};

export { webpayPlus };
