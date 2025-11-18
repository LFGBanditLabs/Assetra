'use client'

import { useEffect, useState } from 'react';
import { Hash } from 'viem';
import { useAccount, useWaitForTransactionReceipt } from 'wagmi';

export interface Notification {
  id: string;
  type: 'pending' | 'success' | 'error' | 'info';
  title: string;
  message: string;
  txHash?: Hash;
  action?: { label: string; onClick: () => void };
}

export function WalletNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const { chain } = useAccount();

  const addNotification = (notification: Omit<Notification, 'id'>) => {
    const id = Date.now().toString();
    setNotifications(prev => [...prev, { ...notification, id }]);

    // Auto-remove success/error notifications after 5 seconds
    if (notification.type !== 'pending') {
      setTimeout(() => {
        removeNotification(id);
      }, 5000);
    }
  };

  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const updateNotification = (id: string, updates: Partial<Notification>) => {
    setNotifications(prev =>
      prev.map(n => (n.id === id ? { ...n, ...updates } : n))
    );
  };

  // Expose methods globally for use in other components
  useEffect(() => {
    (window as any).__walletNotify = {
      addNotification,
      removeNotification,
      updateNotification
    };

    return () => {
      delete (window as any).__walletNotify;
    };
  }, []);

  const getBlockExplorerUrl = (hash: Hash) => {
    if (!chain) return null;

    const explorers: Record<number, string> = {
      8453: 'https://basescan.org',
      84532: 'https://sepolia.basescan.org',
      1: 'https://etherscan.io',
      11155111: 'https://sepolia.etherscan.io'
    };

    const explorerUrl = explorers[chain.id];
    return explorerUrl ? `${explorerUrl}/tx/${hash}` : null;
  };

  const getIconForType = (type: Notification['type']) => {
    switch (type) {
      case 'pending':
        return '⏳';
      case 'success':
        return '✅';
      case 'error':
        return '❌';
      case 'info':
        return 'ℹ️';
    }
  };

  const getColorForType = (type: Notification['type']) => {
    switch (type) {
      case 'pending':
        return 'bg-blue-50 border-blue-200';
      case 'success':
        return 'bg-green-50 border-green-200';
      case 'error':
        return 'bg-red-50 border-red-200';
      case 'info':
        return 'bg-gray-50 border-gray-200';
    }
  };

  if (notifications.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm">
      {notifications.map(notification => (
        <div
          key={notification.id}
          className={`p-4 rounded-lg border-2 shadow-lg ${getColorForType(
            notification.type
          )} animate-slide-up`}
        >
          <div className="flex items-start gap-3">
            <span className="text-2xl">{getIconForType(notification.type)}</span>
            <div className="flex-1 min-w-0">
              <h4 className="font-semibold text-sm text-gray-900">
                {notification.title}
              </h4>
              <p className="text-xs text-gray-600 mt-1">{notification.message}</p>

              {notification.txHash && (
                <a
                  href={getBlockExplorerUrl(notification.txHash) || '#'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-blue-600 hover:underline mt-2 inline-block"
                >
                  View on Explorer →
                </a>
              )}

              {notification.action && (
                <button
                  onClick={notification.action.onClick}
                  className="text-xs text-blue-600 hover:underline mt-2 block font-medium"
                >
                  {notification.action.label}
                </button>
              )}
            </div>

            <button
              onClick={() => removeNotification(notification.id)}
              className="text-gray-400 hover:text-gray-600 text-lg leading-none"
              aria-label="Dismiss"
            >
              ×
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

// Helper function to use in other components
export function useWalletNotify() {
  return {
    notify: (notification: Omit<Notification, 'id'>) => {
      if ((window as any).__walletNotify) {
        (window as any).__walletNotify.addNotification(notification);
      }
    }
  };
}
