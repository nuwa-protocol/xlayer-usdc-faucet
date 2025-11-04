import axios from 'axios';
import type { FaucetInfo, ClaimResponse, ClaimStatus, ClaimHistory } from '../types';

const API_BASE_URL = '/api/faucet';

export const faucetApi = {
  // Get faucet information
  async getFaucetInfo(): Promise<FaucetInfo> {
    const response = await axios.get<{ success: boolean; data: FaucetInfo }>(`${API_BASE_URL}/info`);
    return response.data.data;
  },

  // Claim tokens
  async claimTokens(address: string): Promise<ClaimResponse> {
    const response = await axios.post<ClaimResponse>(`${API_BASE_URL}/claim`, { address });
    return response.data;
  },

  // Check if address can claim
  async checkCanClaim(address: string): Promise<ClaimStatus> {
    const response = await axios.get<ClaimStatus>(`${API_BASE_URL}/check/${address}`);
    return response.data;
  },

  // Get claim history
  async getClaimHistory(address: string, limit: number = 10): Promise<ClaimHistory[]> {
    const response = await axios.get<{ success: boolean; data: ClaimHistory[] }>(
      `${API_BASE_URL}/history/${address}?limit=${limit}`
    );
    return response.data.data;
  },

  // Get recent claims
  async getRecentClaims(limit: number = 20): Promise<ClaimHistory[]> {
    const response = await axios.get<{ success: boolean; data: ClaimHistory[] }>(
      `${API_BASE_URL}/recent?limit=${limit}`
    );
    return response.data.data;
  },
};

