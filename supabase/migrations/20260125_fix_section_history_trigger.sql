-- Fix: Product Guide Section delete trigger
-- Problem: AFTER DELETE trigger tries to insert section_id that no longer exists
-- Solution: Use NULL for section_id when logging deletions

CREATE OR REPLACE FUNCTION log_product_guide_section_changes()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'UPDATE' THEN
    INSERT INTO product_guide_history (guide_id, section_id, action, content_snapshot)
    VALUES (
      OLD.guide_id,
      OLD.id,
      'updated',
      jsonb_build_object(
        'title', OLD.title,
        'content', OLD.content,
        'section_type', OLD.section_type,
        'is_active', OLD.is_active
      )
    );
  ELSIF TG_OP = 'DELETE' THEN
    -- Use NULL for section_id since the section is being deleted
    -- Store the section_id in the content_snapshot instead for reference
    INSERT INTO product_guide_history (guide_id, section_id, action, content_snapshot)
    VALUES (
      OLD.guide_id,
      NULL,  -- section_id is NULL because it's deleted
      'deleted',
      jsonb_build_object(
        'deleted_section_id', OLD.id,
        'title', OLD.title,
        'content', OLD.content,
        'section_type', OLD.section_type
      )
    );
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Trigger already exists, just the function is updated
-- No need to recreate the trigger
