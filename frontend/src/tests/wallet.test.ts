import { describe, it, expect, vi, beforeEach } from 'vitest';
import { formatAddress, checkWalletConnection } from '../services/wallet';

describe('Wallet Integration Service', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('Address Formatting', () => {
    it('formats Ethereum address properly', () => {
      expect(formatAddress('0x1234567890123456789012345678901234567890')).toBe('0x1234...7890');
      expect(formatAddress(null)).toBe('');
      expect(formatAddress('')).toBe('');
    });
  });

  describe('Wallet State Checking', () => {
    it('returns disconnected state when window.ethereum is not present', async () => {
      if (typeof window !== 'undefined') {
        window.ethereum = undefined;
      }
      const state = await checkWalletConnection();
      expect(state.isConnected).toBe(false);
      expect(state.address).toBeNull();
      expect(state.isBradbury).toBe(false);
    });

    it('detects connected account and correct Bradbury network', async () => {
      const mockAddress = '0x1234567890123456789012345678901234567890';
      const mockChainIdHex = '0x107d'; // 4221

      if (typeof window !== 'undefined') {
        window.ethereum = {
          request: vi.fn().mockImplementation(async ({ method }: { method: string }) => {
            if (method === 'eth_accounts') return [mockAddress];
            if (method === 'eth_chainId') return mockChainIdHex;
            return null;
          }),
        };
      }

      const state = await checkWalletConnection();
      expect(state.isConnected).toBe(true);
      expect(state.address).toBe(mockAddress);
      expect(state.chainId).toBe(4221);
      expect(state.isBradbury).toBe(true);
    });

    it('detects connected account on wrong network', async () => {
      const mockAddress = '0x1234567890123456789012345678901234567890';
      const wrongChainIdHex = '0x1'; // Mainnet Ethereum 1

      if (typeof window !== 'undefined') {
        window.ethereum = {
          request: vi.fn().mockImplementation(async ({ method }: { method: string }) => {
            if (method === 'eth_accounts') return [mockAddress];
            if (method === 'eth_chainId') return wrongChainIdHex;
            return null;
          }),
        };
      }

      const state = await checkWalletConnection();
      expect(state.isConnected).toBe(true);
      expect(state.address).toBe(mockAddress);
      expect(state.chainId).toBe(1);
      expect(state.isBradbury).toBe(false);
    });
  });
});
