import { getToken } from ".";

function isTokenValid() {
  const token = getToken();
  
  if (!token) return false;       // if no token, not valid

  try {
    // split token into 3 parts: header.payload.signature
    const [, payloadBase64] = token.split('.');
    if (!payloadBase64) return false;

    // decode base64 payload into JSON
    const payload = JSON.parse(atob(payloadBase64));

    // extract the "exp" (expiry timestamp, seconds since epoch)
    const exp = payload?.exp;
    if (!exp) return false;

    // current time in seconds (+10s buffer for safety)
    const now = Math.floor(Date.now() / 1000) + 10;

    // valid if expiry is in the future
    return exp > now;
  } catch {
    return false; // if decoding fails, treat as invalid
  }
}

export default isTokenValid;