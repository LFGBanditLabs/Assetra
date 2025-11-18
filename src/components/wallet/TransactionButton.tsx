'use client'

import { useTransactionFeedback } from '@/hooks/useTransactionFeedback';
import { useWalletErrorHandler } from '@/hooks/useWalletErrorHandler';
import { useWalletAnalytics } from '@/hooks/useWalletAnalytics';
import { useWalletNotify } from './WalletNotifications';
import { useAccount, useWaitForTransactionReceipt } from 'wagmi';
import { Hash } from 'viem';

interface TransactionButtonProps {
  onClick: () => Promise<Hash>;
  children: React.ReactNode;
  disabled?: boolean;
  className?: string;
  expectedChainId?: number;
}

export function TransactionButton({
  onClick,
  children,
  disabled,
  className = '',
  expectedChainId
}: TransactionButtonProps) {
  const { txState, updateStatus, handleError, reset } = useTransactionFeedback();
  const { parseError, handleNetworkMismatch, isConnected } = useWalletErrorHandler();
  const { trackTransaction } = useWalletAnalytics();
  const { notify } = useWalletNotify();
  const { chain } = useAccount();

  const { data: receipt, isLoading: isConfirming } = useWaitForTransactionReceipt({
    hash: txState.hash,
  });

  const handleClick = async () => {
    if (!isConnected) {
      notify({
        type: 'error',
        title: 'Wallet Not Connected',
        message: 'Please connect your wallet to continue'
      });
      return;
    }

    // Check network if expected chain is specified
    if (expectedChainId && chain?.id !== expectedChainId) {
      const error = handleNetworkMismatch(expectedChainId);
      notify({
        type: 'error',
        title: 'Wrong Network',
        message: error.message,
        action: error.recovery ? {
          label: 'Switch Network',
          onClick: error.recovery
        } : undefined
      });
      return;
    }

    try {
      updateStatus('preparing');
      trackTransaction('initiated');

      notify({
        type: 'pending',
        title: 'Preparing Transaction',
        message: 'Please confirm in your wallet...'
      });

      updateStatus('signing');
      const hash = await onClick();

      updateStatus('pending', { hash });
      trackTransaction('initiated', hash);

      notify({
        type: 'pending',
        title: 'Transaction Submitted',
        message: 'Waiting for confirmation...',
        txHash: hash
      });

      // Wait for confirmation (handled by useWaitForTransactionReceipt)

    } catch (error) {
      console.error('Transaction error:', error);
      const walletError = parseError(error);
      handleError(error instanceof Error ? error : new Error(String(error)));
      trackTransaction('failed', undefined, walletError.message);

      notify({
        type: 'error',
        title: 'Transaction Failed',
        message: walletError.message,
        action: walletError.recovery ? {
          label: 'Try Again',
          onClick: () => {
            reset();
            walletError.recovery?.();
          }
        } : undefined
      });
    }
  };

  // Handle successful confirmation
  if (receipt && txState.status === 'pending') {
    updateStatus('success');
    trackTransaction('completed', txState.hash);

    notify({
      type: 'success',
      title: 'Transaction Successful',
      message: 'Your transaction has been confirmed!',
      txHash: txState.hash
    });
  }

  const getButtonText = () => {
    if (!isConnected) return 'Connect Wallet';

    switch (txState.status) {
      case 'preparing':
        return 'Preparing...';
      case 'signing':
        return 'Confirm in Wallet...';
      case 'pending':
        return 'Processing...';
      case 'success':
        return 'Success!';
      case 'error':
        return 'Try Again';
      default:
        return children;
    }
  };

  const isLoading = txState.isLoading || isConfirming;

  return (
    <button
      onClick={handleClick}
      disabled={disabled || isLoading}
      className={`
        px-6 py-3 rounded-lg font-medium transition-all
        ${isLoading ? 'opacity-70 cursor-wait' : 'hover:opacity-90'}
        ${txState.isError ? 'bg-red-600 text-white' : 'bg-black text-white'}
        ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
        ${className}
      `}
    >
      {isLoading && (
        <span className="inline-block mr-2 animate-spin">⏳</span>
      )}
      {getButtonText()}
    </button>
  );
}
