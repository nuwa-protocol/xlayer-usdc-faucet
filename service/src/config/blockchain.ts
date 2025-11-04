import { ethers } from 'ethers';
import dotenv from 'dotenv';

dotenv.config();

const privateKey = process.env.PRIVATE_KEY;
const mnemonic = process.env.MNEMONIC;
const mnemonicIndex = parseInt(process.env.MNEMONIC_INDEX || '0');
const rpcUrl = process.env.RPC_URL;
const chainId = parseInt(process.env.CHAIN_ID || '1');
const tokenAddress = process.env.TOKEN_ADDRESS;
const tokenDecimals = parseInt(process.env.TOKEN_DECIMALS || '6');

if ((!privateKey && !mnemonic) || !rpcUrl || !tokenAddress) {
  throw new Error('Missing blockchain environment variables. Need either PRIVATE_KEY or MNEMONIC');
}

// Create provider with extended timeout
// Default timeout is 120 seconds, we extend it to 300 seconds (5 minutes)
const fetchRequest = new ethers.FetchRequest(rpcUrl);
fetchRequest.timeout = 300000; // 5 minutes in milliseconds
export const provider = new ethers.JsonRpcProvider(fetchRequest, chainId, {
  staticNetwork: true // Avoid unnecessary network queries
});

// Create wallet from private key or mnemonic
let walletInstance: ethers.Wallet;

if (privateKey) {
  // Use private key
  console.log('🔑 Using private key for wallet');
  walletInstance = new ethers.Wallet(privateKey, provider);
  console.log('admin address: ' + walletInstance.address);
} else if (mnemonic) {
  console.log(`🔑 Using mnemonic for wallet (index: ${mnemonicIndex})`);
  const path = `m/44'/60'/0'/0/${mnemonicIndex}`;
  const hdNode = ethers.HDNodeWallet.fromPhrase(mnemonic, undefined, path);
  walletInstance = new ethers.Wallet(hdNode.privateKey, provider);
  console.log('admin address: ' + walletInstance.address);
} else {
  throw new Error('No wallet credentials provided');
}

export const wallet = walletInstance;

const ERC20_ABI = [
  'function transfer(address to, uint256 amount) returns (bool)',
  'function balanceOf(address account) view returns (uint256)',
  'function decimals() view returns (uint8)',
  'function symbol() view returns (string)',
  'function name() view returns (string)'
];

// Create token contract instance
export const tokenContract = new ethers.Contract(tokenAddress, ERC20_ABI, wallet);

// Faucet configuration
export const TOKEN_ADDRESS = tokenAddress;
export const TOKEN_DECIMALS = tokenDecimals;
export const FAUCET_AMOUNT = ethers.parseUnits(
  process.env.FAUCET_AMOUNT || '10',
  tokenDecimals
);
export const CHAIN_ID = chainId;

// Get token balance of faucet wallet (formatted for display)
export async function getTokenBalance(): Promise<string> {
  const balance = await tokenContract.balanceOf(wallet.address);
  return ethers.formatUnits(balance, tokenDecimals);
}

// Get raw token balance in wei/smallest unit
export async function getTokenBalanceRaw(): Promise<bigint> {
  return await tokenContract.balanceOf(wallet.address);
}

// Get token info
export async function getTokenInfo() {
  try {
    const [symbol, name, decimals] = await Promise.all([
      tokenContract.symbol(),
      tokenContract.name(),
      tokenContract.decimals()
    ]);
    return { symbol, name, decimals: Number(decimals) };
  } catch (error) {
    console.error('Error getting token info:', error);
    return { symbol: 'USDC', name: 'USD Coin', decimals: tokenDecimals };
  }
}

// Get native token (ETH) balance for gas fees
export async function getNativeBalance(): Promise<string> {
  const balance = await provider.getBalance(wallet.address);
  return ethers.formatEther(balance);
}
