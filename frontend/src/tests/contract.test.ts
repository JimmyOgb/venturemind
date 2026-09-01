import { describe, it, expect, vi, beforeEach } from 'vitest';
import { VentureMindContractService, BRADBURY_CONFIG } from '../services/contract';
import { encodeCalldata, toHex } from '../services/calldata';

describe('VentureMind Contract Service', () => {
  let service: VentureMindContractService;

  beforeEach(() => {
    service = new VentureMindContractService();
    vi.restoreAllMocks();
  });

  describe('Configuration & Immutable Constants', () => {
    it('uses correct Bradbury contract address', () => {
      expect(service.contractAddress).toBe('0xCB19Df1488aFabA7e5bDB2246C6E6F58fcfe8DF1');
      expect(BRADBURY_CONFIG.chainId).toBe(4221);
      expect(BRADBURY_CONFIG.chainIdHex).toBe('0x107d');
      expect(BRADBURY_CONFIG.rpcUrl).toBe('https://rpc-bradbury.genlayer.com');
    });
  });

  describe('Form Validation Rules', () => {
    it('accepts valid submission payload within all limits', () => {
      const result = service.validateSubmissionInputs({
        name: 'Acme AI',
        website: 'https://acme.example.com',
        sector: 'AI Infrastructure',
        founder: '0x1234567890123456789012345678901234567890',
        documents: ['Pitch deck summary', 'Technical whitepaper overview'],
      });
      expect(result.valid).toBe(true);
      expect(Object.keys(result.errors)).toHaveLength(0);
    });

    it('rejects empty name or oversized name (> 256 chars)', () => {
      const empty = service.validateSubmissionInputs({
        name: '   ',
        website: 'https://acme.example',
        sector: 'AI',
        founder: '0x1234567890123456789012345678901234567890',
        documents: ['doc'],
      });
      expect(empty.valid).toBe(false);
      expect(empty.errors.name).toContain('cannot be empty');

      const oversized = service.validateSubmissionInputs({
        name: 'a'.repeat(257),
        website: 'https://acme.example',
        sector: 'AI',
        founder: '0x1234567890123456789012345678901234567890',
        documents: ['doc'],
      });
      expect(oversized.valid).toBe(false);
      expect(oversized.errors.name).toContain('too long');
    });

    it('rejects invalid or malformed website URLs', () => {
      const invalid = service.validateSubmissionInputs({
        name: 'Acme',
        website: 'ftp://acme.example',
        sector: 'AI',
        founder: '0x1234567890123456789012345678901234567890',
        documents: ['doc'],
      });
      expect(invalid.valid).toBe(false);
      expect(invalid.errors.website).toContain('HTTP or HTTPS');
    });

    it('rejects invalid founder address format', () => {
      const invalid = service.validateSubmissionInputs({
        name: 'Acme',
        website: 'https://acme.example',
        sector: 'AI',
        founder: '0xinvalid',
        documents: ['doc'],
      });
      expect(invalid.valid).toBe(false);
      expect(invalid.errors.founder).toContain('40-character hex EVM address');
    });

    it('rejects more than 5 documents', () => {
      const result = service.validateSubmissionInputs({
        name: 'Acme',
        website: 'https://acme.example',
        sector: 'AI',
        founder: '0x1234567890123456789012345678901234567890',
        documents: ['doc1', 'doc2', 'doc3', 'doc4', 'doc5', 'doc6'],
      });
      expect(result.valid).toBe(false);
      expect(result.errors.documents).toContain('maximum of 5 documents');
    });

    it('rejects individual document exceeding 12,000 characters', () => {
      const result = service.validateSubmissionInputs({
        name: 'Acme',
        website: 'https://acme.example',
        sector: 'AI',
        founder: '0x1234567890123456789012345678901234567890',
        documents: ['a'.repeat(12001)],
      });
      expect(result.valid).toBe(false);
      expect(result.errors.documents).toContain('maximum is 12,000');
    });

    it('rejects combined documents exceeding 50,000 characters', () => {
      const result = service.validateSubmissionInputs({
        name: 'Acme',
        website: 'https://acme.example',
        sector: 'AI',
        founder: '0x1234567890123456789012345678901234567890',
        documents: [
          'a'.repeat(11000),
          'b'.repeat(11000),
          'c'.repeat(11000),
          'd'.repeat(11000),
          'e'.repeat(7000),
        ],
      });
      expect(result.valid).toBe(false);
      expect(result.errors.documents).toContain('maximum is 50,000');
    });
  });

  describe('Contract View Methods (Mocked RPC)', () => {
    it('fetches admin address', async () => {
      const mockAdmin = '0xE4220c4b71877bb94EB173f467ef5c5557017085';
      const encodedAdminHex = toHex(encodeCalldata(mockAdmin));

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          jsonrpc: '2.0',
          result: { data: encodedAdminHex.slice(2) },
          id: 1,
        }),
      } as unknown as Response);

      const admin = await service.getAdmin();
      expect(admin).toBe(mockAdmin);
    });

    it('fetches accepted submission count', async () => {
      const mockCount = '12';
      const encodedCountHex = toHex(encodeCalldata(mockCount));

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          jsonrpc: '2.0',
          result: { data: encodedCountHex.slice(2) },
          id: 1,
        }),
      } as unknown as Response);

      const count = await service.getSubmissionCount();
      expect(count).toBe(12);
    });

    it('returns null when submission does not exist', async () => {
      const mockMissing = JSON.stringify({ error: 'Submission not found.' });
      const encodedMissingHex = toHex(encodeCalldata(mockMissing));

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          jsonrpc: '2.0',
          result: { data: encodedMissingHex.slice(2) },
          id: 1,
        }),
      } as unknown as Response);

      const sub = await service.getSubmission('nonexistent_rep_key');
      expect(sub).toBeNull();
    });

    it('returns parsed submission when submission exists', async () => {
      const mockSubmission = {
        rep_key: '0xabc123',
        name: 'Acme AI',
        website: 'https://acme.example',
        sector: 'AI',
        founder: '0x1234567890123456789012345678901234567890',
        documents: ['Pitch deck'],
        status: 'SUBMITTED',
        report: null,
      };
      const encodedHex = toHex(encodeCalldata(JSON.stringify(mockSubmission)));

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          jsonrpc: '2.0',
          result: { data: encodedHex.slice(2) },
          id: 1,
        }),
      } as unknown as Response);

      const sub = await service.getSubmission('0xabc123');
      expect(sub).not.toBeNull();
      expect(sub?.name).toBe('Acme AI');
      expect(sub?.status).toBe('SUBMITTED');
    });

    it('returns null when report does not exist', async () => {
      const mockMissing = JSON.stringify({ error: 'Report not found.' });
      const encodedMissingHex = toHex(encodeCalldata(mockMissing));

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          jsonrpc: '2.0',
          result: { data: encodedMissingHex.slice(2) },
          id: 1,
        }),
      } as unknown as Response);

      const report = await service.getReport('nonexistent_rep_key');
      expect(report).toBeNull();
    });

    it('returns parsed diligence report when report exists', async () => {
      const mockReport = {
        rep_key: '0xabc123',
        score: 82,
        verdict: 'INVEST',
        assessment: {
          verification: { score: 80, summary: 'Good' },
          team: { score: 80, summary: 'Good' },
          market: { score: 85, summary: 'Good' },
          competition: { score: 80, summary: 'Good' },
          technology: { score: 85, summary: 'Good' },
          financial: { score: 80, summary: 'Good' },
          legal: { score: 80, summary: 'Good' },
          fraud: { score: 10, summary: 'Clean' },
          risk: { score: 85, summary: 'Good' },
          overall_reasoning: 'Strong evidence base',
          confidence: 85,
        },
        reasoning: 'Strong evidence base',
        confidence: 85,
        report_hash: '9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08',
      };
      const encodedHex = toHex(encodeCalldata(JSON.stringify(mockReport)));

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          jsonrpc: '2.0',
          result: { data: encodedHex.slice(2) },
          id: 1,
        }),
      } as unknown as Response);

      const report = await service.getReport('0xabc123');
      expect(report).not.toBeNull();
      expect(report?.score).toBe(82);
      expect(report?.verdict).toBe('INVEST');
      expect(report?.confidence).toBe(85);
      expect(report?.report_hash).toHaveLength(64);
    });
  });

  describe('Transaction Safety & Authorizations', () => {
    it('rejects submit_startup when connected wallet does not match founder address', async () => {
      await expect(
        service.submitStartup(
          {
            name: 'Acme',
            website: 'https://acme.example',
            sector: 'AI',
            founder: '0x1111111111111111111111111111111111111111',
            documents: ['pitch deck'],
          },
          '0x2222222222222222222222222222222222222222' // sender mismatch
        )
      ).rejects.toThrow('Founder address must match the connected wallet');
    });

    it('rejects evaluate_startup when rep_key is empty', async () => {
      await expect(
        service.evaluateStartup('', '0x1111111111111111111111111111111111111111')
      ).rejects.toThrow('rep_key cannot be empty');
    });
  });
});
