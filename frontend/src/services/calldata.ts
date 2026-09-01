import { DimensionKey, FullAssessment, Verdict } from '../types/contract';

const BITS_IN_TYPE = 3;
const TYPE_SPECIAL = 0;
const TYPE_PINT = 1;
const TYPE_NINT = 2;
const TYPE_STR = 4;
const TYPE_ARR = 5;
const TYPE_MAP = 6;
const SPECIAL_NULL = (0 << BITS_IN_TYPE) | TYPE_SPECIAL;
const SPECIAL_FALSE = (1 << BITS_IN_TYPE) | TYPE_SPECIAL;
const SPECIAL_TRUE = (2 << BITS_IN_TYPE) | TYPE_SPECIAL;

export const DIMENSION_WEIGHTS: Record<DimensionKey, number> = {
  verification: 10,
  team: 10,
  market: 15,
  competition: 10,
  technology: 15,
  financial: 15,
  legal: 5,
  fraud: 10,
  risk: 10,
};

export const DIMENSION_LABELS: Record<DimensionKey, { name: string; description: string }> = {
  verification: {
    name: 'Verification & Factual Consistency',
    description: 'Internal consistency, evidence plausibility, and claims grounding',
  },
  team: {
    name: 'Team & Execution Capability',
    description: 'Founding team background, domain expertise, and operational credentials',
  },
  market: {
    name: 'Market Opportunity & Timing',
    description: 'Total addressable market, macro tailwinds, and customer demand dynamics',
  },
  competition: {
    name: 'Competition & Defensibility',
    description: 'Competitive landscape understanding, differentiation, and structural moats',
  },
  technology: {
    name: 'Technology & Feasibility',
    description: 'Technical architecture feasibility, IP, and engineering milestones',
  },
  financial: {
    name: 'Financials & Unit Economics',
    description: 'Monetization model, burn rate, pricing power, and capital efficiency',
  },
  legal: {
    name: 'Legal & Regulatory Standing',
    description: 'Compliance, regulatory exposure, and corporate structure integrity',
  },
  fraud: {
    name: 'Fraud & Deception Signals',
    description: 'Signals of misrepresentation (High score is negative; inverted in composite)',
  },
  risk: {
    name: 'Risk Resilience & Quality',
    description: 'Operational contingency planning and execution robustness (High is positive)',
  },
};

function writeNum(to: number[], data: bigint) {
  if (data === 0n) {
    to.push(0);
    return;
  }
  let current = data;
  while (current > 0n) {
    let cur = Number(current & 0x7fn);
    current >>= 7n;
    if (current > 0n) cur |= 128;
    to.push(cur);
  }
}

function encodeNumWithType(to: number[], data: bigint, type: number) {
  const res = (data << BigInt(BITS_IN_TYPE)) | BigInt(type);
  writeNum(to, res);
}

function encodeImpl(to: number[], data: unknown) {
  if (data === null || data === undefined) {
    to.push(SPECIAL_NULL);
    return;
  }
  if (data === true) {
    to.push(SPECIAL_TRUE);
    return;
  }
  if (data === false) {
    to.push(SPECIAL_FALSE);
    return;
  }
  if (typeof data === 'number') {
    encodeNumWithType(to, BigInt(data), data >= 0 ? TYPE_PINT : TYPE_NINT);
    return;
  }
  if (typeof data === 'bigint') {
    encodeNumWithType(to, data, data >= 0n ? TYPE_PINT : TYPE_NINT);
    return;
  }
  if (typeof data === 'string') {
    const str = new TextEncoder().encode(data);
    encodeNumWithType(to, BigInt(str.length), TYPE_STR);
    for (const c of str) to.push(c);
    return;
  }
  if (Array.isArray(data)) {
    encodeNumWithType(to, BigInt(data.length), TYPE_ARR);
    for (const c of data) encodeImpl(to, c);
    return;
  }
  if (typeof data === 'object') {
    // Map keys MUST be sorted alphabetically for GenLayer decoder
    const entries = Object.entries(data as Record<string, unknown>).sort(([k1], [k2]) =>
      k1.localeCompare(k2)
    );
    encodeNumWithType(to, BigInt(entries.length), TYPE_MAP);
    for (const [k, v] of entries) {
      const keyBytes = new TextEncoder().encode(k);
      writeNum(to, BigInt(keyBytes.length));
      for (const c of keyBytes) to.push(c);
      encodeImpl(to, v);
    }
  }
}

export function encodeCalldata(data: unknown): Uint8Array {
  const arr: number[] = [];
  encodeImpl(arr, data);
  return new Uint8Array(arr);
}

export function toHex(bytes: Uint8Array): `0x${string}` {
  return ('0x' +
    Array.from(bytes)
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('')) as `0x${string}`;
}

export function toRlp(items: string[]): `0x${string}` {
  function encodeItem(hexStr: string): string {
    const clean = hexStr.startsWith('0x') ? hexStr.slice(2) : hexStr;
    const len = clean.length / 2;
    if (len === 1 && parseInt(clean, 16) < 0x80) {
      return clean;
    }
    if (len <= 55) {
      return (0x80 + len).toString(16).padStart(2, '0') + clean;
    }
    const lenHex = len.toString(16);
    const lenLen = lenHex.length % 2 === 0 ? lenHex.length / 2 : (lenHex.length + 1) / 2;
    const paddedLenHex = lenHex.padStart(lenLen * 2, '0');
    return (0xb7 + lenLen).toString(16).padStart(2, '0') + paddedLenHex + clean;
  }
  const payload = items.map(encodeItem).join('');
  const totalLen = payload.length / 2;
  let prefix: string;
  if (totalLen <= 55) {
    prefix = (0xc0 + totalLen).toString(16).padStart(2, '0');
  } else {
    const lenHex = totalLen.toString(16);
    const lenLen = lenHex.length % 2 === 0 ? lenHex.length / 2 : (lenHex.length + 1) / 2;
    const paddedLenHex = lenHex.padStart(lenLen * 2, '0');
    prefix = (0xf7 + lenLen).toString(16).padStart(2, '0') + paddedLenHex;
  }
  return `0x${prefix}${payload}`;
}

export function decodeCalldata(hexStr: string): unknown {
  const clean = hexStr.startsWith('0x') ? hexStr.slice(2) : hexStr;
  if (!clean) return null;
  const bytes = new Uint8Array(
    clean.match(/.{1,2}/g)?.map((byte) => parseInt(byte, 16)) || []
  );
  const index = { i: 0 };

  function readULeb128(): bigint {
    let res = 0n;
    let accum = 0n;
    let shouldContinue = true;
    while (shouldContinue && index.i < bytes.length) {
      const byte = bytes[index.i];
      index.i++;
      const rest = byte & 127;
      res += BigInt(rest) * (1n << accum);
      accum += 7n;
      shouldContinue = byte >= 128;
    }
    return res;
  }

  function decode(): unknown {
    if (index.i >= bytes.length) return null;
    const cur = readULeb128();
    if (cur === BigInt(SPECIAL_NULL)) return null;
    if (cur === BigInt(SPECIAL_TRUE)) return true;
    if (cur === BigInt(SPECIAL_FALSE)) return false;

    const type = Number(cur & 0x07n);
    const rest = cur >> 3n;
    if (type === TYPE_STR) {
      const len = Number(rest);
      const strBytes = bytes.slice(index.i, index.i + len);
      index.i += len;
      return new TextDecoder('utf-8').decode(strBytes);
    }
    if (type === TYPE_PINT) return Number(rest);
    if (type === TYPE_NINT) return Number(-1n - rest);
    if (type === TYPE_ARR) {
      const arr: unknown[] = [];
      for (let i = 0; i < Number(rest); i++) {
        arr.push(decode());
      }
      return arr;
    }
    if (type === TYPE_MAP) {
      const obj: Record<string, unknown> = {};
      for (let i = 0; i < Number(rest); i++) {
        const keyLen = Number(readULeb128());
        const keyBytes = bytes.slice(index.i, index.i + keyLen);
        index.i += keyLen;
        const key = new TextDecoder('utf-8').decode(keyBytes);
        obj[key] = decode();
      }
      return obj;
    }
    return null;
  }

  return decode();
}

/**
 * Conservative website canonicalization matching Python contract `_normalize_website`
 */
export function normalizeWebsite(website: string): string {
  const candidate = website.trim();
  if (!candidate || /\s/.test(candidate)) {
    throw new Error('Website must be a valid HTTP or HTTPS URL.');
  }

  let url: URL;
  try {
    url = new URL(candidate);
  } catch {
    throw new Error('Website must be a valid HTTP or HTTPS URL.');
  }

  const scheme = url.protocol.replace(':', '').toLowerCase();
  if (scheme !== 'http' && scheme !== 'https') {
    throw new Error('Website must be a valid HTTP or HTTPS URL.');
  }
  if (!url.hostname || url.username || url.password) {
    throw new Error('Website must be a valid HTTP or HTTPS URL.');
  }

  const canonicalHost = url.hostname.toLowerCase();
  const defaultPort = scheme === 'http' ? '80' : '443';
  let canonicalNetloc = canonicalHost;
  if (url.port && url.port !== defaultPort) {
    canonicalNetloc += `:${url.port}`;
  }

  let path = url.pathname;
  if (path === '/') {
    path = '';
  }

  const query = url.search;
  return `${scheme}://${canonicalNetloc}${path}${query}`;
}

/**
 * Pure JS SHA-256 implementation for universal browser / node compatibility
 */
function sha256Pure(ascii: string): string {
  function rightRotate(value: number, amount: number) {
    return (value >>> amount) | (value << (32 - amount));
  }

  const mathPow = Math.pow;
  const maxWord = mathPow(2, 32);
  let i = 0;
  let j = 0;
  let result = '';

  const words: number[] = [];
  const asciiBitLength = ascii.length * 8;

  const hash: number[] = [];
  const k: number[] = [];
  let primeCounter = 0;

  const isComposite: Record<number, number> = {};
  for (let candidate = 2; primeCounter < 64; candidate++) {
    if (!isComposite[candidate]) {
      for (i = 0; i < 300; i += candidate) {
        isComposite[i] = candidate;
      }
      hash[primeCounter] = (mathPow(candidate, 0.5) * maxWord) | 0;
      k[primeCounter++] = (mathPow(candidate, 1 / 3) * maxWord) | 0;
    }
  }

  ascii += '\x80';
  while ((ascii.length % 64) - 56) ascii += '\x00';
  for (i = 0; i < ascii.length; i++) {
    j = ascii.charCodeAt(i);
    if (j >> 8) return '';
    words[i >> 2] |= j << (((3 - i) % 4) * 8);
  }
  words[words.length] = (asciiBitLength / maxWord) | 0;
  words[words.length] = asciiBitLength;

  for (j = 0; j < words.length; ) {
    const w = words.slice(j, (j += 16));
    const oldHash = hash.slice(0);

    for (i = 0; i < 64; i++) {
      const w15 = w[i - 15];
      const w2 = w[i - 2];

      const s0 = rightRotate(w15, 7) ^ rightRotate(w15, 18) ^ (w15 >>> 3);
      const s1 = rightRotate(w2, 17) ^ rightRotate(w2, 19) ^ (w2 >>> 10);
      w[i] =
        i < 16
          ? w[i]
          : (w[i - 16] + s0 + w[i - 7] + s1) | 0;

      const s1_ =
        rightRotate(hash[4], 6) ^ rightRotate(hash[4], 11) ^ rightRotate(hash[4], 25);
      const ch = (hash[4] & hash[5]) ^ (~hash[4] & hash[6]);
      const temp1 = (hash[7] + s1_ + ch + k[i] + w[i]) | 0;
      const s0_ =
        rightRotate(hash[0], 2) ^ rightRotate(hash[0], 13) ^ rightRotate(hash[0], 22);
      const maj =
        (hash[0] & hash[1]) ^ (hash[0] & hash[2]) ^ (hash[1] & hash[2]);
      const temp2 = (s0_ + maj) | 0;

      hash[7] = hash[6];
      hash[6] = hash[5];
      hash[5] = hash[4];
      hash[4] = (hash[3] + temp1) | 0;
      hash[3] = hash[2];
      hash[2] = hash[1];
      hash[1] = hash[0];
      hash[0] = (temp1 + temp2) | 0;
    }

    for (i = 0; i < 8; i++) {
      hash[i] = (hash[i] + oldHash[i]) | 0;
    }
  }

  for (i = 0; i < 8; i++) {
    for (j = 3; j >= 0; j--) {
      const b = (hash[i] >> (j * 8)) & 255;
      result += (b < 16 ? '0' : '') + b.toString(16);
    }
  }
  return result;
}

/**
 * Compute SHA256 rep_key from canonical website and founder address
 */
export async function computeRepKey(website: string, founderAddress: string): Promise<string> {
  const canonicalWeb = normalizeWebsite(website);
  const normalizedFounder = founderAddress.trim().toLowerCase();
  const input = `${canonicalWeb}:${normalizedFounder}`;

  if (typeof globalThis !== 'undefined' && globalThis.crypto?.subtle) {
    try {
      const encoded = new TextEncoder().encode(input);
      const hashBuffer = await globalThis.crypto.subtle.digest('SHA-256', encoded);
      return Array.from(new Uint8Array(hashBuffer))
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('');
    } catch {
      // Fallback to pure JS SHA-256
    }
  }

  return sha256Pure(input);
}

/**
 * Deterministic integer scoring matching Python contract `_calculate_score`
 */
export function calculateScore(assessment: FullAssessment): number {
  let weightedTotal = 0;
  const dimensions: DimensionKey[] = [
    'verification',
    'team',
    'market',
    'competition',
    'technology',
    'financial',
    'legal',
    'fraud',
    'risk',
  ];

  for (const dim of dimensions) {
    let score = assessment[dim].score;
    if (dim === 'fraud') {
      score = 100 - score;
    }
    weightedTotal += score * DIMENSION_WEIGHTS[dim];
  }

  return Math.floor(weightedTotal / 100);
}

/**
 * Verdict calculation matching Python contract `_calculate_verdict`
 */
export function calculateVerdict(score: number): Verdict {
  if (score >= 75) return 'INVEST';
  if (score >= 45) return 'MONITOR';
  return 'REJECT';
}

/**
 * Prompt injection marker sanitization preview matching contract `_sanitize_document`
 */
export function sanitizeDocumentPreview(doc: string): string {
  const markers = [
    'SYSTEM_PROMPT:',
    'IGNORE_INSTRUCTIONS',
    'ignore previous',
    'ignore all previous',
    'developer message',
    'system message',
  ];
  let sanitized = doc;
  for (const marker of markers) {
    const regex = new RegExp(marker.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
    sanitized = sanitized.replace(regex, '[SANITIZED]');
  }
  return sanitized;
}
