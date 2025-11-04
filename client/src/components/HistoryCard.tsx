import { useState, useEffect } from 'react';
import { faucetApi } from '../services/api';
import type { ClaimHistory, FaucetInfo } from '../types';
import { formatAddress, formatTime, getExplorerUrl } from '../utils/format';

export const HistoryCard = () => {
  const [recentClaims, setRecentClaims] = useState<ClaimHistory[]>([]);
  const [loading, setLoading] = useState(false);
  const [chainId, setChainId] = useState<number | null>(null);

  useEffect(() => {
    loadRecentClaims();
    loadFaucetInfo();
    const interval = setInterval(loadRecentClaims, 15000); // Refresh every 15 seconds
    return () => clearInterval(interval);
  }, []);

  const loadFaucetInfo = async () => {
    try {
      const info: FaucetInfo = await faucetApi.getFaucetInfo();
      setChainId(info.chainId);
    } catch (error) {
      console.error('Load faucet info error:', error);
    }
  };

  const loadRecentClaims = async () => {
    setLoading(true);
    try {
      const data = await faucetApi.getRecentClaims(20);
      setRecentClaims(data);
    } catch (error) {
      console.error('Load recent claims error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card">
      <h2 className="card-title">Recent Claims</h2>
      
      {loading && recentClaims.length === 0 ? (
        <div className="empty-state">
          <span className="loading"></span>
        </div>
      ) : recentClaims.length === 0 ? (
        <div className="empty-state">No claim records yet</div>
      ) : (
        <table className="history-table">
          <thead>
            <tr>
              <th>Address</th>
              <th>Time</th>
              <th>Amount</th>
              <th>Tx Hash</th>
            </tr>
          </thead>
          <tbody>
            {recentClaims.map((item) => (
              <tr key={item.id}>
                <td>{formatAddress(item.address)}</td>
                <td>{formatTime(item.claimed_at)}</td>
                <td>{item.amount}</td>
                <td>
                  {chainId ? (
                    <a
                      href={getExplorerUrl(item.tx_hash, chainId)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="tx-link"
                    >
                      {formatAddress(item.tx_hash)}
                    </a>
                  ) : (
                    formatAddress(item.tx_hash)
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

