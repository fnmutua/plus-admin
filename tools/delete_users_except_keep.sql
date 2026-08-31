BEGIN;

CREATE TEMP TABLE users_to_delete AS
SELECT id
FROM users
WHERE lower(username) NOT IN ('maluini', 'fnmuua');

-- Keep user for reassigning required history fields
DO $$
DECLARE
  keep_user_id INTEGER;
BEGIN
  SELECT id INTO keep_user_id
  FROM users
  WHERE lower(username) = 'maluini'
  LIMIT 1;

  IF keep_user_id IS NULL THEN
    RAISE EXCEPTION 'Keep user maluini not found';
  END IF;

  UPDATE grievance_history
  SET changed_by = keep_user_id
  WHERE changed_by IN (SELECT id FROM users_to_delete);

  UPDATE project_history
  SET changed_by = keep_user_id
  WHERE changed_by IN (SELECT id FROM users_to_delete);

  UPDATE settlement_history
  SET changed_by = keep_user_id
  WHERE changed_by IN (SELECT id FROM users_to_delete);
END $$;

-- Tables with NO ACTION FKs (must clean first)
DELETE FROM chat_message_status
WHERE user_id IN (SELECT id FROM users_to_delete);

DELETE FROM grievance_escalation
WHERE escalated_by IN (SELECT id FROM users_to_delete)
   OR escalated_to IN (SELECT id FROM users_to_delete);

DELETE FROM grievance_resolution
WHERE resolved_by IN (SELECT id FROM users_to_delete);

DELETE FROM otp
WHERE user_id IN (SELECT id FROM users_to_delete);

DELETE FROM project_clockin
WHERE "createdBy" IN (SELECT id FROM users_to_delete);

DELETE FROM users
WHERE id IN (SELECT id FROM users_to_delete);

SELECT COUNT(*) AS remaining_users FROM users;
SELECT id, username, name, email
FROM users
ORDER BY id;

COMMIT;
