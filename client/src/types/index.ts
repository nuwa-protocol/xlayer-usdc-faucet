export interface FaucetInfo {
  faucetAddress: string;
  tokenAddress: string;
  tokenSymbol: string;
  tokenName: string;
  tokenBalance: string;
  nativeBalance: string;
  amountPerClaim: string;
  chainId: number;
  claimInterval: string;
}

export interface ClaimResponse {
  success: boolean;
  message: string;
  txHash?: string;
  amount?: string;
  nextClaimTime?: string;
}

export interface ClaimStatus {
  success: boolean;
  canClaim: boolean;
  lastClaimTime?: string;
  nextClaimTime?: string;
  message?: string;
}

export interface ClaimHistory {
  id: number;
  address: string;
  amount: string;
  tx_hash: string;
  claimed_at: string;
  ip_address?: string;
}

