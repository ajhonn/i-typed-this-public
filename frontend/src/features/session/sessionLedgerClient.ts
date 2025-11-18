type LedgerRegistrationResponse = {
  receiptId: string;
  sessionId: string;
  sessionHash: string;
  hashVersion: string;
  firstSeenAt: string;
};

type LedgerVerificationResponse = {
  status: 'verified' | 'mismatch' | 'unknown';
  receiptId?: string;
  sessionId?: string;
  firstSeenAt?: string;
};

type RegisterLedgerInput = {
  sessionId: string;
  sessionHash: string;
  hashVersion?: string;
  metadata?: Record<string, unknown>;
};

type VerifyLedgerInput = {
  receiptId: string;
  sessionId: string;
  sessionHash: string;
};

const normalizeBaseUrl = (value: string | undefined) => {
  if (!value) return '';
  return value.replace(/\s+/g, '').replace(/\/+$/, '');
};

const LEDGER_BASE_URL = normalizeBaseUrl(import.meta.env.VITE_LEDGER_API_BASE_URL);
const LEDGER_API_KEY = import.meta.env.VITE_LEDGER_API_KEY?.trim();
const DEFAULT_HASH_VERSION = 'v1';

const hasFetch = typeof fetch === 'function';

const buildUrl = (path: string) => {
  if (!LEDGER_BASE_URL) return '';
  return `${LEDGER_BASE_URL}${path.startsWith('/') ? path : `/${path}`}`;
};

const buildHeaders = (needsAuth: boolean) => {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (needsAuth && LEDGER_API_KEY) {
    headers['X-API-Key'] = LEDGER_API_KEY;
  }
  return headers;
};

const handleResponse = async (response: Response) => {
  const contentType = response.headers.get('content-type') ?? '';
  const isJson = contentType.includes('application/json');
  const payload = isJson ? await response.json() : await response.text();

  if (!response.ok) {
    const detail =
      typeof payload === 'string'
        ? payload
        : payload?.detail || payload?.message || `${response.status} ${response.statusText}`;
    throw new Error(detail);
  }

  return payload;
};

export const isLedgerEnabled = () => Boolean(LEDGER_BASE_URL) && hasFetch;

export const registerSessionLedger = async (
  input: RegisterLedgerInput,
): Promise<LedgerRegistrationResponse | null> => {
  if (!isLedgerEnabled()) {
    return null;
  }

  const response = await fetch(buildUrl('/api/v1/hashes/'), {
    method: 'POST',
    headers: buildHeaders(true),
    body: JSON.stringify({
      sessionId: input.sessionId,
      sessionHash: input.sessionHash,
      hashVersion: input.hashVersion ?? DEFAULT_HASH_VERSION,
      metadata: input.metadata ?? {},
    }),
  });

  return (await handleResponse(response)) as LedgerRegistrationResponse;
};

export const verifySessionLedger = async (
  input: VerifyLedgerInput,
): Promise<LedgerVerificationResponse | null> => {
  if (!isLedgerEnabled()) {
    return null;
  }

  const response = await fetch(buildUrl('/api/v1/hashes/verify'), {
    method: 'POST',
    headers: buildHeaders(false),
    body: JSON.stringify({
      receiptId: input.receiptId,
      sessionId: input.sessionId,
      sessionHash: input.sessionHash,
    }),
  });

  return (await handleResponse(response)) as LedgerVerificationResponse;
};
