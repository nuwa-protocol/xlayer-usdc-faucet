export interface Claim {
  id: string;
  address: string;
  amount: string;
  tx_hash: string | null;
  chain_id: number;
  status: 'pending' | 'completed' | 'failed';
  created_at: string;
  updated_at: string;
}

export interface ClaimRequest {
  address: string;
}

export interface ClaimResponse {
  success: boolean;
  message: string;
  data?: {
    tx_hash: string;
    amount: string;
    claim_id: string;
  };
  error?: string;
}

export interface ClaimStatusResponse {
  can_claim: boolean;
  last_claim?: string;
  next_claim_available?: string;
  time_remaining_seconds?: number;
}

export interface FaucetConfig {
  amount: string;
  claimIntervalHours: number;
  chainId: number;
  rpcUrl: string;
  privateKey: string;
}

