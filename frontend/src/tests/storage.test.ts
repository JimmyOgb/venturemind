import { describe, it, expect, beforeEach } from 'vitest';
import {
  saveLocalSubmission,
  getLocalSubmissions,
  removeLocalSubmission,
} from '../services/storage';

describe('Local Storage Service', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('saves and retrieves submissions keyed by founder address', () => {
    const founder = '0x1234567890123456789012345678901234567890';
    const meta = {
      rep_key: '0xrepkey1',
      name: 'Alpha AI',
      website: 'https://alpha.example',
      sector: 'AI',
      founder,
      timestamp: 1700000000000,
    };

    saveLocalSubmission(founder, meta);
    const list = getLocalSubmissions(founder);

    expect(list).toHaveLength(1);
    expect(list[0].rep_key).toBe('0xrepkey1');
    expect(list[0].name).toBe('Alpha AI');
  });

  it('avoids duplicate entries with same rep_key', () => {
    const founder = '0x1234567890123456789012345678901234567890';
    const meta = {
      rep_key: '0xrepkey1',
      name: 'Alpha AI',
      website: 'https://alpha.example',
      sector: 'AI',
      founder,
      timestamp: 1700000000000,
    };

    saveLocalSubmission(founder, meta);
    saveLocalSubmission(founder, { ...meta, name: 'Alpha AI Updated' });
    const list = getLocalSubmissions(founder);

    expect(list).toHaveLength(1);
    expect(list[0].name).toBe('Alpha AI Updated');
  });

  it('removes submission by rep_key', () => {
    const founder = '0x1234567890123456789012345678901234567890';
    saveLocalSubmission(founder, {
      rep_key: '0xrepkey1',
      name: 'Alpha AI',
      website: 'https://alpha.example',
      sector: 'AI',
      founder,
      timestamp: 1700000000000,
    });
    saveLocalSubmission(founder, {
      rep_key: '0xrepkey2',
      name: 'Beta AI',
      website: 'https://beta.example',
      sector: 'AI',
      founder,
      timestamp: 1700000000000,
    });

    expect(getLocalSubmissions(founder)).toHaveLength(2);
    removeLocalSubmission(founder, '0xrepkey1');
    const remaining = getLocalSubmissions(founder);
    expect(remaining).toHaveLength(1);
    expect(remaining[0].rep_key).toBe('0xrepkey2');
  });
});
