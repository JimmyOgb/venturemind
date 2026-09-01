import { LocalSubmissionMeta } from '../types/contract';

const STORAGE_PREFIX = 'venturemind_submissions_';

export function saveLocalSubmission(
  founderAddress: string,
  meta: LocalSubmissionMeta
): void {
  if (typeof window === 'undefined') return;
  const key = `${STORAGE_PREFIX}${founderAddress.toLowerCase()}`;
  try {
    const existing = getLocalSubmissions(founderAddress);
    const filtered = existing.filter((item) => item.rep_key !== meta.rep_key);
    filtered.unshift(meta);
    localStorage.setItem(key, JSON.stringify(filtered));
  } catch (e) {
    console.warn('Failed to save submission to localStorage:', e);
  }
}

export function getLocalSubmissions(founderAddress: string): LocalSubmissionMeta[] {
  if (typeof window === 'undefined' || !founderAddress) return [];
  const key = `${STORAGE_PREFIX}${founderAddress.toLowerCase()}`;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed;
    }
  } catch {
    // Ignore parse error
  }
  return [];
}

export function removeLocalSubmission(founderAddress: string, repKey: string): void {
  if (typeof window === 'undefined' || !founderAddress) return;
  const key = `${STORAGE_PREFIX}${founderAddress.toLowerCase()}`;
  try {
    const existing = getLocalSubmissions(founderAddress);
    const filtered = existing.filter((item) => item.rep_key !== repKey);
    localStorage.setItem(key, JSON.stringify(filtered));
  } catch (e) {
    console.warn('Failed to remove submission from localStorage:', e);
  }
}
