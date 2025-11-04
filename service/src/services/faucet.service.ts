import { ethers } from 'ethers';
import { supabase } from '../config/supabase';
import { 
  wallet, 
  provider, 
  tokenContract,
  FAUCET_AMOUNT, 
  TOKEN_DECIMALS,
  getTokenBalance,
  getTokenBalanceRaw
} from '../config/blockchain';

export interface ClaimResult {
  success: boolean;
  message: string;
  txHash?: string;
  amount?: string;
  nextClaimTime?: Date;
}

/**
 * Check if an address can claim from the faucet
 * Returns the last claim time if found, null otherwise
 */
export async function canClaim(address: string): Promise<{ canClaim: boolean; lastClaimTime?: Date; nextClaimTime?: Date }> {
  // If Supabase is not configured, allow all claims
  if (!supabase) {
    console.warn('Supabase not configured - skipping claim check');
    return { canClaim: true };
  }

  const normalizedAddress = address.toLowerCase();
  
  // Get the last completed claim for this address
  const { data, error } = await supabase
    .from('evm_claims')
    .select('created_at')
    .eq('address', normalizedAddress)
    .eq('status', 'completed')
    .order('created_at', { ascending: false })
    .limit(1);

  if (error) {
    console.error('Error checking claim status:', error);
    throw new Error('Failed to check claim status');
  }

  if (!data || data.length === 0) {
    // No previous claims
    return { canClaim: true };
  }

  const lastClaimTime = new Date(data[0].created_at);
  const now = new Date();
  const timeDiff = now.getTime() - lastClaimTime.getTime();
  const hoursDiff = timeDiff / (1000 * 60 * 60);

  // Check if 24 hours have passed
  const canClaimNow = hoursDiff >= 24;
  
  if (!canClaimNow) {
    const nextClaimTime = new Date(lastClaimTime.getTime() + 24 * 60 * 60 * 1000);
    return { canClaim: false, lastClaimTime, nextClaimTime };
  }

  return { canClaim: true, lastClaimTime };
}

/**
 * Validate Ethereum address
 */
export function isValidAddress(address: string): boolean {
  try {
    return ethers.isAddress(address);
  } catch {
    return false;
  }
}

/**
 * Send tokens to the specified address
 */
export async function sendTokens(toAddress: string, ipAddress?: string): Promise<ClaimResult> {
  try {
    // Validate address
    if (!isValidAddress(toAddress)) {
      return {
        success: false,
        message: 'Invalid Ethereum address'
      };
    }

    const normalizedAddress = toAddress.toLowerCase();

    // Check if can claim
    // const claimStatus = await canClaim(normalizedAddress);
    // if (!claimStatus.canClaim) {
    //   const hoursLeft = Math.ceil((claimStatus.nextClaimTime!.getTime() - Date.now()) / (1000 * 60 * 60));
    //   return {
    //     success: false,
    //     message: `You can only claim once per 24 hours. Please try again in ${hoursLeft} hours.`,
    //     nextClaimTime: claimStatus.nextClaimTime
    //   };
    // }

    // Check faucet token balance (use raw balance to avoid precision issues)
    const balanceRaw = await getTokenBalanceRaw();
    const balanceFormatted = ethers.formatUnits(balanceRaw, TOKEN_DECIMALS);
    console.log(`Faucet balance: ${balanceFormatted} tokens (${balanceRaw.toString()} smallest units)`);
    
    if (balanceRaw < FAUCET_AMOUNT) {
      return {
        success: false,
        message: 'Faucet is empty. Please contact the administrator.'
      };
    }

    // Check if wallet has enough ETH for gas
    // const ethBalance = await provider.getBalance(wallet.address);
    // const estimatedGas = ethers.parseEther('0.001'); // Estimated gas fee
    // if (ethBalance < estimatedGas) {
    //   return {
    //     success: false,
    //     message: 'Insufficient ETH for gas fees. Please contact the administrator.'
    //   };
    // }

    // Send ERC20 token transaction
    const tx = await tokenContract.transfer(toAddress, FAUCET_AMOUNT);

    console.log(`Transaction sent: ${tx.hash}`);
    
    // 504 
    // Wait for confirmation
    // const receipt = await tx.wait();
    
    // console.log(`Transaction confirmed: ${tx.hash} (block: ${receipt.blockNumber})`);

    // Record the claim in Supabase (if configured)
    if (supabase) {
      const { CHAIN_ID } = await import('../config/blockchain');
      const { error: insertError } = await supabase
        .from('evm_claims')
        .insert({
          address: normalizedAddress,
          amount: ethers.formatUnits(FAUCET_AMOUNT, TOKEN_DECIMALS),
          tx_hash: tx.hash,
          chain_id: CHAIN_ID,
          status: 'completed'
        });

      if (insertError) {
        console.error('Error recording claim:', insertError);
        // Transaction succeeded but recording failed - still return success
      }
    } else {
      console.log('Supabase not configured - claim not recorded in database');
    }

    return {
      success: true,
      message: 'USDC sent successfully!',
      txHash: tx.hash,
      amount: ethers.formatUnits(FAUCET_AMOUNT, TOKEN_DECIMALS)
    };
  } catch (error: any) {
    console.error('Error sending tokens:', error);
    
    // Provide more detailed error message
    let errorMessage = 'Failed to send tokens';
    if (error.code === 'INSUFFICIENT_FUNDS') {
      errorMessage = 'Insufficient funds for gas fees';
    } else if (error.message) {
      errorMessage = error.message;
    }
    
    return {
      success: false,
      message: errorMessage
    };
  }
}

/**
 * Get claim history for an address
 */
export async function getClaimHistory(address: string, limit: number = 10) {
  if (!supabase) {
    return [];
  }

  const normalizedAddress = address.toLowerCase();
  
  const { data, error } = await supabase
    .from('evm_claims')
    .select('*')
    .eq('address', normalizedAddress)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error fetching claim history:', error);
    throw new Error('Failed to fetch claim history');
  }

  return data;
}

/**
 * Get recent claims across all addresses
 */
export async function getRecentClaims(limit: number = 20) {
  if (!supabase) {
    return [];
  }

  const { data, error } = await supabase
    .from('evm_claims')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error fetching recent claims:', error);
    throw new Error('Failed to fetch recent claims');
  }

  return data;
}

