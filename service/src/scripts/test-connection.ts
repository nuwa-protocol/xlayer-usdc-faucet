/**
 * Test script to verify blockchain and Supabase connection
 * Run: npm run dev -- src/scripts/test-connection.ts
 */

import dotenv from 'dotenv';
import { 
  provider, 
  wallet, 
  getTokenBalance, 
  getTokenInfo, 
  getNativeBalance,
  TOKEN_ADDRESS,
  FAUCET_AMOUNT,
  TOKEN_DECIMALS
} from '../config/blockchain';
import { supabase } from '../config/supabase';
import { ethers } from 'ethers';

dotenv.config();

async function testConnection() {
  console.log('🔍 Testing Faucet Configuration...\n');

  try {
    // Test 1: Network Connection
    console.log('📡 Testing Network Connection...');
    const network = await provider.getNetwork();
    console.log(`✅ Connected to network: ${network.name} (Chain ID: ${network.chainId})`);
    console.log(`   RPC URL: ${process.env.RPC_URL}\n`);

    // Test 2: Wallet
    console.log('👛 Testing Wallet...');
    console.log(`✅ Wallet address: ${wallet.address}\n`);

    // Test 3: Native Balance (ETH)
    console.log('💰 Checking Native Balance (for gas fees)...');
    const nativeBalance = await getNativeBalance();
    console.log(`   Balance: ${nativeBalance} ETH`);
    if (parseFloat(nativeBalance) < 0.01) {
      console.log(`⚠️  Warning: Low ETH balance. Need ETH for gas fees.`);
    } else {
      console.log(`✅ Sufficient ETH for gas fees.`);
    }
    console.log('');

    // Test 4: Token Contract
    console.log('🪙 Testing USDC Token Contract...');
    console.log(`   Token Address: ${TOKEN_ADDRESS}`);
    
    try {
      const tokenInfo = await getTokenInfo();
      console.log(`✅ Token: ${tokenInfo.name} (${tokenInfo.symbol})`);
      console.log(`   Decimals: ${tokenInfo.decimals}\n`);
    } catch (error) {
      console.log(`❌ Failed to get token info. Check TOKEN_ADDRESS.`);
      console.log(`   Error: ${error}\n`);
      return;
    }

    // Test 5: Token Balance
    console.log('💵 Checking USDC Balance...');
    try {
      const tokenBalance = await getTokenBalance();
      console.log(`   Balance: ${tokenBalance} USDC`);
      const amountPerClaim = ethers.formatUnits(FAUCET_AMOUNT, TOKEN_DECIMALS);
      console.log(`   Amount per claim: ${amountPerClaim} USDC`);
      
      const numClaims = Math.floor(parseFloat(tokenBalance) / parseFloat(amountPerClaim));
      if (numClaims < 1) {
        console.log(`❌ Insufficient USDC balance. Need at least ${amountPerClaim} USDC.`);
      } else {
        console.log(`✅ Can serve approximately ${numClaims} claims.\n`);
      }
    } catch (error) {
      console.log(`❌ Failed to get token balance.`);
      console.log(`   Error: ${error}\n`);
      return;
    }

    // Test 6: Supabase Connection
    console.log('🗄️  Testing Supabase Connection...');
    if (!supabase) {
      console.log(`⚠️  Supabase not configured (optional - for claim history tracking)`);
      console.log(`   To enable: Set SUPABASE_URL and SUPABASE_ANON_KEY in .env\n`);
    } else {
      try {
        const { data, error } = await supabase
          .from('evm_claims')
          .select('count')
          .limit(1);
        
        if (error) {
          console.log(`❌ Supabase connection failed: ${error.message}`);
          console.log(`   Make sure you've created the table using the setup-db script.\n`);
        } else {
          console.log(`✅ Supabase connected successfully.\n`);
        }
      } catch (error) {
        console.log(`❌ Supabase connection error: ${error}\n`);
      }
    }

    // Summary
    console.log('═══════════════════════════════════════');
    console.log('📋 Configuration Summary');
    console.log('═══════════════════════════════════════');
    console.log(`Network: ${network.name}`);
    console.log(`Faucet Address: ${wallet.address}`);
    console.log(`Token Address: ${TOKEN_ADDRESS}`);
    console.log(`ETH Balance: ${nativeBalance} ETH`);
    const tokenBalance = await getTokenBalance();
    console.log(`USDC Balance: ${tokenBalance} USDC`);
    console.log(`Amount per claim: ${ethers.formatUnits(FAUCET_AMOUNT, TOKEN_DECIMALS)} USDC`);
    console.log('═══════════════════════════════════════\n');

    console.log('✅ All tests completed!\n');

  } catch (error: any) {
    console.error('❌ Error during testing:', error.message);
    console.error('Full error:', error);
  }
}

// Run the test
testConnection().catch(console.error);

