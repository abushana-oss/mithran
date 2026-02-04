-- Create capability scoring functions
-- These functions support the capability scoring feature in the frontend

-- Function to get capability data for a nomination (FIXED VERSION)
-- Drop existing function first to handle return type change
DROP FUNCTION IF EXISTS get_capability_data(UUID);

CREATE OR REPLACE FUNCTION get_capability_data(p_nomination_evaluation_id UUID)
RETURNS TABLE (
    criteria_id UUID,
    criteria_name VARCHAR(255),
    max_score INTEGER,
    sort_order INTEGER,
    vendor_scores JSONB
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        cc.id,
        cc.criteria_name,
        cc.max_score,
        cc.sort_order,
        COALESCE(
            jsonb_object_agg(
                cvs.vendor_id,
                cvs.score
            ) FILTER (WHERE cvs.vendor_id IS NOT NULL),
            '{}'::jsonb
        ) AS vendor_scores
    FROM capability_criteria cc
    LEFT JOIN capability_vendor_scores cvs ON cc.id = cvs.criteria_id
    WHERE cc.nomination_evaluation_id = p_nomination_evaluation_id
    GROUP BY cc.id, cc.criteria_name, cc.max_score, cc.sort_order
    ORDER BY cc.sort_order;
END;
$$ LANGUAGE plpgsql;

-- Function to initialize capability criteria for a nomination (FIXED VERSION)
CREATE OR REPLACE FUNCTION initialize_capability_criteria(
  p_nomination_evaluation_id UUID, 
  p_vendor_ids UUID[]
)
RETURNS VOID AS $$
BEGIN
  -- Insert default capability criteria if none exist
  INSERT INTO capability_criteria (
    nomination_evaluation_id, 
    criteria_name, 
    max_score, 
    sort_order
  )
  SELECT p_nomination_evaluation_id, criteria_name, max_score, sort_order
  FROM (VALUES 
    ('Material Availability', 10, 1),
    ('Process Flow & Equipment Selection', 15, 2),
    ('Project Control', 20, 3),
    ('Capacity & Leadtime', 25, 4),
    ('Product & Process feasibility', 15, 5),
    ('Financial Analysis', 15, 6)
  ) AS default_criteria(criteria_name, max_score, sort_order)
  WHERE NOT EXISTS (
    SELECT 1 FROM capability_criteria 
    WHERE nomination_evaluation_id = p_nomination_evaluation_id
  );

  -- Initialize scores to 0 for all vendor-criteria combinations
  INSERT INTO capability_vendor_scores (
    criteria_id, 
    vendor_id, 
    score
  )
  SELECT cc.id, vendor_id, 0
  FROM capability_criteria cc
  CROSS JOIN UNNEST(p_vendor_ids) AS vendor_id
  WHERE cc.nomination_evaluation_id = p_nomination_evaluation_id
  ON CONFLICT (criteria_id, vendor_id) DO NOTHING;
END;
$$ LANGUAGE plpgsql;

-- Function to update capability score for a vendor (FIXED VERSION)
-- Drop existing function first to handle return type change
DROP FUNCTION IF EXISTS update_capability_score(UUID, UUID, DECIMAL);
DROP FUNCTION IF EXISTS update_capability_score(UUID, UUID, INTEGER);

CREATE OR REPLACE FUNCTION update_capability_score(
  p_criteria_id UUID,
  p_vendor_id UUID,
  p_score INTEGER
)
RETURNS VOID AS $$
BEGIN
  UPDATE capability_vendor_scores 
  SET 
    score = p_score,
    updated_at = NOW()
  WHERE criteria_id = p_criteria_id
    AND vendor_id = p_vendor_id;
END;
$$ LANGUAGE plpgsql;

-- Function to batch update capability scores
CREATE OR REPLACE FUNCTION batch_update_capability_scores(
  p_nomination_evaluation_id UUID,
  p_updates JSON
)
RETURNS VOID AS $$
DECLARE
  update_record JSON;
BEGIN
  FOR update_record IN SELECT * FROM json_array_elements(p_updates)
  LOOP
    PERFORM update_capability_score(
      (update_record->>'criteriaId')::UUID,
      (update_record->>'vendorId')::UUID,
      (update_record->>'score')::DECIMAL
    );
  END LOOP;
END;
$$ LANGUAGE plpgsql;