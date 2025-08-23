// utils/s3PublicUrl.js
export function makePublicUrlFromKey(key) {
  if (!key) return '';
  if (/^https?:\/\//i.test(key)) return key;

  const bucket = import.meta.env.VITE_AWS_PUBLIC_BUCKET;
  const region = import.meta.env.VITE_AWS_PUBLIC_REGION || import.meta.env.AWS_REGION || 'ap-south-1';
  const encodedKey = encodeURI(key).replace(/#/g, '%23');

  const host =
    region === 'us-east-1'
      ? `https://${bucket}.s3.amazonaws.com`
      : `https://${bucket}.s3.${region}.amazonaws.com`;

  return `${host}/${encodedKey.replace(/^\/+/, '')}`;
}

