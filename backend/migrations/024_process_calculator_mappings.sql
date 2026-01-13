-- Migration: Create process_calculator_mappings table
-- This table maps Process Groups → Process Routes → Operations → Calculators
-- Allows dynamic calculator assignment based on process selection

-- Create the process_calculator_mappings table
CREATE TABLE IF NOT EXISTS process_calculator_mappings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Process hierarchy
  process_group VARCHAR(255) NOT NULL,
  process_route VARCHAR(255) NOT NULL,
  operation VARCHAR(255) NOT NULL,

  -- Calculator reference
  calculator_id UUID REFERENCES calculators(id) ON DELETE CASCADE,
  calculator_name VARCHAR(255), -- Denormalized for quick access

  -- Metadata
  is_active BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,

  -- Audit fields
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Unique constraint to prevent duplicate mappings
  CONSTRAINT unique_process_calculator_mapping UNIQUE (process_group, process_route, operation)
);

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_process_calculator_mappings_process_group
  ON process_calculator_mappings(process_group);

CREATE INDEX IF NOT EXISTS idx_process_calculator_mappings_process_route
  ON process_calculator_mappings(process_route);

CREATE INDEX IF NOT EXISTS idx_process_calculator_mappings_operation
  ON process_calculator_mappings(operation);

CREATE INDEX IF NOT EXISTS idx_process_calculator_mappings_calculator_id
  ON process_calculator_mappings(calculator_id);

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_process_calculator_mappings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_process_calculator_mappings_updated_at
  BEFORE UPDATE ON process_calculator_mappings
  FOR EACH ROW
  EXECUTE FUNCTION update_process_calculator_mappings_updated_at();

-- Seed data - Complete process calculator mappings
INSERT INTO process_calculator_mappings (process_group, process_route, operation, calculator_name, display_order) VALUES
  -- Plastic & Rubber
  ('Plastic & Rubber', 'Compression Molding', 'Compression Molding', 'Compression Calculator', 1),
  ('Plastic & Rubber', 'Injection Molding', 'Injection Molding', 'Injection Molding Calculator', 2),
  ('Plastic & Rubber', 'Injection Molding', 'Injection Molding-Hot Runner', 'Injection Molding Calculator', 3),
  ('Plastic & Rubber', 'Injection Molding', 'Injection Molding-Cold Runner', 'Injection Molding Calculator', 4),
  ('Plastic & Rubber', 'Injection Molding', 'Insert Molding', 'Insert Molding Calculator', 5),
  ('Plastic & Rubber', 'Structural foam molding', 'Structural foam molding', 'Structural Foam Calculator', 6),
  ('Plastic & Rubber', 'Reaction Foam Molding', 'Reaction Foam Molding', 'Reaction Foam Calculator', 7),
  ('Plastic & Rubber', 'Thermoforming', '3 Station Rotary Thermoforming', 'Thermoforming Calculator', 8),
  ('Plastic & Rubber', 'Thermoforming', '4 Station Rotary Thermoforming', 'Thermoforming Calculator', 9),
  ('Plastic & Rubber', 'Thermoforming', 'Shuttle Station Thermoforming', 'Thermoforming Calculator', 10),
  ('Plastic & Rubber', 'Thermoforming', 'Single Station Thermoforming', 'Thermoforming Calculator', 11),
  ('Plastic & Rubber', 'Trimming / Degating', 'Manual', 'Manual Time Calculator', 12),
  ('Plastic & Rubber', 'Trimming / Degating', 'Semi Automated', 'Semi-Auto Time Calculator', 13),
  ('Plastic & Rubber', 'Raw Material', 'Granules / Pellets', 'Material Weight Calculator', 14),

  -- Machining
  ('Machining', 'Cutting', 'Band Saw Cutting', 'Band Saw Calculator', 100),
  ('Machining', 'Turning Center', 'Facing', 'Turning Center Calculator', 101),
  ('Machining', 'Turning Center', 'Turning', 'Turning Center Calculator', 102),
  ('Machining', 'Turning Center', 'Drilling', 'Turning Center Calculator', 103),
  ('Machining', 'Turning Center', 'Threading', 'Turning Center Calculator', 104),
  ('Machining', 'Turning Center', 'Chambering', 'Turning Center Calculator', 105),
  ('Machining', 'Turning Center', 'Taper Turning', 'Turning Center Calculator', 106),
  ('Machining', 'Turning Center', 'Step turning', 'Turning Center Calculator', 107),
  ('Machining', 'Turning Center', 'Contour turning', 'Turning Center Calculator', 108),
  ('Machining', 'Turning Center', 'Grooving', 'Turning Center Calculator', 109),
  ('Machining', 'Turning Center', 'Parting /Cut-off', 'Turning Center Calculator', 110),
  ('Machining', 'Turning Center', 'Knurling', 'Turning Center Calculator', 111),
  ('Machining', 'Turning Center', 'Eccentric / Off-Center Turning', 'Turning Center Calculator', 112),
  ('Machining', 'Milling  Center', 'Face milling', 'Milling Center Calculator', 113),
  ('Machining', 'Milling  Center', 'Peripheral (Slab) Milling', 'Milling Center Calculator', 114),
  ('Machining', 'Milling  Center', 'Thread Milling', 'Milling Center Calculator', 115),
  ('Machining', 'Milling  Center', 'Pocket Milling', 'Milling Center Calculator', 116),
  ('Machining', 'Milling  Center', 'Slot Milling', 'Milling Center Calculator', 117),
  ('Machining', 'Milling  Center', 'Contour / Profile Milling', 'Milling Center Calculator', 118),
  ('Machining', 'Milling  Center', 'Circular / Helical Milling', 'Milling Center Calculator', 119),
  ('Machining', 'Milling  Center', 'Chamfering', 'Milling Center Calculator', 120),
  ('Machining', 'Gear Cutting', 'Gear Hobbing', 'Gear Cutting Calculator', 121),
  ('Machining', 'Gear Cutting', 'Gear Shaping', 'Gear Cutting Calculator', 122),
  ('Machining', 'Gear Cutting', 'Gear Milling', 'Gear Cutting Calculator', 123),
  ('Machining', 'Gear Cutting', 'Gear Honing', 'Gear Cutting Calculator', 124),
  ('Machining', 'Gear Cutting', 'Gear Lapping', 'Gear Cutting Calculator', 125),
  ('Machining', 'Broach', 'Broaching', 'Broaching Calculator', 126),
  ('Machining', 'Broach', 'Gear Broaching', 'Broaching Calculator', 127),
  ('Machining', 'Grinding', 'Cyclinderical Grinding', 'Grinding Calculator', 128),
  ('Machining', 'Grinding', 'Centerless Grinding', 'Grinding Calculator', 129),
  ('Machining', 'Grinding', 'Surface grinding', 'Grinding Calculator', 130),
  ('Machining', 'Grinding', 'Gear Grinding', 'Grinding Calculator', 131),
  ('Machining', 'Drilling', 'Drilling', 'Drilling Calculator', 132),
  ('Machining', 'Drilling', 'Tapping', 'Drilling Calculator', 133),
  ('Machining', 'Drilling', 'Gun Drilling', 'Drilling Calculator', 134),
  ('Machining', 'Drilling', 'Boring', 'Drilling Calculator', 135),
  ('Machining', 'Drilling', 'Reaming', 'Drilling Calculator', 136),
  ('Machining', 'EDM', 'Wire EDM', 'EDM Calculator', 137),
  ('Machining', 'EDM', 'Spark EDM', 'EDM Calculator', 138),
  ('Machining', 'Raw Material', 'Round Bar', 'Bar Stock Calculator', 139),
  ('Machining', 'Raw Material', 'Rectangular Bar', 'Bar Stock Calculator', 140),
  ('Machining', 'Raw Material', 'Square Bar', 'Bar Stock Calculator', 141),
  ('Machining', 'Raw Material', 'Hexagonal Bar', 'Bar Stock Calculator', 142),
  ('Machining', 'Raw Material', 'Tube', 'Tube Stock Calculator', 143),
  ('Machining', 'Raw Material', 'Rectangular Tube', 'Tube Stock Calculator', 144),
  ('Machining', 'Raw Material', 'Square Tube', 'Tube Stock Calculator', 145),
  ('Machining', 'Raw Material', 'Ingot', 'Material Entry', 146),
  ('Machining', 'Raw Material', 'Casted RM', 'Material Entry', 147),
  ('Machining', 'Raw Material', 'Billet', 'Material Entry', 148),
  ('Machining', 'Raw Material', 'Wire Rod', 'Wire Stock Calculator', 149),
  ('Machining', 'Raw Material', 'Forged RM', 'Material Entry', 150),

  -- Sheet Metal
  ('Sheet Metal', 'Sheet Cutting', 'Shearning', 'Shearing Calculator', 200),
  ('Sheet Metal', 'Sheet Cutting', 'Fiber laser Cutting', 'Laser Cutting Calculator', 201),
  ('Sheet Metal', 'Sheet Cutting', 'Co2 Laser Cutting', 'Laser Cutting Calculator', 202),
  ('Sheet Metal', 'Sheet Cutting', 'Plasma Cutting', 'Plasma Cutting Calculator', 203),
  ('Sheet Metal', 'Sheet Cutting', 'Water jet Cutting', 'Water Jet Calculator', 204),
  ('Sheet Metal', 'Sheet Cutting', 'Blanking', 'Blanking Press Calculator', 205),
  ('Sheet Metal', 'Sheet Cutting', '3D Laser Cut', 'Laser Cutting Calculator', 206),
  ('Sheet Metal', 'Sheet Cutting', 'Turret Press', 'Turret Press Calculator', 207),
  ('Sheet Metal', 'Bending/Floating /Forming', 'Bend Brake', 'Press Brake Calculator', 208),
  ('Sheet Metal', 'Bending/Floating /Forming', 'Stage Tool Bending', 'Bending Calculator', 209),
  ('Sheet Metal', 'Bending/Floating /Forming', 'Stage Tool Forming', 'Forming Calculator', 210),
  ('Sheet Metal', 'Bending/Floating /Forming', 'Roll Forming', 'Roll Forming Calculator', 211),
  ('Sheet Metal', 'Bending/Floating /Forming', 'Deep Draw', 'Deep Draw Calculator', 212),
  ('Sheet Metal', 'Bending/Floating /Forming', 'Laser Puch', 'Punch Calculator', 213),
  ('Sheet Metal', 'Bending/Floating /Forming', 'Turret Press', 'Turret Press Calculator', 214),
  ('Sheet Metal', 'Bending/Floating /Forming', 'Progressive die', 'Progressive Die Calculator', 215),
  ('Sheet Metal', 'Bending/Floating /Forming', 'Offline Blank', 'Blanking Calculator', 216),
  ('Sheet Metal', 'Bending/Floating /Forming', 'Stretch forming', 'Stretch Forming Calculator', 217),
  ('Sheet Metal', 'Raw Material', 'Sheet', 'Sheet Stock Calculator', 218),
  ('Sheet Metal', 'Raw Material', 'Flat', 'Flat Stock Calculator', 219),
  ('Sheet Metal', 'Raw Material', 'Coil', 'Coil Stock Calculator', 220),
  ('Sheet Metal', 'Raw Material', 'I-Beam', 'Beam Stock Calculator', 221),
  ('Sheet Metal', 'Raw Material', 'H-Beam', 'Beam Stock Calculator', 222),
  ('Sheet Metal', 'Raw Material', 'Angle (L-shape)', 'Angle Stock Calculator', 223),
  ('Sheet Metal', 'Raw Material', 'Channel (C-shape / U-shape)', 'Channel Stock Calculator', 224),
  ('Sheet Metal', 'Raw Material', 'T-Sections', 'Section Stock Calculator', 225),
  ('Sheet Metal', 'Raw Material', 'Z-Sections', 'Section Stock Calculator', 226),

  -- Assembly
  ('Assembly', 'Pick & Place', 'Manual Pick and Place', 'Manual Assembly Time Calculator', 300),
  ('Assembly', 'Pick & Place', 'Semi automated', 'Semi-Auto Assembly Calculator', 301),
  ('Assembly', 'Welding', 'Mig Welding', 'MIG Welding Calculator', 302),
  ('Assembly', 'Welding', 'Tig Welding', 'TIG Welding Calculator', 303),
  ('Assembly', 'Welding', 'Spot Weld', 'Spot Welding Calculator', 304),
  ('Assembly', 'Welding', 'Seam Weld', 'Seam Welding Calculator', 305),
  ('Assembly', 'Welding', 'Laser Weld', 'Laser Welding Calculator', 306),
  ('Assembly', 'Screwing', 'Manal', 'Manual Fastening Calculator', 307),
  ('Assembly', 'Screwing', 'Power gun', 'Power Tool Calculator', 308),
  ('Assembly', 'Bolt Nut Assy', 'Power gun', 'Power Tool Calculator', 309),
  ('Assembly', 'Bolt Nut Assy', 'Manal', 'Manual Fastening Calculator', 310),
  ('Assembly', 'Electrical Connection', 'Wire Harness', 'Harness Assembly Calculator', 311),
  ('Assembly', 'Debur', 'Manual Debur', 'Deburring Time Calculator', 312),
  ('Assembly', 'Weld Cleaning', 'Manual', 'Manual Cleaning Calculator', 313),
  ('Assembly', 'Weld Cleaning', 'Semi automated-Sanding', 'Sanding Calculator', 314),

  -- Post Processing
  ('Post Processing', 'Surface Protection', 'Degrease', 'Degreasing Calculator', 400),
  ('Post Processing', 'Surface Protection', 'Phosphating', 'Phosphating Calculator', 401),
  ('Post Processing', 'Surface Protection', 'Blackning', 'Blackening Calculator', 402),
  ('Post Processing', 'Surface Protection', 'Plating', 'Plating Calculator', 403),
  ('Post Processing', 'Surface Protection', 'Zinc Nickel plating', 'Plating Calculator', 404),
  ('Post Processing', 'Surface Protection', 'Nickel Chrome Plating', 'Plating Calculator', 405),
  ('Post Processing', 'Surface Protection', 'Hard Chrome plating', 'Plating Calculator', 406),
  ('Post Processing', 'Surface Protection', 'Passivation', 'Passivation Calculator', 407),
  ('Post Processing', 'Surface Protection', 'Anodizing Type I', 'Anodizing Calculator', 408),
  ('Post Processing', 'Surface Protection', 'Anodizing Type II', 'Anodizing Calculator', 409),
  ('Post Processing', 'Surface Protection', 'Anodizing Type III', 'Anodizing Calculator', 410),
  ('Post Processing', 'Surface Protection', 'Manual Paint primer', 'Painting Calculator', 411),
  ('Post Processing', 'Surface Protection', 'Manual Paint finish Coat', 'Painting Calculator', 412),
  ('Post Processing', 'Surface Protection', 'Manual Paint hand Cleaning', 'Paint Prep Calculator', 413),
  ('Post Processing', 'Surface Protection', 'Manual Paint hand Sanding', 'Paint Prep Calculator', 414),
  ('Post Processing', 'Surface Protection', 'Masking', 'Masking Calculator', 415),
  ('Post Processing', 'Surface Protection', 'Powder Coating', 'Powder Coating Calculator', 416),
  ('Post Processing', 'Surface Protection', 'ED Coating', 'ED Coating Calculator', 417),
  ('Post Processing', 'Heat Treatment', 'Surface Harden', 'Heat Treatment Calculator', 418),
  ('Post Processing', 'Heat Treatment', 'Through Harden', 'Heat Treatment Calculator', 419),
  ('Post Processing', 'Heat Treatment', 'Anneal', 'Heat Treatment Calculator', 420),
  ('Post Processing', 'Heat Treatment', 'Temper', 'Heat Treatment Calculator', 421),
  ('Post Processing', 'Inspection', 'CMM Inspection', 'CMM Inspection Calculator', 422),
  ('Post Processing', 'Inspection', 'Manual Inspection', 'Manual Inspection Calculator', 423),
  ('Post Processing', 'Testing', 'Leak test', 'Leak Test Calculator', 424),
  ('Post Processing', 'Testing', 'Ultrasonic Test', 'UT Calculator', 425),
  ('Post Processing', 'Testing', 'MPT', 'MPT Calculator', 426),

  -- Packing & Delivery
  ('Packing & Delivery', 'Packing', 'Wooden Box Packing', 'Packing Calculator', 500),
  ('Packing & Delivery', 'Packing', 'Corrugated box packing', 'Packing Calculator', 501),
  ('Packing & Delivery', 'Packing', 'Pallet', 'Pallet Calculator', 502),
  ('Packing & Delivery', 'Delivery', 'Ex', 'Delivery Cost Calculator', 503),
  ('Packing & Delivery', 'Delivery', 'FCA', 'Delivery Cost Calculator', 504),
  ('Packing & Delivery', 'Delivery', 'DDP', 'Delivery Cost Calculator', 505)
ON CONFLICT (process_group, process_route, operation) DO NOTHING;

-- Add comment on table
COMMENT ON TABLE process_calculator_mappings IS 'Maps process groups, routes, and operations to calculators for dynamic assignment in process planning';
