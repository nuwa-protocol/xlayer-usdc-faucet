-- Create claims table to track faucet claims
CREATE TABLE IF NOT EXISTS evm_claims (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  address VARCHAR(42) NOT NULL,
  amount VARCHAR(100) NOT NULL,
  tx_hash VARCHAR(66),
  chain_id INTEGER NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index on address and created_at for faster queries
CREATE INDEX IF NOT EXISTS idx_claims_address_created_at ON evm_claims(address, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_claims_status ON evm_claims(status);

-- Create function to check if address can claim (hasn't claimed in last 24 hours)
CREATE OR REPLACE FUNCTION can_claim(
  p_address VARCHAR,
  p_chain_id INTEGER,
  p_hours_interval INTEGER DEFAULT 24
)
RETURNS BOOLEAN AS $$
DECLARE
  last_claim_time TIMESTAMP WITH TIME ZONE;
BEGIN
  SELECT MAX(created_at) INTO last_claim_time
  FROM evm_claims
  WHERE address = p_address 
    AND chain_id = p_chain_id
    AND status = 'completed';
  
  IF last_claim_time IS NULL THEN
    RETURN TRUE;
  END IF;
  
  RETURN (NOW() - last_claim_time) >= (p_hours_interval || ' hours')::INTERVAL;
END;
$$ LANGUAGE plpgsql;

-- Create function to get time until next claim
CREATE OR REPLACE FUNCTION time_until_next_claim(
  p_address VARCHAR,
  p_chain_id INTEGER,
  p_hours_interval INTEGER DEFAULT 24
)
RETURNS INTERVAL AS $$
DECLARE
  last_claim_time TIMESTAMP WITH TIME ZONE;
  next_claim_time TIMESTAMP WITH TIME ZONE;
BEGIN
  SELECT MAX(created_at) INTO last_claim_time
  FROM evm_claims
  WHERE address = p_address 
    AND chain_id = p_chain_id
    AND status = 'completed';
  
  IF last_claim_time IS NULL THEN
    RETURN INTERVAL '0';
  END IF;
  
  next_claim_time := last_claim_time + (p_hours_interval || ' hours')::INTERVAL;
  
  IF NOW() >= next_claim_time THEN
    RETURN INTERVAL '0';
  END IF;
  
  RETURN next_claim_time - NOW();
END;
$$ LANGUAGE plpgsql;

