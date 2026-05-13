-- Create products table
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  description TEXT NOT NULL,
  marca TEXT NOT NULL,
  price_distributor DECIMAL(10, 2) NOT NULL,
  price_resale DECIMAL(10, 2) NOT NULL,
  price_resale_with_ipi DECIMAL(10, 2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create batches table
CREATE TABLE batches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lote_number TEXT NOT NULL,
  quantity INTEGER NOT NULL,
  codes TEXT[] NOT NULL,
  total_price DECIMAL(12, 2) NOT NULL,
  total_price_with_ipi DECIMAL(12, 2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for faster lookups
CREATE INDEX idx_products_code ON products(code);
CREATE INDEX idx_products_marca ON products(marca);
CREATE INDEX idx_batches_lote_number ON batches(lote_number);

-- Insert sample data (from the PDF document)
INSERT INTO products (code, description, marca, price_distributor, price_resale, price_resale_with_ipi)
VALUES
  ('ODM-DE0062C', 'Eletrodo Adulto para Desfibrilação Compatível CMOS DRAKE PTO', 'Med-Link', 0.00, 198.55, 226.91),
  ('ODM-DE0062D', 'Eletrodo Adulto para Desfibrilação Compatível CMOS DRAKE AB', 'Med-Link', 0.00, 198.55, 226.91),
  ('ODM-DE0062B', 'Eletrodo Adulto para Desfibrilação Compatível MINDRAY', 'Med-Link', 0.00, 198.55, 226.91),
  ('ECG300G', 'ECG - Eletrocardiógafo Portátil 300G', 'Contec', 0.00, 0.00, 0.00),
  ('HD-00970', 'Desfibrilador Externo Automático', 'GABMED', 0.00, 0.00, 0.00),
  ('TP-00971', 'Termômetro Digital', 'GABMED', 0.00, 0.00, 0.00),
  ('99425-000189', 'LIFEPAK Monitor/Desfibrilador', 'Stryiker/Physio Control', 0.00, 0.00, 0.00);
