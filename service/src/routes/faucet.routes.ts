import { Router, Request, Response } from 'express';
import { z } from 'zod';
import {
  sendTokens,
  canClaim,
  getClaimHistory,
  getRecentClaims,
  isValidAddress
} from '../services/faucet.service';
import { 
  getTokenBalance, 
  getTokenInfo, 
  getNativeBalance,
  TOKEN_ADDRESS 
} from '../config/blockchain';

const router = Router();

// Request validation schema
const claimSchema = z.object({
  address: z.string().min(42).max(42)
});

/**
 * POST /api/faucet/claim
 * Claim tokens from the faucet
 */
router.post('/claim', async (req: Request, res: Response) => {
  try {
    const { address } = claimSchema.parse(req.body);
    
    // Get IP address for rate limiting (optional)
    const ipAddress = req.ip || req.headers['x-forwarded-for'] as string;
    
    const result = await sendTokens(address, ipAddress);
    
    if (result.success) {
      return res.status(200).json(result);
    } else {
      return res.status(400).json(result);
    }
  } catch (error: any) {
    console.error('Claim error:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: 'Invalid request data',
        errors: error.errors
      });
    }
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

/**
 * GET /api/faucet/check/:address
 * Check if an address can claim
 */
router.get('/check/:address', async (req: Request, res: Response) => {
  try {
    const { address } = req.params;
    
    if (!isValidAddress(address)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid Ethereum address'
      });
    }
    
    const status = await canClaim(address);
    
    return res.status(200).json({
      success: true,
      ...status
    });
  } catch (error: any) {
    console.error('Check error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

/**
 * GET /api/faucet/history/:address
 * Get claim history for an address
 */
router.get('/history/:address', async (req: Request, res: Response) => {
  try {
    const { address } = req.params;
    const limit = parseInt(req.query.limit as string) || 10;
    
    if (!isValidAddress(address)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid Ethereum address'
      });
    }
    
    const history = await getClaimHistory(address, limit);
    
    return res.status(200).json({
      success: true,
      data: history
    });
  } catch (error: any) {
    console.error('History error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

/**
 * GET /api/faucet/recent
 * Get recent claims across all addresses
 */
router.get('/recent', async (req: Request, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 20;
    const claims = await getRecentClaims(limit);
    
    return res.status(200).json({
      success: true,
      data: claims
    });
  } catch (error: any) {
    console.error('Recent claims error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

/**
 * GET /api/faucet/info
 * Get faucet information
 */
router.get('/info', async (req: Request, res: Response) => {
  try {
    const [tokenBalance, tokenInfo, nativeBalance] = await Promise.all([
      getTokenBalance(),
      getTokenInfo(),
      getNativeBalance()
    ]);
    
    const { wallet, FAUCET_AMOUNT, CHAIN_ID, TOKEN_DECIMALS } = await import('../config/blockchain');
    const { ethers } = await import('ethers');
    
    return res.status(200).json({
      success: true,
      data: {
        faucetAddress: wallet.address,
        tokenAddress: TOKEN_ADDRESS,
        tokenSymbol: tokenInfo.symbol,
        tokenName: tokenInfo.name,
        tokenBalance: tokenBalance,
        nativeBalance: nativeBalance,
        amountPerClaim: ethers.formatUnits(FAUCET_AMOUNT, TOKEN_DECIMALS),
        chainId: CHAIN_ID,
        claimInterval: '24 hours'
      }
    });
  } catch (error: any) {
    console.error('Info error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

export default router;

