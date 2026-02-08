-- ============================================================================
-- MIGRATION 083: Add BOM Items for Vendor Assignment
-- ============================================================================
-- This migration adds BOM items so the vendor assignment dialog works

DO $$
DECLARE
    bom_record RECORD;
    current_user_id UUID;
    item_count INTEGER := 0;
BEGIN
    -- Get current user
    SELECT id INTO current_user_id FROM auth.users LIMIT 1;
    
    -- Add BOM items to existing BOMs that don't have items
    FOR bom_record IN 
        SELECT 
            b.id as bom_id,
            b.name as bom_name,
            b.user_id
        FROM boms b
        WHERE NOT EXISTS (
            SELECT 1 FROM bom_items bi WHERE bi.bom_id = b.id
        )
        ORDER BY b.created_at DESC
        LIMIT 5
    LOOP
        -- Add sample BOM items for each BOM
        INSERT INTO bom_items (
            id,
            bom_id,
            name,
            part_number,
            description,
            item_type,
            material,
            material_grade,
            quantity,
            annual_volume,
            unit,
            unit_cost,
            make_buy,
            user_id,
            created_at,
            updated_at
        ) VALUES 
        (
            uuid_generate_v4(),
            bom_record.bom_id,
            'Main Assembly',
            'MA-001',
            'Main assembly component',
            'assembly',
            'Steel',
            'Grade A',
            1,
            1000,
            'pcs',
            100.00,
            'make',
            COALESCE(bom_record.user_id, current_user_id),
            NOW(),
            NOW()
        ),
        (
            uuid_generate_v4(),
            bom_record.bom_id,
            'Support Bracket',
            'SB-002',
            'Supporting bracket for assembly',
            'child_part',
            'Aluminum',
            'Standard',
            2,
            1000,
            'pcs',
            25.50,
            'buy',
            COALESCE(bom_record.user_id, current_user_id),
            NOW(),
            NOW()
        ),
        (
            uuid_generate_v4(),
            bom_record.bom_id,
            'Mounting Hardware',
            'MH-003',
            'Bolts and fasteners',
            'child_part',
            'Stainless Steel',
            'A4',
            8,
            1000,
            'pcs',
            2.75,
            'buy',
            COALESCE(bom_record.user_id, current_user_id),
            NOW(),
            NOW()
        );
        
        item_count := item_count + 3;
        RAISE NOTICE 'Added 3 BOM items to: %', bom_record.bom_name;
    END LOOP;
    
    -- Also create a vendor if none exists
    IF NOT EXISTS (SELECT 1 FROM vendors LIMIT 1) THEN
        INSERT INTO vendors (
            id,
            name,
            company_email,
            contact_person,
            phone,
            address,
            vendor_type,
            status,
            created_at,
            updated_at
        ) VALUES 
        (
            uuid_generate_v4(),
            'ABC Manufacturing Co.',
            'sales@abcmfg.com',
            'John Smith',
            '+1-555-0123',
            '123 Industrial Blvd, Manufacturing City, MC 12345',
            'supplier',
            'active',
            NOW(),
            NOW()
        ),
        (
            uuid_generate_v4(),
            'XYZ Components Ltd.',
            'orders@xyzcomponents.com',
            'Sarah Johnson',
            '+1-555-0456',
            '456 Component Ave, Parts Town, PT 67890',
            'supplier',
            'active',
            NOW(),
            NOW()
        );
        
        RAISE NOTICE 'Created 2 sample vendors';
    END IF;
    
    RAISE NOTICE '=================================';
    RAISE NOTICE 'BOM ITEMS ADDED: %', item_count;
    RAISE NOTICE '=================================';
    
    -- Show BOM items for reference
    FOR bom_record IN
        SELECT 
            bi.id,
            bi.name,
            bi.part_number,
            bi.unit_cost,
            bi.make_buy,
            b.name as bom_name
        FROM bom_items bi
        JOIN boms b ON b.id = bi.bom_id
        ORDER BY b.created_at DESC, bi.created_at ASC
    LOOP
        RAISE NOTICE 'ITEM: % | Part: % | Cost: $% | Type: %',
            bom_record.name,
            bom_record.part_number,
            bom_record.unit_cost,
            bom_record.make_buy;
    END LOOP;
    
END $$;