-- Migration: Seed Manufacturing Processes
-- Description: Seeds the processes table with common manufacturing processes
-- Author: System
-- Date: 2026-01-04

-- ============================================================================
-- SEED MANUFACTURING PROCESSES
-- ============================================================================

INSERT INTO processes (
  process_name,
  process_category,
  description,
  standard_time_minutes,
  setup_time_minutes,
  cycle_time_minutes,
  machine_required,
  machine_type,
  labor_required,
  skill_level_required,
  user_id
)
VALUES
  (
    'Injection Molding',
    'Plastic Forming',
    'High-volume plastic part production using injection molding machines',
    45,
    30,
    35,
    true,
    'Injection Molding Machine',
    true,
    'Level 3 - Specialist',
    NULL
  ),
  (
    'CNC Machining',
    'Machining',
    'Computer-controlled machining for precise metal and plastic parts',
    120,
    60,
    15,
    true,
    'CNC Mill/Lathe',
    true,
    'Level 3 - Specialist',
    NULL
  ),
  (
    'Sheet Metal Bending',
    'Forming',
    'Bending sheet metal using press brakes and forming equipment',
    30,
    20,
    5,
    true,
    'Press Brake',
    true,
    'Level 2 - Skilled',
    NULL
  ),
  (
    'Laser Cutting',
    'Cutting',
    'Precision cutting of sheet materials using laser technology',
    25,
    15,
    3,
    true,
    'Laser Cutter',
    true,
    'Level 2 - Skilled',
    NULL
  ),
  (
    'Welding',
    'Joining',
    'Joining metal parts using various welding techniques (MIG, TIG, Arc)',
    40,
    10,
    8,
    false,
    'Welding Equipment',
    true,
    'Level 3 - Specialist',
    NULL
  ),
  (
    'Die Casting',
    'Casting',
    'High-pressure metal casting for complex shapes',
    60,
    45,
    25,
    true,
    'Die Casting Machine',
    true,
    'Level 3 - Specialist',
    NULL
  ),
  (
    'Powder Coating',
    'Finishing',
    'Electrostatic powder coating for durable surface finish',
    35,
    25,
    20,
    true,
    'Powder Coating Booth',
    true,
    'Level 2 - Skilled',
    NULL
  ),
  (
    'Assembly',
    'Assembly',
    'Manual or automated assembly of components into final products',
    90,
    15,
    30,
    false,
    NULL,
    true,
    'Level 1 - Entry',
    NULL
  ),
  (
    'Quality Inspection',
    'Quality Control',
    'Inspection and testing of manufactured parts',
    20,
    5,
    10,
    false,
    'Measurement Equipment',
    true,
    'Level 2 - Skilled',
    NULL
  ),
  (
    'Heat Treatment',
    'Treatment',
    'Thermal treatment to alter material properties',
    180,
    30,
    120,
    true,
    'Heat Treatment Furnace',
    true,
    'Level 3 - Specialist',
    NULL
  )
ON CONFLICT DO NOTHING;

-- ============================================================================
-- COMMENTS
-- ============================================================================
COMMENT ON TABLE processes IS 'Manufacturing processes with their specifications and requirements';
