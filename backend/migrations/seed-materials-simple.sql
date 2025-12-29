-- ============================================================================
-- Seed Materials Data - Simple Version
-- ============================================================================
-- This will insert sample materials for the first user found in the database
-- Run this in Supabase SQL Editor
-- ============================================================================

DO $$
DECLARE
    target_user_id UUID;
    material_count INTEGER;
BEGIN
    -- Get the first user from the database
    SELECT id INTO target_user_id FROM auth.users ORDER BY created_at ASC LIMIT 1;

    IF target_user_id IS NULL THEN
        RAISE EXCEPTION 'No users found in the database. Please create a user first.';
    END IF;

    -- Check if materials already exist for this user
    SELECT COUNT(*) INTO material_count FROM materials WHERE user_id = target_user_id;

    IF material_count > 0 THEN
        RAISE NOTICE 'User % already has % materials. Skipping seed.', target_user_id, material_count;
        RETURN;
    END IF;

    RAISE NOTICE 'Seeding materials for user: %', target_user_id;

    -- Insert sample materials (first 10 from the seed data)
    INSERT INTO materials (
        material_group, material, material_abbreviation, material_grade,
        stock_form, material_state, application,
        regrinding, regrinding_percentage,
        clamping_pressure_mpa, eject_deflection_temp_celsius,
        melting_temp_celsius, mold_temp_celsius,
        density_kg_per_m3, specific_heat_j_per_g_celsius,
        thermal_conductivity_w_per_m_celsius,
        location, year, cost_q1, cost_q2, cost_q3, cost_q4,
        user_id
    ) VALUES
    ('Plastic & Rubber', 'Acrylonitrile Butadiene Styrene', 'ABS', 'ABS',
        'Granules', 'Base Polymer', 'Ext & Int Parts-Automotive, Electronics, Appliances',
        true, 10,
        49.4, 85,
        240, 70,
        1040, 1.8,
        0.127,
        'Bangalore', 2025, 125, 130, 140, 150,
        target_user_id),
    ('Plastic & Rubber', 'Acrylonitrile Butadiene Styrene', 'ABS', 'ABS, PC-ABS',
        'Granules', 'Blended', 'Automotive, Electrical,Electronics, Construction, Medical',
        true, 10,
        62, 85,
        240, 70,
        1070, 1.8,
        0.131,
        'Chennai', 2025, 125, 135, 146, 156,
        target_user_id),
    ('Plastic & Rubber', 'Polypropylene', 'PP', 'PP Homopolymer',
        'Granules', 'Base Polymer', 'Automotive, Packaging, Consumer Goods',
        true, 15,
        28, 95,
        220, 40,
        900, 1.9,
        0.12,
        'Bangalore', 2025, 95, 98, 105, 110,
        target_user_id),
    ('Plastic & Rubber', 'Polycarbonate', 'PC', 'PC General Purpose',
        'Granules', 'Base Polymer', 'Automotive, Electronics, Medical Devices',
        false, 0,
        65, 130,
        290, 85,
        1200, 1.2,
        0.2,
        'Mumbai', 2025, 280, 290, 300, 310,
        target_user_id),
    ('Plastic & Rubber', 'Polyamide (Nylon)', 'PA', 'PA 6',
        'Granules', 'Base Polymer', 'Automotive, Industrial, Electronics',
        true, 10,
        55, 180,
        260, 80,
        1130, 1.7,
        0.25,
        'Delhi', 2025, 220, 230, 240, 250,
        target_user_id),
    ('Plastic & Rubber', 'Polyethylene', 'PE', 'HDPE',
        'Granules', 'Base Polymer', 'Packaging, Containers, Automotive',
        true, 20,
        25, 75,
        180, 30,
        950, 2.3,
        0.45,
        'Bangalore', 2025, 85, 88, 92, 95,
        target_user_id),
    ('Plastic & Rubber', 'Polystyrene', 'PS', 'GPPS',
        'Granules', 'Base Polymer', 'Packaging, Consumer Electronics, Toys',
        true, 15,
        35, 85,
        210, 50,
        1050, 1.3,
        0.13,
        'Chennai', 2025, 110, 115, 120, 125,
        target_user_id),
    ('Plastic & Rubber', 'Thermoplastic Elastomer', 'TPE', 'TPE-S',
        'Granules', 'Elastomer', 'Automotive Seals, Grips, Soft-touch Applications',
        false, 0,
        15, 60,
        200, 40,
        950, 1.8,
        0.18,
        'Mumbai', 2025, 190, 195, 200, 205,
        target_user_id),
    ('Plastic & Rubber', 'Polyethylene Terephthalate', 'PET', 'PET General Purpose',
        'Granules', 'Base Polymer', 'Bottles, Packaging, Fibers',
        true, 10,
        55, 75,
        270, 90,
        1380, 1.2,
        0.24,
        'Pune', 2025, 120, 125, 130, 135,
        target_user_id),
    ('Plastic & Rubber', 'Polyvinyl Chloride', 'PVC', 'PVC Rigid',
        'Granules', 'Base Polymer', 'Construction, Pipes, Profiles',
        false, 0,
        42, 65,
        200, 55,
        1400, 0.9,
        0.16,
        'Ahmedabad', 2025, 95, 100, 105, 110,
        target_user_id);

    RAISE NOTICE 'Successfully seeded 10 sample materials for user %', target_user_id;
END$$;
