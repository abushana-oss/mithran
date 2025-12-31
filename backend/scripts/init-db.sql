-- Initialize EMITHRAN Database
-- This script sets up the initial database structure

-- Create database if it doesn't exist (run this separately as superuser)
-- CREATE DATABASE emithran;

-- Connect to database
\c emithran;

-- Create extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Log initialization
DO $$
BEGIN
    RAISE NOTICE 'EMITHRAN database initialized successfully';
END $$;
