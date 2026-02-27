-- Quick command to run the user_session table migration
-- Copy and run this in your MySQL client

SOURCE e:/MobileDev_Portal/backend/sql/migrations/create_user_session.sql;

-- Verify the table was created
SHOW CREATE TABLE user_session;

-- Check current sessions (will be empty initially)
SELECT * FROM user_session;
