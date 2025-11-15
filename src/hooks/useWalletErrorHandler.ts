import { useCallback, useEffect } from 'react';
import { useAccount, useSwitchChain, useReconnect } from 'wagmi';
import { useAppKit } from '@reown/appkit/react';

export interface WalletError {
  type: 'network_mismatch' | 'disconnected' | 'rpc_failure' | 'unknown';
  message: string;
  recovery?: () => void;
}

export function useWalletErrorHandler() {
  const { isConnected, isDisconnected, chain } = useAccount();
  const { switchChain } = useSwitchChain();
  const { reconnect } = useReconnect();
  const { open } = useAppKit();

  // Handle wallet disconnection recovery
  useEffect(() => {
    if (isDisconnected) {
      const lastConnection = localStorage.getItem('wallet_connected');
      if (lastConnection === 'true') {
        console.log('Attempting to reconnect wallet...');
        reconnect();
      }
    }
  }, [isDisconnected, reconnect]);

  // Save connection state
  useEffect(() => {
    if (isConnected) {
      localStorage.setItem('wallet_connected', 'true');
    } else {
      localStorage.removeItem('wallet_connected');
    }
  }, [isConnected]);

  const handleNetworkMismatch = useCallback(
    (expectedChainId: number) => {
      const error: WalletError = {
        type: 'network_mismatch',
        message: `Please switch to the correct network. Expected chain ID: ${expectedChainId}`,
        recovery: () => {
          if (switchChain) {
            switchChain({ chainId: expectedChainId });
          }
        }
      };
      return error;
    },
    [switchChain]
  );

  const handleDisconnection = useCallback((): WalletError => {
    return {
      type: 'disconnected',
      message: 'Wallet disconnected. Please reconnect to continue.',
      recovery: () => {
        open();
      }
    };
  }, [open]);

  const handleRPCFailure = useCallback((): WalletError => {
    return {
      type: 'rpc_failure',
      message: 'RPC provider error. Trying fallback provider...',
      recovery: () => {
        // Fallback will be handled by wagmi config
        reconnect();
      }
    };
  }, [reconnect]);

  const parseError = useCallback(
    (error: unknown): WalletError => {
      const errorMessage = error instanceof Error ? error.message : String(error);

      if (errorMessage.includes('network') || errorMessage.includes('chain')) {
        return handleNetworkMismatch(chain?.id || 8453);
      }

      if (errorMessage.includes('disconnect') || !isConnected) {
        return handleDisconnection();
      }

      if (errorMessage.includes('RPC') || errorMessage.includes('provider')) {
        return handleRPCFailure();
      }

      return {
        type: 'unknown',
        message: errorMessage
      };
    },
    [chain, isConnected, handleNetworkMismatch, handleDisconnection, handleRPCFailure]
  );

  return {
    parseError,
    handleNetworkMismatch,
    handleDisconnection,
    handleRPCFailure,
    isConnected
  };
}
