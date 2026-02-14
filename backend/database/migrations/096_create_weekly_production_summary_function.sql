-- Create function to calculate weekly production summary
CREATE OR REPLACE FUNCTION get_weekly_production_summary(lot_id_param UUID)
RETURNS TABLE (
    week_number INTEGER,
    week_start DATE,
    week_end DATE,
    total_target_quantity INTEGER,
    total_produced_quantity INTEGER,
    total_rejected_quantity INTEGER,
    total_rework_quantity INTEGER,
    total_downtime_minutes INTEGER,
    efficiency NUMERIC(5,2)
) AS $$
BEGIN
    RETURN QUERY
    WITH weekly_data AS (
        SELECT 
            EXTRACT(WEEK FROM pe.entry_date)::INTEGER AS week_num,
            DATE_TRUNC('week', pe.entry_date)::DATE AS week_start_date,
            (DATE_TRUNC('week', pe.entry_date) + INTERVAL '6 days')::DATE AS week_end_date,
            SUM(pe.target_quantity) AS target_qty,
            SUM(pe.produced_quantity) AS produced_qty,
            SUM(pe.rejected_quantity) AS rejected_qty,
            SUM(pe.rework_quantity) AS rework_qty,
            SUM(pe.downtime_minutes) AS downtime_mins
        FROM production_entries pe
        WHERE pe.lot_id = lot_id_param
        GROUP BY 
            EXTRACT(WEEK FROM pe.entry_date),
            DATE_TRUNC('week', pe.entry_date)
        ORDER BY week_start_date
    )
    SELECT 
        wd.week_num,
        wd.week_start_date,
        wd.week_end_date,
        wd.target_qty,
        wd.produced_qty,
        wd.rejected_qty,
        wd.rework_qty,
        wd.downtime_mins,
        CASE 
            WHEN wd.target_qty > 0 
            THEN ROUND((wd.produced_qty::NUMERIC / wd.target_qty::NUMERIC) * 100, 2)
            ELSE 0::NUMERIC 
        END AS efficiency_pct
    FROM weekly_data wd;
END;
$$ LANGUAGE plpgsql;

-- Add comment for documentation
COMMENT ON FUNCTION get_weekly_production_summary(UUID) IS 'Calculate weekly production summary statistics for a specific lot';