-- Update RLS policies to allow anonymous access
-- Drop the existing authenticated-only policies
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON compatibility;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON compatibility;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON compatibility;
DROP POLICY IF EXISTS "Enable delete for authenticated users" ON compatibility;

-- Create new policies that allow all access (authenticated and anonymous)
CREATE POLICY "Allow read access for all" ON compatibility
  FOR SELECT
  USING (true);

CREATE POLICY "Allow insert for all" ON compatibility
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow update for all" ON compatibility
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow delete for all" ON compatibility
  FOR DELETE
  USING (true);
