const EXPECTED_HASH = '0e26117e73101e733d6d7e65033838b1ef6899fc627b0121be2bb018c54d5ae3';

export async function sha256(text: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(text);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export async function verifyPassword(password: string): Promise<boolean> {
  const hash = await sha256(password);
  return hash === EXPECTED_HASH;
}
