import { createSign } from 'node:crypto';

const TOKEN_URL = 'https://oauth2.googleapis.com/token';

function base64url(input: Buffer | string): string {
  return Buffer.from(input).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

/**
 * Autenticação via service account (JWT assertion RS256, node:crypto puro,
 * sem dependência externa). Compartilhado entre GA4 (`lib/data/ga4.ts`) e
 * Search Console (`lib/data/search-console.ts`) — mesmo padrão de credencial
 * Google, escopos diferentes.
 */
export async function getGoogleServiceAccountToken(clientEmail: string, privateKeyRaw: string, scope: string): Promise<string> {
  const privateKey = privateKeyRaw.replace(/\\n/g, '\n');
  const now = Math.floor(Date.now() / 1000);

  const header = base64url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
  const claims = base64url(
    JSON.stringify({
      iss: clientEmail,
      scope,
      aud: TOKEN_URL,
      exp: now + 3600,
      iat: now,
    }),
  );
  const signingInput = `${header}.${claims}`;
  const signature = base64url(createSign('RSA-SHA256').update(signingInput).sign(privateKey));
  const jwt = `${signingInput}.${signature}`;

  const res = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: jwt,
    }).toString(),
    cache: 'no-store',
  });

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`Falha ao autenticar service account do Google (${res.status}): ${body.slice(0, 300)}`);
  }

  const json = (await res.json()) as { access_token?: string };
  if (!json.access_token) throw new Error('Resposta de autenticação do Google sem access_token.');
  return json.access_token;
}
