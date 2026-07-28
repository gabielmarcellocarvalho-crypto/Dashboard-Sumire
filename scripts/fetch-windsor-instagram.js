/**
 * fetch-windsor-instagram.js
 * Coleta métricas orgânicas de Instagram via Windsor.ai (connector unificado).
 *
 * Uso:
 *   node --env-file=.env.local scripts/fetch-windsor-instagram.js
 *   node --env-file=.env.local scripts/fetch-windsor-instagram.js --date-preset=last_30d
 *
 * Requer Node >= 20.6 (fetch nativo + suporte a --env-file). Sem dependências externas.
 */

import { mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = join(__dirname, '..');
const OUTPUT_DIR = join(PROJECT_ROOT, 'data', 'windsor');

const WINDSOR_ENDPOINT = 'https://connectors.windsor.ai/instagram';

// Campos solicitados pelo operador (exemplo real de chamada Windsor.ai)
const FIELDS = [
  'date',
  'datasource',
  'account_name',
  'source',
  'followers_count',
  'reach',
  'media_profile_visits',
  'media_reach',
  'likes',
  'comments',
  'media_saved',
  'views',
  'media_engagement',
  'story_interactions',
  'story_views',
  'city',
  'day_of_month',
  'follower_count',
  'website',
];

// Contas Instagram configuradas via ambiente.
// account_id vazio => conta ainda não configurada, será pulada com aviso.
const ACCOUNTS = [
  {
    label: 'Sumirê Perfumaria',
    slug: 'sumire-perfumaria',
    accountId: process.env.WINDSOR_IG_SUMIRE_PERFUMARIA_ACCOUNT_ID,
  },
  {
    label: 'Sumirê Exclusivos',
    slug: 'sumire-exclusivos',
    accountId: process.env.WINDSOR_IG_SUMIRE_EXCLUSIVOS_ACCOUNT_ID,
  },
];

const DEFAULT_DATE_PRESET = 'last_7d';

function parseArgs(argv) {
  const args = { datePreset: DEFAULT_DATE_PRESET };
  for (const raw of argv.slice(2)) {
    const [key, value] = raw.split('=');
    if (key === '--date-preset' && value) args.datePreset = value;
  }
  return args;
}

/** Remove/mascara o api_key de qualquer string antes de logar. */
function maskApiKey(text, apiKey) {
  if (!apiKey) return text;
  return String(text).split(apiKey).join('***MASKED***');
}

function buildUrl({ apiKey, datePreset, accountId }) {
  const params = new URLSearchParams({
    api_key: apiKey,
    date_preset: datePreset,
    fields: FIELDS.join(','),
    select_accounts: accountId,
  });
  return `${WINDSOR_ENDPOINT}?${params.toString()}`;
}

function timestamp() {
  return new Date().toISOString().replace(/[:.]/g, '-');
}

/** Extrai o array de registros do payload do Windsor (costuma vir em { data: [...] }). */
function extractRecords(payload) {
  if (Array.isArray(payload)) return payload;
  if (payload && Array.isArray(payload.data)) return payload.data;
  return [];
}

async function fetchAccount({ apiKey, datePreset, account }) {
  const url = buildUrl({ apiKey, datePreset, accountId: account.accountId });
  const safeUrl = maskApiKey(url, apiKey);

  let response;
  try {
    response = await fetch(url, { headers: { accept: 'application/json' } });
  } catch (err) {
    throw new Error(
      `Falha de rede ao consultar Windsor.ai para "${account.label}": ${err.message}\n  URL: ${safeUrl}`,
    );
  }

  if (!response.ok) {
    let body = '';
    try {
      body = await response.text();
    } catch {
      body = '(sem corpo de resposta)';
    }
    throw new Error(
      `Windsor.ai retornou status ${response.status} (${response.statusText}) para "${account.label}".\n` +
        `  URL: ${safeUrl}\n  Resposta: ${maskApiKey(body, apiKey).slice(0, 500)}`,
    );
  }

  let payload;
  try {
    payload = await response.json();
  } catch (err) {
    throw new Error(
      `Resposta do Windsor.ai para "${account.label}" não é JSON válido: ${err.message}`,
    );
  }

  return payload;
}

async function main() {
  const { datePreset } = parseArgs(process.argv);

  const apiKey = process.env.WINDSOR_AI_API_KEY;
  if (!apiKey) {
    console.error(
      'ERRO: variável WINDSOR_AI_API_KEY não definida. Rode com "node --env-file=.env.local ..." ou "npm run fetch:instagram".',
    );
    process.exit(1);
  }

  console.log(`\n=== Coleta Instagram via Windsor.ai (date_preset=${datePreset}) ===\n`);

  await mkdir(OUTPUT_DIR, { recursive: true });

  const summary = { fetched: [], skipped: [], failed: [] };

  for (const account of ACCOUNTS) {
    if (!account.accountId || account.accountId.trim() === '') {
      console.warn(`- [PULADA] Conta "${account.label}" ainda não configurada (account_id vazio).`);
      summary.skipped.push(account.label);
      continue;
    }

    console.log(`- Puxando "${account.label}" (account_id ...${account.accountId.slice(-4)})...`);

    try {
      const payload = await fetchAccount({ apiKey, datePreset, account });
      const records = extractRecords(payload);

      const filename = `instagram-${account.slug}-${timestamp()}.json`;
      const filepath = join(OUTPUT_DIR, filename);
      await writeFile(filepath, JSON.stringify(payload, null, 2), 'utf8');

      const fieldsReturned = records.length > 0 ? Object.keys(records[0]) : [];
      const missingFields = FIELDS.filter((f) => !fieldsReturned.includes(f));

      console.log(`  OK: ${records.length} registro(s). Salvo em data/windsor/${filename}`);
      if (records.length > 0 && missingFields.length > 0) {
        console.log(`  Aviso: campos pedidos ausentes no retorno: ${missingFields.join(', ')}`);
      }

      summary.fetched.push({
        label: account.label,
        records: records.length,
        file: filename,
        missingFields,
      });
    } catch (err) {
      console.error(`  ERRO: ${err.message}`);
      summary.failed.push({ label: account.label, error: err.message });
    }
  }

  console.log('\n=== Resumo ===');
  console.log(`Contas puxadas: ${summary.fetched.length}`);
  for (const f of summary.fetched) {
    console.log(`  - ${f.label}: ${f.records} registro(s) -> ${f.file}`);
    if (f.missingFields.length > 0) {
      console.log(`      campos ausentes: ${f.missingFields.join(', ')}`);
    }
  }
  console.log(`Contas puladas (sem ID): ${summary.skipped.length}${summary.skipped.length ? ' -> ' + summary.skipped.join(', ') : ''}`);
  console.log(`Contas com erro: ${summary.failed.length}${summary.failed.length ? ' -> ' + summary.failed.map((f) => f.label).join(', ') : ''}`);
  console.log('');

  if (summary.failed.length > 0) process.exit(1);
}

main().catch((err) => {
  console.error(`\nERRO inesperado: ${err.message}`);
  process.exit(1);
});
