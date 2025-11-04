/**
 * Database Setup Script
 * 
 * Run this SQL in your Supabase SQL Editor to create the required table:
 * 
 * CREATE TABLE faucet_claims (
 *   id BIGSERIAL PRIMARY KEY,
 *   address TEXT NOT NULL,
 *   amount TEXT NOT NULL,
 *   tx_hash TEXT NOT NULL,
 *   claimed_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
 *   ip_address TEXT,
 *   CONSTRAINT address_lowercase CHECK (address = LOWER(address))
 * );
 * 
 * -- Create index for faster queries
 * CREATE INDEX idx_faucet_claims_address ON faucet_claims(address);
 * CREATE INDEX idx_faucet_claims_claimed_at ON faucet_claims(claimed_at);
 * 
 * -- Enable Row Level Security (optional but recommended)
 * ALTER TABLE faucet_claims ENABLE ROW LEVEL SECURITY;
 * 
 * -- Create policy to allow public read access
 * CREATE POLICY "Allow public read access" ON faucet_claims
 *   FOR SELECT USING (true);
 * 
 * -- Create policy to allow insert (you might want to restrict this based on your needs)
 * CREATE POLICY "Allow public insert" ON faucet_claims
 *   FOR INSERT WITH CHECK (true);
 */

console.log('Please run the SQL commands in the comment above in your Supabase SQL Editor');
console.log('Table name: faucet_claims');
console.log('\nColumns:');
console.log('  - id: BIGSERIAL PRIMARY KEY');
console.log('  - address: TEXT NOT NULL');
console.log('  - amount: TEXT NOT NULL');
console.log('  - tx_hash: TEXT NOT NULL');
console.log('  - claimed_at: TIMESTAMP WITH TIME ZONE');
console.log('  - ip_address: TEXT (optional)');

