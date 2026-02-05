-- =====================================================
-- TEST SCRIPT FOR ATOMIC VENDOR RATING BATCH UPDATES
-- =====================================================

-- 1. Test the atomic batch update function
DO $$
DECLARE
  test_nomination_id UUID := '34ba91f4-e774-4817-9f8d-7a6c289ecfa2';
  test_vendor_id UUID := '8d298b8e-c30a-4082-a449-e17bc4abe5a1';
  test_updates JSONB;
  result JSONB;
  record_id UUID;
BEGIN
  -- Get a real record ID from the database
  SELECT id INTO record_id 
  FROM vendor_rating_matrix 
  WHERE nomination_evaluation_id = test_nomination_id 
    AND vendor_id = test_vendor_id 
  LIMIT 1;
  
  IF record_id IS NULL THEN
    RAISE NOTICE 'No test records found. Please check your data.';
    RETURN;
  END IF;
  
  -- Create test updates
  test_updates := jsonb_build_array(
    jsonb_build_object(
      'id', record_id,
      'sectionWiseCapabilityPercent', 75.5,
      'riskMitigationPercent', 68.2,
      'minorNC', 2,
      'majorNC', 0
    )
  );
  
  RAISE NOTICE 'Testing atomic batch update with record ID: %', record_id;
  RAISE NOTICE 'Test updates: %', test_updates;
  
  -- Test the atomic update function
  SELECT update_vendor_rating_matrix_batch(
    test_nomination_id,
    test_vendor_id, 
    test_updates
  ) INTO result;
  
  RAISE NOTICE 'Atomic batch update result: %', result;
  
  -- Verify the update worked
  IF (result->>'success')::BOOLEAN THEN
    RAISE NOTICE '✅ Atomic batch update SUCCESSFUL!';
    RAISE NOTICE 'Updated % out of % records', result->>'updated_count', result->>'total_items';
  ELSE
    RAISE NOTICE '❌ Atomic batch update FAILED!';
    RAISE NOTICE 'Errors: %', result->>'error_count';
  END IF;
  
END;
$$;

-- 2. Test the get function
DO $$
DECLARE
  test_nomination_id UUID := '34ba91f4-e774-4817-9f8d-7a6c289ecfa2';
  test_vendor_id UUID := '8d298b8e-c30a-4082-a449-e17bc4abe5a1';
  result JSONB;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE 'Testing get vendor rating matrix function...';
  
  SELECT get_vendor_rating_matrix(test_nomination_id, test_vendor_id) INTO result;
  
  RAISE NOTICE 'Found % records', jsonb_array_length(result);
  
  -- Show first record as sample
  IF jsonb_array_length(result) > 0 THEN
    RAISE NOTICE 'Sample record: %', result->0;
  END IF;
  
END;
$$;

-- 3. Test the calculate scores function
DO $$
DECLARE
  test_nomination_id UUID := '34ba91f4-e774-4817-9f8d-7a6c289ecfa2';
  test_vendor_id UUID := '8d298b8e-c30a-4082-a449-e17bc4abe5a1';
  result JSONB;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE 'Testing calculate overall scores function...';
  
  SELECT calculate_vendor_rating_overall_scores(test_nomination_id, test_vendor_id) INTO result;
  
  RAISE NOTICE 'Overall scores: %', result;
  
END;
$$;

-- 4. Verification query to check actual data
SELECT 
  id,
  assessment_aspects,
  section_wise_capability_percent,
  risk_mitigation_percent,
  minor_nc,
  major_nc,
  updated_at
FROM vendor_rating_matrix 
WHERE nomination_evaluation_id = '34ba91f4-e774-4817-9f8d-7a6c289ecfa2'
  AND vendor_id = '8d298b8e-c30a-4082-a449-e17bc4abe5a1'
ORDER BY sort_order, s_no
LIMIT 5;

-- 5. Performance test query
EXPLAIN ANALYZE 
SELECT update_vendor_rating_matrix_batch(
  '34ba91f4-e774-4817-9f8d-7a6c289ecfa2',
  '8d298b8e-c30a-4082-a449-e17bc4abe5a1',
  '[{"id": "58406492-bae3-4e5f-946e-b267db7ee1d5", "sectionWiseCapabilityPercent": 99.9}]'::JSONB
);

-- 6. Show current trigger functions
SELECT 
  trigger_name, 
  event_manipulation, 
  action_timing,
  action_statement
FROM information_schema.triggers 
WHERE event_object_table = 'vendor_rating_matrix';