CREATE TABLE IF NOT EXISTS orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  company TEXT,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  comment TEXT,
  source TEXT,
  ip TEXT,
  status TEXT DEFAULT 'new'
);

-- Enable RLS
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- Only service role can insert/read
CREATE POLICY "service_only" ON orders USING (false);
