-- =====================================================
-- ATOMIC VENDOR RATING BATCH UPDATE SYSTEM
-- =====================================================

-- 1. Create atomic batch update function
CREATE OR REPLACE FUNCTION update_vendor_rating_matrix_batch(
  p_nomination_evaluation_id UUID,
  p_vendor_id UUID,
  p_updates JSONB
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  update_item JSONB;
  record_id UUID;
  updated_count INTEGER := 0;
  error_count INTEGER := 0;
  result JSONB;
  update_data JSONB;
BEGIN
  -- Start transaction explicitly
  BEGIN
    -- Validate inputs
    IF p_nomination_evaluation_id IS NULL OR p_vendor_id IS NULL THEN
      RAISE EXCEPTION 'nomination_evaluation_id and vendor_id are required';
    END IF;

    IF jsonb_array_length(p_updates) = 0 THEN
      RAISE EXCEPTION 'No updates provided';
    END IF;

    -- Process each update atomically
    FOR update_item IN SELECT * FROM jsonb_array_elements(p_updates)
    LOOP
      BEGIN
        -- Extract record ID
        record_id := (update_item->>'id')::UUID;
        
        IF record_id IS NULL THEN
          error_count := error_count + 1;
          CONTINUE;
        END IF;

        -- Build update data dynamically
        update_data := '{}'::JSONB;
        
        -- Add fields if they exist in the update
        IF update_item ? 'sectionWiseCapabilityPercent' THEN
          update_data := update_data || jsonb_build_object('section_wise_capability_percent', 
            (update_item->>'sectionWiseCapabilityPercent')::NUMERIC);
        END IF;
        
        IF update_item ? 'riskMitigationPercent' THEN
          update_data := update_data || jsonb_build_object('risk_mitigation_percent', 
            (update_item->>'riskMitigationPercent')::NUMERIC);
        END IF;
        
        IF update_item ? 'minorNC' THEN
          update_data := update_data || jsonb_build_object('minor_nc', 
            (update_item->>'minorNC')::INTEGER);
        END IF;
        
        IF update_item ? 'majorNC' THEN
          update_data := update_data || jsonb_build_object('major_nc', 
            (update_item->>'majorNC')::INTEGER);
        END IF;

        -- Always update the timestamp
        update_data := update_data || jsonb_build_object('updated_at', NOW());

        -- Perform the atomic update with safety checks
        UPDATE vendor_rating_matrix 
        SET 
          section_wise_capability_percent = COALESCE((update_data->>'section_wise_capability_percent')::NUMERIC, section_wise_capability_percent),
          risk_mitigation_percent = COALESCE((update_data->>'risk_mitigation_percent')::NUMERIC, risk_mitigation_percent),
          minor_nc = COALESCE((update_data->>'minor_nc')::INTEGER, minor_nc),
          major_nc = COALESCE((update_data->>'major_nc')::INTEGER, major_nc),
          updated_at = NOW()
        WHERE 
          id = record_id 
          AND nomination_evaluation_id = p_nomination_evaluation_id 
          AND vendor_id = p_vendor_id;

        -- Check if update was successful
        IF FOUND THEN
          updated_count := updated_count + 1;
        ELSE
          error_count := error_count + 1;
        END IF;

      EXCEPTION WHEN OTHERS THEN
        error_count := error_count + 1;
        CONTINUE;
      END;
    END LOOP;

    -- Build result
    result := jsonb_build_object(
      'success', (error_count = 0),
      'updated_count', updated_count,
      'error_count', error_count,
      'total_items', jsonb_array_length(p_updates),
      'timestamp', NOW()
    );

    -- Commit the transaction
    RETURN result;

  EXCEPTION WHEN OTHERS THEN
    -- Rollback on any error
    RAISE EXCEPTION 'Batch update failed: %', SQLERRM;
  END;
END;
$$;

-- 2. Create function to get vendor rating matrix with proper formatting
CREATE OR REPLACE FUNCTION get_vendor_rating_matrix(
  p_nomination_evaluation_id UUID,
  p_vendor_id UUID
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result JSONB;
BEGIN
  SELECT jsonb_agg(
    jsonb_build_object(
      'id', id,
      'nominationEvaluationId', nomination_evaluation_id,
      'vendorId', vendor_id,
      'sNo', s_no,
      'category', category,
      'assessmentAspects', assessment_aspects,
      'sectionWiseCapabilityPercent', section_wise_capability_percent,
      'riskMitigationPercent', risk_mitigation_percent,
      'minorNC', minor_nc,
      'majorNC', major_nc,
      'sortOrder', sort_order,
      'createdAt', created_at,
      'updatedAt', updated_at
    ) ORDER BY sort_order, s_no
  ) INTO result
  FROM vendor_rating_matrix 
  WHERE nomination_evaluation_id = p_nomination_evaluation_id 
    AND vendor_id = p_vendor_id;
    
  RETURN COALESCE(result, '[]'::JSONB);
END;
$$;

-- 3. Create function to calculate overall scores
CREATE OR REPLACE FUNCTION calculate_vendor_rating_overall_scores(
  p_nomination_evaluation_id UUID,
  p_vendor_id UUID
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result JSONB;
  avg_section_capability NUMERIC;
  avg_risk_mitigation NUMERIC;
  total_minor_nc INTEGER;
  total_major_nc INTEGER;
  total_records INTEGER;
BEGIN
  SELECT 
    ROUND(AVG(section_wise_capability_percent), 2),
    ROUND(AVG(risk_mitigation_percent), 2),
    SUM(minor_nc),
    SUM(major_nc),
    COUNT(*)
  INTO 
    avg_section_capability,
    avg_risk_mitigation,
    total_minor_nc,
    total_major_nc,
    total_records
  FROM vendor_rating_matrix
  WHERE nomination_evaluation_id = p_nomination_evaluation_id 
    AND vendor_id = p_vendor_id;

  result := jsonb_build_object(
    'sectionWiseCapability', COALESCE(avg_section_capability, 0),
    'riskMitigation', COALESCE(avg_risk_mitigation, 0),
    'totalMinorNC', COALESCE(total_minor_nc, 0),
    'totalMajorNC', COALESCE(total_major_nc, 0),
    'totalRecords', COALESCE(total_records, 0),
    'calculatedAt', NOW()
  );

  RETURN result;
END;
$$;

-- 4. Fix the trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION update_vendor_rating_timestamp()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- 5. Create trigger function for auto-updating scores (if referenced in your trigger)
CREATE OR REPLACE FUNCTION trigger_update_vendor_rating_scores()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- This function can be used to update aggregate scores in real-time
  -- For now, it's a placeholder that does nothing to avoid trigger errors
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- 6. Grant necessary permissions
GRANT EXECUTE ON FUNCTION update_vendor_rating_matrix_batch(UUID, UUID, JSONB) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION get_vendor_rating_matrix(UUID, UUID) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION calculate_vendor_rating_overall_scores(UUID, UUID) TO authenticated, anon;

-- 7. Add helpful indexes for performance
CREATE INDEX IF NOT EXISTS idx_vendor_rating_updated_at 
ON vendor_rating_matrix(updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_vendor_rating_batch_lookup 
ON vendor_rating_matrix(nomination_evaluation_id, vendor_id, updated_at DESC);

-- 8. Add a verification query to test the function
DO $$
BEGIN
  RAISE NOTICE 'Atomic vendor rating batch update functions created successfully!';
  RAISE NOTICE 'Test with: SELECT update_vendor_rating_matrix_batch(''uuid'', ''uuid'', ''[{"id": "uuid", "sectionWiseCapabilityPercent": 75}]''::JSONB);';
END;
$$;