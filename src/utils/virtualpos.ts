import jwt from 'jsonwebtoken';

const VIRTUALPOS_API_KEY = process.env.VIRTUALPOS_API_KEY || '';
const VIRTUALPOS_SECRET_KEY = process.env.VIRTUALPOS_SECRET_KEY || '';
export const VIRTUALPOS_API_URL = process.env.VIRTUALPOS_API_URL || 'https://sandbox.virtualpos.cl/api';

export const signRequest = (payload: any) => {
  if (!VIRTUALPOS_SECRET_KEY) {
    console.error("Missing VIRTUALPOS_SECRET_KEY");
  }

  // The payload MUST include the api_key and should NOT include 'iat' (timestamp)
  const payloadToSign = {
    api_key: VIRTUALPOS_API_KEY,
    ...payload
  };

  return jwt.sign(payloadToSign, VIRTUALPOS_SECRET_KEY, {
    algorithm: 'HS256',
    noTimestamp: true
  });
};

export const getAuthHeaders = (signature: string) => {
    return {
        "Authorization": VIRTUALPOS_API_KEY,
        "Signature": signature,
        "Content-Type": "application/json",
    };
}
