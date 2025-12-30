-- ============================================================================
-- AUTHORIZATION SETUP - CLEAN VERSION
-- ============================================================================
-- This version safely updates existing policies and creates missing ones
-- Run this in: https://iuvtsvjpmovfymvnmqys.supabase.co/project/iuvtsvjpmovfymvnmqys/sql
-- ============================================================================

-- ============================================================================
-- STEP 1: CREATE AUTHORIZED_USERS TABLE (IF NOT EXISTS)
-- ============================================================================

CREATE TABLE IF NOT EXISTS authorized_users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) NOT NULL UNIQUE,
    full_name VARCHAR(255),
    role VARCHAR(50) DEFAULT 'user' CHECK (role IN ('admin', 'user', 'viewer')),
    is_active BOOLEAN DEFAULT true,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_authorized_users_email ON authorized_users(email);
CREATE INDEX IF NOT EXISTS idx_authorized_users_active ON authorized_users(is_active);

-- Add trigger for updated_at
DROP TRIGGER IF EXISTS update_authorized_users_updated_at ON authorized_users;
CREATE TRIGGER update_authorized_users_updated_at BEFORE UPDATE ON authorized_users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS
ALTER TABLE authorized_users ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- STEP 2: CREATE AUTHORIZATION CHECK FUNCTION
-- ============================================================================

CREATE OR REPLACE FUNCTION is_user_authorized()
RETURNS BOOLEAN AS $$
DECLARE
  user_email TEXT;
  is_active_user BOOLEAN;
BEGIN
  -- Get the email of the currently authenticated user
  SELECT email INTO user_email
  FROM auth.users
  WHERE id = auth.uid();

  -- If no email found, not authorized
  IF user_email IS NULL THEN
    RETURN FALSE;
  END IF;

  -- Check if user exists in authorized_users and is active
  SELECT is_active INTO is_active_user
  FROM authorized_users
  WHERE email = user_email;

  -- Return true only if user found and active
  RETURN COALESCE(is_active_user, FALSE);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- STEP 3: UPDATE RLS POLICIES - PROJECTS
-- ============================================================================

DO $$
BEGIN
    -- Drop existing policies
    DROP POLICY IF EXISTS "Users can view their own projects" ON projects;
    DROP POLICY IF EXISTS "Users can insert their own projects" ON projects;
    DROP POLICY IF EXISTS "Users can update their own projects" ON projects;
    DROP POLICY IF EXISTS "Users can delete their own projects" ON projects;
    DROP POLICY IF EXISTS "Authorized users can view their own projects" ON projects;
    DROP POLICY IF EXISTS "Authorized users can insert their own projects" ON projects;
    DROP POLICY IF EXISTS "Authorized users can update their own projects" ON projects;
    DROP POLICY IF EXISTS "Authorized users can delete their own projects" ON projects;
END $$;

CREATE POLICY "Authorized users can view their own projects"
    ON projects FOR SELECT
    USING (auth.uid() = user_id AND is_user_authorized());

CREATE POLICY "Authorized users can insert their own projects"
    ON projects FOR INSERT
    WITH CHECK (auth.uid() = user_id AND is_user_authorized());

CREATE POLICY "Authorized users can update their own projects"
    ON projects FOR UPDATE
    USING (auth.uid() = user_id AND is_user_authorized());

CREATE POLICY "Authorized users can delete their own projects"
    ON projects FOR DELETE
    USING (auth.uid() = user_id AND is_user_authorized());

-- ============================================================================
-- STEP 4: UPDATE RLS POLICIES - VENDORS
-- ============================================================================

DO $$
BEGIN
    DROP POLICY IF EXISTS "Users can view their own vendors" ON vendors;
    DROP POLICY IF EXISTS "Users can insert their own vendors" ON vendors;
    DROP POLICY IF EXISTS "Users can update their own vendors" ON vendors;
    DROP POLICY IF EXISTS "Users can delete their own vendors" ON vendors;
    DROP POLICY IF EXISTS "Authorized users can view their own vendors" ON vendors;
    DROP POLICY IF EXISTS "Authorized users can insert their own vendors" ON vendors;
    DROP POLICY IF EXISTS "Authorized users can update their own vendors" ON vendors;
    DROP POLICY IF EXISTS "Authorized users can delete their own vendors" ON vendors;
END $$;

CREATE POLICY "Authorized users can view their own vendors"
    ON vendors FOR SELECT
    USING (auth.uid() = user_id AND is_user_authorized());

CREATE POLICY "Authorized users can insert their own vendors"
    ON vendors FOR INSERT
    WITH CHECK (auth.uid() = user_id AND is_user_authorized());

CREATE POLICY "Authorized users can update their own vendors"
    ON vendors FOR UPDATE
    USING (auth.uid() = user_id AND is_user_authorized());

CREATE POLICY "Authorized users can delete their own vendors"
    ON vendors FOR DELETE
    USING (auth.uid() = user_id AND is_user_authorized());

-- ============================================================================
-- STEP 5: UPDATE RLS POLICIES - MATERIALS
-- ============================================================================

DO $$
BEGIN
    DROP POLICY IF EXISTS "Users can view their own materials" ON materials;
    DROP POLICY IF EXISTS "Users can insert their own materials" ON materials;
    DROP POLICY IF EXISTS "Users can update their own materials" ON materials;
    DROP POLICY IF EXISTS "Users can delete their own materials" ON materials;
    DROP POLICY IF EXISTS "Authorized users can view their own materials" ON materials;
    DROP POLICY IF EXISTS "Authorized users can insert their own materials" ON materials;
    DROP POLICY IF EXISTS "Authorized users can update their own materials" ON materials;
    DROP POLICY IF EXISTS "Authorized users can delete their own materials" ON materials;
END $$;

CREATE POLICY "Authorized users can view their own materials"
    ON materials FOR SELECT
    USING (auth.uid() = user_id AND is_user_authorized());

CREATE POLICY "Authorized users can insert their own materials"
    ON materials FOR INSERT
    WITH CHECK (auth.uid() = user_id AND is_user_authorized());

CREATE POLICY "Authorized users can update their own materials"
    ON materials FOR UPDATE
    USING (auth.uid() = user_id AND is_user_authorized());

CREATE POLICY "Authorized users can delete their own materials"
    ON materials FOR DELETE
    USING (auth.uid() = user_id AND is_user_authorized());

-- ============================================================================
-- STEP 6: UPDATE RLS POLICIES - BOMS
-- ============================================================================

DO $$
BEGIN
    DROP POLICY IF EXISTS "Users can view their own boms" ON boms;
    DROP POLICY IF EXISTS "Users can insert their own boms" ON boms;
    DROP POLICY IF EXISTS "Users can update their own boms" ON boms;
    DROP POLICY IF EXISTS "Users can delete their own boms" ON boms;
    DROP POLICY IF EXISTS "Authorized users can view their own boms" ON boms;
    DROP POLICY IF EXISTS "Authorized users can insert their own boms" ON boms;
    DROP POLICY IF EXISTS "Authorized users can update their own boms" ON boms;
    DROP POLICY IF EXISTS "Authorized users can delete their own boms" ON boms;
END $$;

CREATE POLICY "Authorized users can view their own boms"
    ON boms FOR SELECT
    USING (auth.uid() = user_id AND is_user_authorized());

CREATE POLICY "Authorized users can insert their own boms"
    ON boms FOR INSERT
    WITH CHECK (auth.uid() = user_id AND is_user_authorized());

CREATE POLICY "Authorized users can update their own boms"
    ON boms FOR UPDATE
    USING (auth.uid() = user_id AND is_user_authorized());

CREATE POLICY "Authorized users can delete their own boms"
    ON boms FOR DELETE
    USING (auth.uid() = user_id AND is_user_authorized());

-- ============================================================================
-- STEP 7: UPDATE RLS POLICIES - BOM_ITEMS
-- ============================================================================

DO $$
BEGIN
    DROP POLICY IF EXISTS "Users can view bom_items for their boms" ON bom_items;
    DROP POLICY IF EXISTS "Users can insert bom_items for their boms" ON bom_items;
    DROP POLICY IF EXISTS "Users can update bom_items for their boms" ON bom_items;
    DROP POLICY IF EXISTS "Users can delete bom_items for their boms" ON bom_items;
    DROP POLICY IF EXISTS "Authorized users can view bom_items for their boms" ON bom_items;
    DROP POLICY IF EXISTS "Authorized users can insert bom_items for their boms" ON bom_items;
    DROP POLICY IF EXISTS "Authorized users can update bom_items for their boms" ON bom_items;
    DROP POLICY IF EXISTS "Authorized users can delete bom_items for their boms" ON bom_items;
END $$;

CREATE POLICY "Authorized users can view bom_items for their boms"
    ON bom_items FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM boms
        WHERE boms.id = bom_items.bom_id
        AND boms.user_id = auth.uid()
    ) AND is_user_authorized());

CREATE POLICY "Authorized users can insert bom_items for their boms"
    ON bom_items FOR INSERT
    WITH CHECK (EXISTS (
        SELECT 1 FROM boms
        WHERE boms.id = bom_items.bom_id
        AND boms.user_id = auth.uid()
    ) AND is_user_authorized());

CREATE POLICY "Authorized users can update bom_items for their boms"
    ON bom_items FOR UPDATE
    USING (EXISTS (
        SELECT 1 FROM boms
        WHERE boms.id = bom_items.bom_id
        AND boms.user_id = auth.uid()
    ) AND is_user_authorized());

CREATE POLICY "Authorized users can delete bom_items for their boms"
    ON bom_items FOR DELETE
    USING (EXISTS (
        SELECT 1 FROM boms
        WHERE boms.id = bom_items.bom_id
        AND boms.user_id = auth.uid()
    ) AND is_user_authorized());

-- ============================================================================
-- STEP 8: UPDATE RLS POLICIES - VENDOR_EQUIPMENT
-- ============================================================================

-- Enable RLS first
ALTER TABLE vendor_equipment ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    DROP POLICY IF EXISTS "Users can view vendor_equipment for their vendors" ON vendor_equipment;
    DROP POLICY IF EXISTS "Users can insert vendor_equipment for their vendors" ON vendor_equipment;
    DROP POLICY IF EXISTS "Users can update vendor_equipment for their vendors" ON vendor_equipment;
    DROP POLICY IF EXISTS "Users can delete vendor_equipment for their vendors" ON vendor_equipment;
    DROP POLICY IF EXISTS "Authorized users can view vendor_equipment for their vendors" ON vendor_equipment;
    DROP POLICY IF EXISTS "Authorized users can insert vendor_equipment for their vendors" ON vendor_equipment;
    DROP POLICY IF EXISTS "Authorized users can update vendor_equipment for their vendors" ON vendor_equipment;
    DROP POLICY IF EXISTS "Authorized users can delete vendor_equipment for their vendors" ON vendor_equipment;
END $$;

CREATE POLICY "Authorized users can view vendor_equipment for their vendors"
    ON vendor_equipment FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM vendors
        WHERE vendors.id = vendor_equipment.vendor_id
        AND vendors.user_id = auth.uid()
    ) AND is_user_authorized());

CREATE POLICY "Authorized users can insert vendor_equipment for their vendors"
    ON vendor_equipment FOR INSERT
    WITH CHECK (EXISTS (
        SELECT 1 FROM vendors
        WHERE vendors.id = vendor_equipment.vendor_id
        AND vendors.user_id = auth.uid()
    ) AND is_user_authorized());

CREATE POLICY "Authorized users can update vendor_equipment for their vendors"
    ON vendor_equipment FOR UPDATE
    USING (EXISTS (
        SELECT 1 FROM vendors
        WHERE vendors.id = vendor_equipment.vendor_id
        AND vendors.user_id = auth.uid()
    ) AND is_user_authorized());

CREATE POLICY "Authorized users can delete vendor_equipment for their vendors"
    ON vendor_equipment FOR DELETE
    USING (EXISTS (
        SELECT 1 FROM vendors
        WHERE vendors.id = vendor_equipment.vendor_id
        AND vendors.user_id = auth.uid()
    ) AND is_user_authorized());

-- ============================================================================
-- STEP 9: UPDATE RLS POLICIES - VENDOR_SERVICES
-- ============================================================================

ALTER TABLE vendor_services ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    DROP POLICY IF EXISTS "Users can view vendor_services for their vendors" ON vendor_services;
    DROP POLICY IF EXISTS "Users can insert vendor_services for their vendors" ON vendor_services;
    DROP POLICY IF EXISTS "Users can update vendor_services for their vendors" ON vendor_services;
    DROP POLICY IF EXISTS "Users can delete vendor_services for their vendors" ON vendor_services;
    DROP POLICY IF EXISTS "Authorized users can view vendor_services for their vendors" ON vendor_services;
    DROP POLICY IF EXISTS "Authorized users can insert vendor_services for their vendors" ON vendor_services;
    DROP POLICY IF EXISTS "Authorized users can update vendor_services for their vendors" ON vendor_services;
    DROP POLICY IF EXISTS "Authorized users can delete vendor_services for their vendors" ON vendor_services;
END $$;

CREATE POLICY "Authorized users can view vendor_services for their vendors"
    ON vendor_services FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM vendors
        WHERE vendors.id = vendor_services.vendor_id
        AND vendors.user_id = auth.uid()
    ) AND is_user_authorized());

CREATE POLICY "Authorized users can insert vendor_services for their vendors"
    ON vendor_services FOR INSERT
    WITH CHECK (EXISTS (
        SELECT 1 FROM vendors
        WHERE vendors.id = vendor_services.vendor_id
        AND vendors.user_id = auth.uid()
    ) AND is_user_authorized());

CREATE POLICY "Authorized users can update vendor_services for their vendors"
    ON vendor_services FOR UPDATE
    USING (EXISTS (
        SELECT 1 FROM vendors
        WHERE vendors.id = vendor_services.vendor_id
        AND vendors.user_id = auth.uid()
    ) AND is_user_authorized());

CREATE POLICY "Authorized users can delete vendor_services for their vendors"
    ON vendor_services FOR DELETE
    USING (EXISTS (
        SELECT 1 FROM vendors
        WHERE vendors.id = vendor_services.vendor_id
        AND vendors.user_id = auth.uid()
    ) AND is_user_authorized());

-- ============================================================================
-- STEP 10: UPDATE RLS POLICIES - VENDOR_CONTACTS
-- ============================================================================

ALTER TABLE vendor_contacts ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    DROP POLICY IF EXISTS "Users can view vendor_contacts for their vendors" ON vendor_contacts;
    DROP POLICY IF EXISTS "Users can insert vendor_contacts for their vendors" ON vendor_contacts;
    DROP POLICY IF EXISTS "Users can update vendor_contacts for their vendors" ON vendor_contacts;
    DROP POLICY IF EXISTS "Users can delete vendor_contacts for their vendors" ON vendor_contacts;
    DROP POLICY IF EXISTS "Authorized users can view vendor_contacts for their vendors" ON vendor_contacts;
    DROP POLICY IF EXISTS "Authorized users can insert vendor_contacts for their vendors" ON vendor_contacts;
    DROP POLICY IF EXISTS "Authorized users can update vendor_contacts for their vendors" ON vendor_contacts;
    DROP POLICY IF EXISTS "Authorized users can delete vendor_contacts for their vendors" ON vendor_contacts;
END $$;

CREATE POLICY "Authorized users can view vendor_contacts for their vendors"
    ON vendor_contacts FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM vendors
        WHERE vendors.id = vendor_contacts.vendor_id
        AND vendors.user_id = auth.uid()
    ) AND is_user_authorized());

CREATE POLICY "Authorized users can insert vendor_contacts for their vendors"
    ON vendor_contacts FOR INSERT
    WITH CHECK (EXISTS (
        SELECT 1 FROM vendors
        WHERE vendors.id = vendor_contacts.vendor_id
        AND vendors.user_id = auth.uid()
    ) AND is_user_authorized());

CREATE POLICY "Authorized users can update vendor_contacts for their vendors"
    ON vendor_contacts FOR UPDATE
    USING (EXISTS (
        SELECT 1 FROM vendors
        WHERE vendors.id = vendor_contacts.vendor_id
        AND vendors.user_id = auth.uid()
    ) AND is_user_authorized());

CREATE POLICY "Authorized users can delete vendor_contacts for their vendors"
    ON vendor_contacts FOR DELETE
    USING (EXISTS (
        SELECT 1 FROM vendors
        WHERE vendors.id = vendor_contacts.vendor_id
        AND vendors.user_id = auth.uid()
    ) AND is_user_authorized());

-- ============================================================================
-- STEP 11: UPDATE RLS POLICIES - AUTHORIZED_USERS
-- ============================================================================

DO $$
BEGIN
    DROP POLICY IF EXISTS "Authenticated users can view authorized users" ON authorized_users;
    DROP POLICY IF EXISTS "Service role can manage authorized users" ON authorized_users;
    DROP POLICY IF EXISTS "Authorized users can view authorized users" ON authorized_users;
END $$;

CREATE POLICY "Authorized users can view authorized users"
    ON authorized_users FOR SELECT
    TO authenticated
    USING (is_user_authorized());

CREATE POLICY "Service role can manage authorized users"
    ON authorized_users FOR ALL
    TO service_role
    USING (true);

-- ============================================================================
-- STEP 12: ADD YOUR EMAIL AS AUTHORIZED USER
-- ============================================================================

INSERT INTO authorized_users (email, full_name, role, is_active)
VALUES ('emuski@mithran.com', 'Emuski', 'admin', true)
ON CONFLICT (email) DO UPDATE
SET is_active = true, role = 'admin', updated_at = NOW();

-- ============================================================================
-- VERIFICATION
-- ============================================================================

SELECT 'Setup complete!' AS status;

SELECT 'Authorized users:' AS info;
SELECT email, full_name, role, is_active, created_at
FROM authorized_users
ORDER BY created_at DESC;

-- ============================================================================
-- DONE!
-- ============================================================================
