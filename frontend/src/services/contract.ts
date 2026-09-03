import {
  DiligenceReport,
  NetworkConfig,
  StartupSubmission,
} from '../types/contract';
import {
  decodeCalldata,
  encodeCalldata,
  normalizeWebsite,
  toHex,
  toRlp,
  computeRepKey,
} from './calldata';

export const BRADBURY_CONFIG: NetworkConfig = {
  name: 'GenLayer Bradbury',
  chainId: Number(import.meta.env.VITE_GENLAYER_CHAIN_ID || 4221),
  chainIdHex: '0x107d',
  rpcUrl: import.meta.env.VITE_GENLAYER_RPC_URL || 'https://rpc-bradbury.genlayer.com',
  explorerUrl: import.meta.env.VITE_GENLAYER_EXPLORER_URL || 'https://scan-bradbury.genlayer.com',
  contractAddress:
    import.meta.env.VITE_VENTUREMIND_CONTRACT_ADDRESS ||
    '0xc350Cd4E4E6254FB72903cD803f354a993C907D1',
  deploymentTx: '0x0350e3661a814b8631cdcbf31fd1bc9cdcd4cfedc8246eca881a30075add0f38',
};

// Historical v1 contract deployment (reference only)
export const HISTORICAL_V1_CONTRACT = '0xCB19Df1488aFabA7e5bDB2246C6E6F58fcfe8DF1';

// Bradbury Consensus Contract Address for transaction submission
export const BRADBURY_CONSENSUS_CONTRACT = '0xb7278A61aa25c888815aFC32Ad3cC52fF24fE575';

export interface SubmitStartupInput {
  name: string;
  website: string;
  sector: string;
  founder: string;
  documents: string[];
  externalSources?: import('../types/contract').ExternalSourceInput[];
}

export class VentureMindContractService {
  private rpcUrl: string;
  public contractAddress: string;

  constructor(rpcUrl = BRADBURY_CONFIG.rpcUrl, contractAddress = BRADBURY_CONFIG.contractAddress) {
    this.rpcUrl = rpcUrl;
    this.contractAddress = contractAddress;
  }

  /**
   * Execute read view method on contract via gen_call
   */
  public async callViewMethod<T = unknown>(method: string, args: unknown[] = []): Promise<T> {
    const cd = encodeCalldata({ method, args });
    const leaderOnly = encodeCalldata(false);
    const serialized = toRlp([toHex(cd), toHex(leaderOnly)]);

    const payload = {
      jsonrpc: '2.0',
      id: Date.now(),
      method: 'gen_call',
      params: [
        {
          type: 'read',
          to: this.contractAddress,
          from: '0x0000000000000000000000000000000000000000',
          data: serialized,
          transaction_hash_variant: 'latest-nonfinal',
        },
      ],
    };

    let response: Response;
    try {
      response = await fetch(this.rpcUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      throw new Error(`RPC connection failure (${this.rpcUrl}): ${errorMsg}`);
    }

    if (!response.ok) {
      throw new Error(`HTTP ${response.status} from GenLayer RPC`);
    }

    const json = await response.json();
    if (json.error) {
      throw new Error(`Contract view call failed: ${json.error.message || JSON.stringify(json.error)}`);
    }

    if (!json.result || typeof json.result.data !== 'string') {
      throw new Error('Malformed or empty result data from contract view');
    }

    const decoded = decodeCalldata(json.result.data);
    return decoded as T;
  }

  /**
   * Fetch admin address from contract
   */
  public async getAdmin(): Promise<string> {
    const raw = await this.callViewMethod<string>('get_admin', []);
    if (!raw || typeof raw !== 'string') {
      throw new Error('Invalid get_admin response format');
    }
    return raw;
  }

  /**
   * Fetch accepted submission count from contract
   */
  public async getSubmissionCount(): Promise<number> {
    const raw = await this.callViewMethod<string>('get_submission_count', []);
    const count = parseInt(raw, 10);
    if (isNaN(count)) {
      throw new Error(`Invalid submission count format: ${raw}`);
    }
    return count;
  }

  /**
   * Fetch startup submission by rep_key
   */
  public async getSubmission(repKey: string): Promise<StartupSubmission | null> {
    if (!repKey || !repKey.trim()) {
      return null;
    }
    const raw = await this.callViewMethod<string>('get_submission', [repKey.trim()]);
    if (!raw) return null;

    try {
      const parsed = JSON.parse(raw);
      if (parsed.error) {
        return null;
      }
      return parsed as StartupSubmission;
    } catch {
      throw new Error(`Malformed JSON in submission response: ${raw}`);
    }
  }

  /**
   * Fetch diligence report by rep_key
   */
  public async getReport(repKey: string): Promise<DiligenceReport | null> {
    if (!repKey || !repKey.trim()) {
      return null;
    }
    const raw = await this.callViewMethod<string>('get_report', [repKey.trim()]);
    if (!raw) return null;

    try {
      const parsed = JSON.parse(raw);
      if (parsed.error) {
        return null;
      }
      return parsed as DiligenceReport;
    } catch {
      throw new Error(`Malformed JSON in report response: ${raw}`);
    }
  }

  /**
   * Validate submission payload against contract rules before sending
   */
  public validateSubmissionInputs(input: SubmitStartupInput): { valid: boolean; errors: Record<string, string> } {
    const errors: Record<string, string> = {};

    if (!input.name.trim()) {
      errors.name = 'Startup name cannot be empty.';
    } else if (input.name.trim().length > 256) {
      errors.name = 'Startup name is too long (max 256 characters).';
    }

    if (!input.website.trim()) {
      errors.website = 'Website cannot be empty.';
    } else {
      try {
        normalizeWebsite(input.website);
      } catch (err: unknown) {
        errors.website = err instanceof Error ? err.message : 'Website must be a valid HTTP or HTTPS URL.';
      }
    }

    if (!input.sector.trim()) {
      errors.sector = 'Sector cannot be empty.';
    } else if (input.sector.trim().length > 256) {
      errors.sector = 'Sector is too long (max 256 characters).';
    }

    if (!input.founder.trim()) {
      errors.founder = 'Founder address cannot be empty.';
    } else if (!/^0x[a-fA-F0-9]{40}$/.test(input.founder.trim())) {
      errors.founder = 'Founder address must be a valid 40-character hex EVM address.';
    }

    if (!Array.isArray(input.documents)) {
      errors.documents = 'Documents must be an array.';
    } else if (input.documents.length > 5) {
      errors.documents = 'A maximum of 5 documents is allowed.';
    } else {
      let combinedLength = 0;
      for (let i = 0; i < input.documents.length; i++) {
        const doc = input.documents[i];
        if (typeof doc !== 'string') {
          errors.documents = `Document #${i + 1} must be a string.`;
          break;
        }
        if (doc.length > 12_000) {
          errors.documents = `Document #${i + 1} is too large (${doc.length} characters; maximum is 12,000).`;
          break;
        }
        combinedLength += doc.length;
      }
      if (!errors.documents && combinedLength > 50_000) {
        errors.documents = `Combined documents content is too large (${combinedLength} characters; maximum is 50,000).`;
      }

      const rawJson = JSON.stringify(input.documents);
      if (!errors.documents && rawJson.length > 64_000) {
        errors.documents = `Raw documents JSON is too large (${rawJson.length} bytes; maximum is 64,000).`;
      }
    }

    if (input.externalSources !== undefined) {
      if (!Array.isArray(input.externalSources)) {
        errors.externalSources = 'External sources must be an array.';
      } else if (input.externalSources.length > 3) {
        errors.externalSources = 'A maximum of 3 external sources is allowed.';
      } else {
        const validCategories = [
          'official_registry',
          'regulatory_filing',
          'authoritative_dataset',
          'domain_record',
          'founder_selected',
        ];
        for (let i = 0; i < input.externalSources.length; i++) {
          const src = input.externalSources[i];
          if (!src || typeof src !== 'object') {
            errors.externalSources = `External source #${i + 1} must be an object.`;
            break;
          }
          if (!src.url || !src.url.trim()) {
            errors.externalSources = `External source #${i + 1} URL cannot be empty.`;
            break;
          }
          try {
            normalizeWebsite(src.url);
          } catch {
            errors.externalSources = `External source #${i + 1} has an invalid HTTP/HTTPS URL.`;
            break;
          }
          if (src.category && !validCategories.includes(src.category)) {
            errors.externalSources = `External source #${i + 1} has an invalid category: ${src.category}`;
            break;
          }
          if (src.description && src.description.length > 256) {
            errors.externalSources = `External source #${i + 1} description is too long (max 256 characters).`;
            break;
          }
        }
        const rawExtJson = JSON.stringify(input.externalSources);
        if (!errors.externalSources && rawExtJson.length > 8000) {
          errors.externalSources = `External sources JSON is too large (max 8,000 bytes).`;
        }
      }
    }

    return {
      valid: Object.keys(errors).length === 0,
      errors,
    };
  }

  /**
   * Submit startup transaction calling `submit_startup`
   */
  public async submitStartup(
    input: SubmitStartupInput,
    senderAddress: string
  ): Promise<{ txHash: string; repKey: string }> {
    const validation = this.validateSubmissionInputs(input);
    if (!validation.valid) {
      const firstError = Object.values(validation.errors)[0];
      throw new Error(`Validation error: ${firstError}`);
    }

    const normalizedSender = senderAddress.trim().toLowerCase();
    const normalizedFounder = input.founder.trim().toLowerCase();
    if (normalizedSender !== normalizedFounder) {
      throw new Error('Founder address must match the connected wallet submitting this transaction.');
    }

    const canonicalWebsite = normalizeWebsite(input.website);
    const repKey = await computeRepKey(canonicalWebsite, normalizedFounder);

    // Encode write method calldata: submit_startup(name, website, sector, founder_address, documents_json, external_sources_json)
    const documentsJson = JSON.stringify(input.documents);
    const externalSourcesJson = JSON.stringify(input.externalSources || []);
    const args: string[] = [
      input.name.trim(),
      canonicalWebsite,
      input.sector.trim(),
      input.founder.trim(),
      documentsJson,
      externalSourcesJson,
    ];

    const cd = encodeCalldata({ method: 'submit_startup', args });
    const leaderOnly = encodeCalldata(false);
    const serializedCalldata = toRlp([toHex(cd), toHex(leaderOnly)]);

    const txHash = await this.sendWriteTransaction(senderAddress, serializedCalldata);
    return { txHash, repKey };
  }

  /**
   * Evaluate startup transaction calling `evaluate_startup(rep_key)`
   */
  public async evaluateStartup(repKey: string, senderAddress: string): Promise<{ txHash: string }> {
    if (!repKey || !repKey.trim()) {
      throw new Error('rep_key cannot be empty.');
    }

    const cd = encodeCalldata({ method: 'evaluate_startup', args: [repKey.trim()] });
    const leaderOnly = encodeCalldata(false);
    const serializedCalldata = toRlp([toHex(cd), toHex(leaderOnly)]);

    const txHash = await this.sendWriteTransaction(senderAddress, serializedCalldata);
    return { txHash };
  }

  /**
   * Helper to send transaction through injected wallet provider
   */
  private async sendWriteTransaction(senderAddress: string, dataHex: string): Promise<string> {
    if (typeof window === 'undefined' || !(window as unknown as { ethereum?: unknown }).ethereum) {
      throw new Error('No Ethereum-compatible wallet detected. Please install MetaMask, Rabby, or a Web3 wallet.');
    }

    const ethereum = (window as unknown as { ethereum: { request: (args: { method: string; params: unknown[] }) => Promise<unknown> } }).ethereum;

    // Check chain ID
    const currentChainIdHex = (await ethereum.request({ method: 'eth_chainId', params: [] })) as string;
    const currentChainId = parseInt(currentChainIdHex, 16);
    if (currentChainId !== BRADBURY_CONFIG.chainId) {
      throw new Error(
        `Wrong network (${currentChainId}). Please switch to ${BRADBURY_CONFIG.name} (Chain ID ${BRADBURY_CONFIG.chainId}).`
      );
    }

    try {
      const txHash = (await ethereum.request({
        method: 'eth_sendTransaction',
        params: [
          {
            from: senderAddress,
            to: this.contractAddress,
            data: dataHex,
            value: '0x0',
          },
        ],
      })) as string;

      return txHash;
    } catch (err: unknown) {
      const errorObj = err as { code?: number; message?: string };
      if (errorObj?.code === 4001 || errorObj?.message?.includes('User rejected')) {
        throw new Error('Transaction was cancelled by user.');
      }
      throw new Error(errorObj?.message || 'Failed to send transaction.');
    }
  }

  /**
   * Poll for transaction finality and report readiness
   */
  public async pollForReport(repKey: string, maxAttempts = 30, intervalMs = 3000): Promise<DiligenceReport> {
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        const report = await this.getReport(repKey);
        if (report && report.verdict && report.score !== undefined) {
          return report;
        }
      } catch {
        // Continue polling
      }
      await new Promise((resolve) => setTimeout(resolve, intervalMs));
    }
    throw new Error(
      'Evaluation timed out waiting for consensus confirmation. Your submission remains available for verification.'
    );
  }
}

export const contractService = new VentureMindContractService();
