import { useEffect, useCallback } from 'react';
import { useAccount } from 'wagmi';

export interface WalletAnalyticsEvent {
  event: 'wallet_connected' | 'wallet_disconnected' | 'transaction_initiated' |
         'transaction_completed' | 'transaction_failed' | 'network_switched';
  timestamp: number;
  walletType?: string;
  chainId?: number;
  txHash?: string;
  error?: string;
}

export function useWalletAnalytics() {
  const { address, connector, isConnected, chain } = useAccount();

  // Track wallet connection
  useEffect(() => {
    if (isConnected && address && connector) {
      trackEvent({
        event: 'wallet_connected',
        timestamp: Date.now(),
        walletType: connector.name,
        chainId: chain?.id
      });
    }
  }, [isConnected, address, connector, chain]);

  // Track wallet disconnection
  useEffect(() => {
    if (!isConnected && address) {
      trackEvent({
        event: 'wallet_disconnected',
        timestamp: Date.now()
      });
    }
  }, [isConnected, address]);

  const trackEvent = useCallback((event: WalletAnalyticsEvent) => {
    // Store in localStorage for now (can be replaced with analytics service)
    const events = JSON.parse(localStorage.getItem('wallet_analytics') || '[]');
    events.push(event);

    // Keep only last 100 events
    if (events.length > 100) {
      events.shift();
    }

    localStorage.setItem('wallet_analytics', JSON.stringify(events));

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.log('[Analytics]', event.event, event);
    }
  }, []);

  const trackTransaction = useCallback((
    status: 'initiated' | 'completed' | 'failed',
    txHash?: string,
    error?: string
  ) => {
    const eventMap = {
      initiated: 'transaction_initiated',
      completed: 'transaction_completed',
      failed: 'transaction_failed'
    } as const;

    trackEvent({
      event: eventMap[status],
      timestamp: Date.now(),
      walletType: connector?.name,
      chainId: chain?.id,
      txHash,
      error
    });
  }, [connector, chain, trackEvent]);

  const getAnalyticsSummary = useCallback(() => {
    const events: WalletAnalyticsEvent[] = JSON.parse(
      localStorage.getItem('wallet_analytics') || '[]'
    );

    const summary = {
      totalConnections: events.filter(e => e.event === 'wallet_connected').length,
      totalDisconnections: events.filter(e => e.event === 'wallet_disconnected').length,
      totalTransactions: events.filter(e => e.event === 'transaction_initiated').length,
      successfulTransactions: events.filter(e => e.event === 'transaction_completed').length,
      failedTransactions: events.filter(e => e.event === 'transaction_failed').length,
      walletProviders: [...new Set(events.map(e => e.walletType).filter(Boolean))],
      networks: [...new Set(events.map(e => e.chainId).filter(Boolean))]
    };

    return summary;
  }, []);

  return {
    trackEvent,
    trackTransaction,
    getAnalyticsSummary
  };
}
