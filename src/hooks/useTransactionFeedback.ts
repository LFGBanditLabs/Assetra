import { useState, useCallback } from 'react';
import { Hash } from 'viem';

export interface TransactionState {
  hash?: Hash;
  status: 'idle' | 'preparing' | 'signing' | 'pending' | 'success' | 'error';
  error?: string;
  gasEstimate?: bigint;
}

export function useTransactionFeedback() {
  const [txState, setTxState] = useState<TransactionState>({ status: 'idle' });

  const updateStatus = useCallback((
    status: TransactionState['status'],
    data?: Partial<TransactionState>
  ) => {
    setTxState(prev => ({ ...prev, status, ...data }));
  }, []);

  const reset = useCallback(() => {
    setTxState({ status: 'idle' });
  }, []);

  const handleError = useCallback((error: Error) => {
    let errorMessage = error.message;

    // User-friendly error messages
    if (error.message.includes('User rejected')) {
      errorMessage = 'Transaction was rejected. Please try again.';
    } else if (error.message.includes('insufficient funds')) {
      errorMessage = 'Insufficient funds to complete this transaction.';
    } else if (error.message.includes('gas')) {
      errorMessage = 'Gas estimation failed. Please try adjusting gas settings.';
    } else if (error.message.includes('nonce')) {
      errorMessage = 'Transaction nonce error. Please reset your wallet or try again.';
    }

    setTxState({
      status: 'error',
      error: errorMessage
    });
  }, []);

  return {
    txState,
    updateStatus,
    handleError,
    reset,
    isLoading: ['preparing', 'signing', 'pending'].includes(txState.status),
    isError: txState.status === 'error',
    isSuccess: txState.status === 'success'
  };
}
