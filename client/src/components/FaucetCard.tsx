import { useState, useEffect } from 'react';
import { faucetApi } from '../services/api';
import type { FaucetInfo, ClaimStatus } from '../types';
import { formatCountdown } from '../utils/format';

export const FaucetCard = () => {
  const [address, setAddress] = useState<string>('');
  const [faucetInfo, setFaucetInfo] = useState<FaucetInfo | null>(null);
  const [claimStatus, setClaimStatus] = useState<ClaimStatus | null>(null);
  const [isClaiming, setIsClaiming] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error' | 'warning'; text: string } | null>(null);
  const [countdown, setCountdown] = useState<string>('');

  // Load faucet information
  useEffect(() => {
    loadFaucetInfo();
  }, []);

  // Check claim status
  useEffect(() => {
    if (address && isValidAddress(address)) {
      checkClaimStatus();
      const interval = setInterval(checkClaimStatus, 10000); // Refresh every 10 seconds
      return () => clearInterval(interval);
    }
  }, [address]);

  // Update countdown
  useEffect(() => {
    if (claimStatus?.nextClaimTime) {
      updateCountdown();
      const interval = setInterval(updateCountdown, 1000);
      return () => clearInterval(interval);
    }
  }, [claimStatus?.nextClaimTime]);

  const loadFaucetInfo = async () => {
    try {
      const info = await faucetApi.getFaucetInfo();
      setFaucetInfo(info);
    } catch (error) {
      console.error('Load faucet info error:', error);
    }
  };

  const checkClaimStatus = async () => {
    if (!address || !isValidAddress(address)) return;
    
    try {
      const status = await faucetApi.checkCanClaim(address);
      setClaimStatus(status);
    } catch (error) {
      console.error('Check claim status error:', error);
    }
  };

  const updateCountdown = () => {
    if (!claimStatus?.nextClaimTime) return;
    setCountdown(formatCountdown(claimStatus.nextClaimTime));
  };

  const isValidAddress = (addr: string): boolean => {
    return /^0x[a-fA-F0-9]{40}$/.test(addr);
  };

  const handleAddressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newAddress = e.target.value.trim();
    setAddress(newAddress);
    setMessage(null);
  };

  const handleClaim = async () => {
    if (!address || !isValidAddress(address)) {
      setMessage({
        type: 'error',
        text: 'Please enter a valid Ethereum address',
      });
      return;
    }

    if (!claimStatus?.canClaim) {
      return;
    }

    setIsClaiming(true);
    setMessage(null);

    try {
      const result = await faucetApi.claimTokens(address);
      
      if (result.success) {
        setMessage({
          type: 'success',
          text: `Successfully claimed ${result.amount} ${faucetInfo?.tokenSymbol}! Tx Hash: ${result.txHash}`,
        });
        checkClaimStatus();
        loadFaucetInfo();
      } else {
        setMessage({
          type: 'error',
          text: result.message,
        });
      }
    } catch (error: any) {
      setMessage({
        type: 'error',
        text: error.response?.data?.message || 'Claim failed, please try again later',
      });
    } finally {
      setIsClaiming(false);
    }
  };

  const canClaim = address && isValidAddress(address) && claimStatus?.canClaim;

  return (
    <div className="card faucet-card">
      <h2 className="card-title">Testnet Faucet</h2>

      <div className="faucet-amount">
        <div className="faucet-amount-label">Maximum per wallet address per day</div>
        <div className="faucet-amount-value">
          {faucetInfo?.amountPerClaim || '0'} {faucetInfo?.tokenSymbol || 'USDC'}
        </div>
      </div>

      <div className="faucet-form">
        <div className="input-group">
          <input
            type="text"
            className="input"
            value={address}
            onChange={handleAddressChange}
            placeholder="Enter wallet address (0x...)"
          />
          <button
            className="btn btn-primary"
            onClick={handleClaim}
            disabled={!canClaim || isClaiming}
          >
            {isClaiming ? (
              <>
                <span className="loading"></span>
                Claiming...
              </>
            ) : (
              `Claim ${faucetInfo?.amountPerClaim || '0'} ${faucetInfo?.tokenSymbol || 'USDC'}`
            )}
          </button>
        </div>

        {address && !isValidAddress(address) && (
          <div className="claim-status error">
            ❌ Please enter a valid Ethereum address (starts with 0x, 42 characters)
          </div>
        )}

        {claimStatus && !claimStatus.canClaim && countdown && (
          <div className="claim-status warning">
            ⏰ Can claim again in {countdown}
          </div>
        )}

        {message && (
          <div className={`claim-status ${message.type}`}>
            {message.text}
          </div>
        )}
      </div>
    </div>
  );
};

