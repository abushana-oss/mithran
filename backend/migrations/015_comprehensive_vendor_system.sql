-- Migration: Comprehensive Vendor Management System
-- Description: Create vendor tables with equipment, services, and contacts for OEM and supplier management
-- Version: 015
-- Date: 2025-12-29

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Drop existing tables if they exist (for development)
DROP TABLE IF EXISTS vendor_equipment CASCADE;
DROP TABLE IF EXISTS vendor_services CASCADE;
DROP TABLE IF EXISTS vendor_contacts CASCADE;
DROP TABLE IF EXISTS vendors CASCADE;

-- Main vendors table with comprehensive company information
CREATE TABLE vendors (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Company Information
  supplier_code TEXT UNIQUE, -- e.g., CUS-1, CUS-2
  name TEXT NOT NULL,
  addresses TEXT,
  website TEXT,
  company_phone TEXT,
  major_customers TEXT,
  countries_served TEXT,
  company_turnover TEXT,

  -- Services
  industries TEXT[], -- Array of industries
  process TEXT[], -- Array of processes (CNC Machining, Casting, etc.)
  materials TEXT[], -- Array of materials

  -- Quality
  certifications TEXT[], -- ISO 9001, IATF 16949, etc.
  inspection_options TEXT,
  qms_metrics TEXT,
  qms_procedures TEXT,

  -- Facility Information
  manufacturing_workshop TEXT,
  warehouse BOOLEAN DEFAULT false,
  packing BOOLEAN DEFAULT false,
  logistics_transportation BOOLEAN DEFAULT false,
  maximum_production_capacity TEXT,
  average_capacity_utilization DECIMAL(5,2), -- Percentage
  num_hours_in_shift INTEGER,
  num_shifts_in_day INTEGER,
  num_working_days_per_week INTEGER,
  in_house_material_testing BOOLEAN DEFAULT false,

  -- Staff
  num_operators INTEGER,
  num_engineers INTEGER,
  num_production_managers INTEGER,

  -- Location (for filtering)
  city TEXT,
  state TEXT,
  country TEXT DEFAULT 'India',

  -- Documents
  company_profile_url TEXT,
  machine_list_url TEXT,

  -- Status
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'pending')),
  vendor_type TEXT DEFAULT 'supplier' CHECK (vendor_type IN ('supplier', 'oem', 'both')),

  -- Metadata
  user_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Foreign key constraint
  CONSTRAINT fk_vendors_user
    FOREIGN KEY (user_id)
    REFERENCES auth.users(id)
    ON DELETE CASCADE
);

-- Vendor Equipment Table (for bed size, tonnage, type filtering)
CREATE TABLE vendor_equipment (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  vendor_id UUID NOT NULL,

  -- Equipment Details
  manufacturer TEXT,
  model TEXT,
  equipment_type TEXT, -- cnc-machine, casting-machine, etc.
  equipment_subtype TEXT, -- vertical-machining-center, horizontal-boring, etc.

  -- Specifications
  bed_size_length_mm DECIMAL(10,2), -- Length in mm
  bed_size_width_mm DECIMAL(10,2), -- Width in mm
  bed_size_height_mm DECIMAL(10,2), -- Height in mm
  tonnage DECIMAL(10,2), -- For forging/casting machines

  -- Additional specs
  quantity INTEGER DEFAULT 1,
  year_of_manufacture INTEGER,
  market_price DECIMAL(12,2),

  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Foreign key constraint
  CONSTRAINT fk_vendor_equipment_vendor
    FOREIGN KEY (vendor_id)
    REFERENCES vendors(id)
    ON DELETE CASCADE
);

-- Vendor Services Table (detailed service capabilities)
CREATE TABLE vendor_services (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  vendor_id UUID NOT NULL,

  -- Service Details
  service_category TEXT NOT NULL, -- CNC Machining, Casting, Forging, etc.
  service_subcategory TEXT, -- Specific capability
  material_capability TEXT[], -- Materials they can work with

  -- Service specifications
  min_tonnage DECIMAL(10,2),
  max_tonnage DECIMAL(10,2),
  min_part_size_mm DECIMAL(10,2),
  max_part_size_mm DECIMAL(10,2),

  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Foreign key constraint
  CONSTRAINT fk_vendor_services_vendor
    FOREIGN KEY (vendor_id)
    REFERENCES vendors(id)
    ON DELETE CASCADE
);

-- Vendor Contacts Table
CREATE TABLE vendor_contacts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  vendor_id UUID NOT NULL,

  -- Contact Information
  name TEXT NOT NULL,
  designation TEXT,
  email TEXT,
  phone TEXT,
  is_primary BOOLEAN DEFAULT false,

  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Foreign key constraint
  CONSTRAINT fk_vendor_contacts_vendor
    FOREIGN KEY (vendor_id)
    REFERENCES vendors(id)
    ON DELETE CASCADE
);

-- Create indexes for performance
CREATE INDEX idx_vendors_user_id ON vendors(user_id);
CREATE INDEX idx_vendors_status ON vendors(status);
CREATE INDEX idx_vendors_vendor_type ON vendors(vendor_type);
CREATE INDEX idx_vendors_name ON vendors(name);
CREATE INDEX idx_vendors_city ON vendors(city);
CREATE INDEX idx_vendors_process ON vendors USING GIN(process);
CREATE INDEX idx_vendors_industries ON vendors USING GIN(industries);
CREATE INDEX idx_vendors_certifications ON vendors USING GIN(certifications);

CREATE INDEX idx_vendor_equipment_vendor_id ON vendor_equipment(vendor_id);
CREATE INDEX idx_vendor_equipment_type ON vendor_equipment(equipment_type);
CREATE INDEX idx_vendor_equipment_subtype ON vendor_equipment(equipment_subtype);
CREATE INDEX idx_vendor_equipment_tonnage ON vendor_equipment(tonnage);
CREATE INDEX idx_vendor_equipment_bed_size ON vendor_equipment(bed_size_length_mm, bed_size_width_mm, bed_size_height_mm);

CREATE INDEX idx_vendor_services_vendor_id ON vendor_services(vendor_id);
CREATE INDEX idx_vendor_services_category ON vendor_services(service_category);
CREATE INDEX idx_vendor_services_tonnage ON vendor_services(min_tonnage, max_tonnage);

CREATE INDEX idx_vendor_contacts_vendor_id ON vendor_contacts(vendor_id);
CREATE INDEX idx_vendor_contacts_primary ON vendor_contacts(is_primary);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_vendors_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER trigger_vendors_updated_at
  BEFORE UPDATE ON vendors
  FOR EACH ROW
  EXECUTE FUNCTION update_vendors_updated_at();

CREATE TRIGGER trigger_vendor_equipment_updated_at
  BEFORE UPDATE ON vendor_equipment
  FOR EACH ROW
  EXECUTE FUNCTION update_vendors_updated_at();

CREATE TRIGGER trigger_vendor_services_updated_at
  BEFORE UPDATE ON vendor_services
  FOR EACH ROW
  EXECUTE FUNCTION update_vendors_updated_at();

CREATE TRIGGER trigger_vendor_contacts_updated_at
  BEFORE UPDATE ON vendor_contacts
  FOR EACH ROW
  EXECUTE FUNCTION update_vendors_updated_at();

-- Enable Row Level Security
ALTER TABLE vendors ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendor_equipment ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendor_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendor_contacts ENABLE ROW LEVEL SECURITY;

-- Create RLS Policies for vendors
CREATE POLICY "Users can view their own vendors"
  ON vendors FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own vendors"
  ON vendors FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own vendors"
  ON vendors FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own vendors"
  ON vendors FOR DELETE
  USING (auth.uid() = user_id);

-- Create RLS Policies for vendor_equipment
CREATE POLICY "Users can view equipment of their vendors"
  ON vendor_equipment FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM vendors WHERE vendors.id = vendor_equipment.vendor_id AND vendors.user_id = auth.uid()
  ));

CREATE POLICY "Users can insert equipment for their vendors"
  ON vendor_equipment FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM vendors WHERE vendors.id = vendor_equipment.vendor_id AND vendors.user_id = auth.uid()
  ));

CREATE POLICY "Users can update equipment of their vendors"
  ON vendor_equipment FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM vendors WHERE vendors.id = vendor_equipment.vendor_id AND vendors.user_id = auth.uid()
  ));

CREATE POLICY "Users can delete equipment of their vendors"
  ON vendor_equipment FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM vendors WHERE vendors.id = vendor_equipment.vendor_id AND vendors.user_id = auth.uid()
  ));

-- Create RLS Policies for vendor_services
CREATE POLICY "Users can view services of their vendors"
  ON vendor_services FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM vendors WHERE vendors.id = vendor_services.vendor_id AND vendors.user_id = auth.uid()
  ));

CREATE POLICY "Users can insert services for their vendors"
  ON vendor_services FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM vendors WHERE vendors.id = vendor_services.vendor_id AND vendors.user_id = auth.uid()
  ));

CREATE POLICY "Users can update services of their vendors"
  ON vendor_services FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM vendors WHERE vendors.id = vendor_services.vendor_id AND vendors.user_id = auth.uid()
  ));

CREATE POLICY "Users can delete services of their vendors"
  ON vendor_services FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM vendors WHERE vendors.id = vendor_services.vendor_id AND vendors.user_id = auth.uid()
  ));

-- Create RLS Policies for vendor_contacts
CREATE POLICY "Users can view contacts of their vendors"
  ON vendor_contacts FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM vendors WHERE vendors.id = vendor_contacts.vendor_id AND vendors.user_id = auth.uid()
  ));

CREATE POLICY "Users can insert contacts for their vendors"
  ON vendor_contacts FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM vendors WHERE vendors.id = vendor_contacts.vendor_id AND vendors.user_id = auth.uid()
  ));

CREATE POLICY "Users can update contacts of their vendors"
  ON vendor_contacts FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM vendors WHERE vendors.id = vendor_contacts.vendor_id AND vendors.user_id = auth.uid()
  ));

CREATE POLICY "Users can delete contacts of their vendors"
  ON vendor_contacts FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM vendors WHERE vendors.id = vendor_contacts.vendor_id AND vendors.user_id = auth.uid()
  ));

-- Create a view for vendor summary with equipment count
CREATE OR REPLACE VIEW vendor_summary AS
SELECT
  v.*,
  COUNT(DISTINCT ve.id) as equipment_count,
  COUNT(DISTINCT vs.id) as service_count,
  json_agg(DISTINCT jsonb_build_object(
    'name', vc.name,
    'designation', vc.designation,
    'email', vc.email,
    'phone', vc.phone
  )) FILTER (WHERE vc.is_primary = true) as primary_contacts
FROM vendors v
LEFT JOIN vendor_equipment ve ON v.id = ve.vendor_id
LEFT JOIN vendor_services vs ON v.id = vs.vendor_id
LEFT JOIN vendor_contacts vc ON v.id = vc.vendor_id
GROUP BY v.id;

-- Comment on tables
COMMENT ON TABLE vendors IS 'Main vendor/supplier table with comprehensive company information';
COMMENT ON TABLE vendor_equipment IS 'Equipment owned by vendors with bed size, tonnage specifications';
COMMENT ON TABLE vendor_services IS 'Service capabilities offered by vendors';
COMMENT ON TABLE vendor_contacts IS 'Contact persons for each vendor';
