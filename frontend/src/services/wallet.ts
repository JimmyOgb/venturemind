import { BRADBURY_CONFIG } from './contract';

export interface WalletState {
  isConnected: boolean;
  address: string | null;
  chainId: number | null;
  isBradbury: boolean;
  error: string | null;
}

export function formatAddress(address: string | null): string {
  if (!address) return '';
  const clean = address.trim();
  if (clean.length <= 10) return clean;
  return `${clean.slice(0, 6)}...${clean.slice(-4)}`;
}

interface EthereumProvider {
  request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
  on?: (eventName: string, handler: (...args: unknown[]) => void) => void;
  removeListener?: (eventName: string, handler: (...args: unknown[]) => void) => void;
}

function getProvider(): EthereumProvider | null {
  if (typeof window !== 'undefined' && (window as unknown as { ethereum?: EthereumProvider }).ethereum) {
    return (window as unknown as { ethereum: EthereumProvider }).ethereum;
  }
  return null;
}

export async function checkWalletConnection(): Promise<WalletState> {
  const provider = getProvider();
  if (!provider) {
    return {
      isConnected: false,
      address: null,
      chainId: null,
      isBradbury: false,
      error: null,
    };
  }

  try {
    const accounts = (await provider.request({ method: 'eth_accounts', params: [] })) as string[];
    const chainIdHex = (await provider.request({ method: 'eth_chainId', params: [] })) as string;
    const chainId = parseInt(chainIdHex, 16);

    const address = accounts && accounts.length > 0 ? accounts[0] : null;
    const isBradbury = chainId === BRADBURY_CONFIG.chainId;

    return {
      isConnected: Boolean(address),
      address,
      chainId,
      isBradbury,
      error: null,
    };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    return {
      isConnected: false,
      address: null,
      chainId: null,
      isBradbury: false,
      error: errorMsg,
    };
  }
}

export async function connectWallet(): Promise<WalletState> {
  const provider = getProvider();
  if (!provider) {
    throw new Error('No Ethereum-compatible wallet found. Please install MetaMask, Rabby, or a Web3 wallet.');
  }

  try {
    const accounts = (await provider.request({
      method: 'eth_requestAccounts',
      params: [],
    })) as string[];

    if (!accounts || accounts.length === 0) {
      throw new Error('No accounts authorized.');
    }

    const chainIdHex = (await provider.request({ method: 'eth_chainId', params: [] })) as string;
    const chainId = parseInt(chainIdHex, 16);
    const isBradbury = chainId === BRADBURY_CONFIG.chainId;

    return {
      isConnected: true,
      address: accounts[0],
      chainId,
      isBradbury,
      error: null,
    };
  } catch (err: unknown) {
    const errorObj = err as { code?: number; message?: string };
    if (errorObj?.code === 4001 || errorObj?.message?.includes('rejected')) {
      throw new Error('Connection request was rejected by user.');
    }
    throw new Error(errorObj?.message || 'Failed to connect wallet.');
  }
}

export async function switchToBradburyNetwork(): Promise<boolean> {
  const provider = getProvider();
  if (!provider) {
    throw new Error('No wallet provider available.');
  }

  try {
    await provider.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: BRADBURY_CONFIG.chainIdHex }],
    });
    return true;
  } catch (switchError: unknown) {
    const errorObj = switchError as { code?: number; message?: string };
    // 4902 error code indicates the chain has not been added to the wallet
    if (errorObj?.code === 4902 || errorObj?.message?.includes('Unrecognized chain')) {
      try {
        await provider.request({
          method: 'wallet_addEthereumChain',
          params: [
            {
              chainId: BRADBURY_CONFIG.chainIdHex,
              chainName: BRADBURY_CONFIG.name,
              nativeCurrency: {
                name: 'GenLayer GEN',
                symbol: 'GEN',
                decimals: 18,
              },
              rpcUrls: [BRADBURY_CONFIG.rpcUrl],
              blockExplorerUrls: BRADBURY_CONFIG.explorerUrl ? [BRADBURY_CONFIG.explorerUrl] : [],
            },
          ],
        });
        return true;
      } catch (addError: unknown) {
        const addErrObj = addError as { message?: string };
        throw new Error(addErrObj?.message || 'Failed to add GenLayer Bradbury network to wallet.');
      }
    }
    if (errorObj?.code === 4001) {
      throw new Error('Network switch was cancelled by user.');
    }
    throw new Error(errorObj?.message || 'Failed to switch network to Bradbury.');
  }
}

export function subscribeToWalletEvents(
  onAccountsChanged: (accounts: string[]) => void,
  onChainChanged: (chainIdHex: string) => void
): () => void {
  const provider = getProvider();
  if (!provider || !provider.on) {
    return () => {};
  }

  const handleAccounts = (accounts: unknown) => {
    onAccountsChanged(accounts as string[]);
  };

  const handleChain = (chainId: unknown) => {
    onChainChanged(chainId as string);
  };

  provider.on('accountsChanged', handleAccounts);
  provider.on('chainChanged', handleChain);

  return () => {
    if (provider.removeListener) {
      provider.removeListener('accountsChanged', handleAccounts);
      provider.removeListener('chainChanged', handleChain);
    }
  };
}
