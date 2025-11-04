import { useState, useEffect } from 'react';
import { faucetApi } from '../services/api';
import type { FaucetInfo } from '../types';
import { formatAddress } from '../utils/format';

export const InfoCard = () => {
  const [faucetInfo, setFaucetInfo] = useState<FaucetInfo | null>(null);

  useEffect(() => {
    loadFaucetInfo();
    const interval = setInterval(loadFaucetInfo, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const loadFaucetInfo = async () => {
    try {
      const info = await faucetApi.getFaucetInfo();
      setFaucetInfo(info);
    } catch (error) {
      console.error('Load faucet info error:', error);
    }
  };

  if (!faucetInfo) {
    return (
      <div className="card">
        <h2 className="card-title">Faucet Status</h2>
        <div className="empty-state">Loading...</div>
      </div>
    );
  }

  return (
    <div className="card">
      <h2 className="card-title">Faucet Status</h2>
      <div className="info-grid">
        <div className="info-item">
          <div className="info-label">Faucet Address</div>
          <div className="info-value">{formatAddress(faucetInfo.faucetAddress)}</div>
        </div>
        <div className="info-item">
          <div className="info-label">Token Balance</div>
          <div className="info-value">
            {parseFloat(faucetInfo.tokenBalance).toFixed(2)} {faucetInfo.tokenSymbol}
          </div>
        </div>
        <div className="info-item">
          <div className="info-label">Chain ID</div>
          <div className="info-value">{faucetInfo.chainId}</div>
        </div>
        <div className="info-item">
          <div className="info-label">Claim Interval</div>
          <div className="info-value">{faucetInfo.claimInterval}</div>
        </div>
      </div>
    </div>
  );
};

