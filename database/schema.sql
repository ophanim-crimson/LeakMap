-- Enable PostGIS extension
CREATE EXTENSION IF NOT EXISTS postgis;

-- Reports Table
CREATE TABLE IF NOT EXISTS reports (
    id SERIAL PRIMARY KEY,
    report_code VARCHAR(10) UNIQUE NOT NULL,
    issue_type VARCHAR(50) NOT NULL, -- 'Leak', 'Overflow', 'Damaged Tap', 'Broken Valve', 'Water Supply Issue', 'Other'
    description TEXT,
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    geometry GEOMETRY(Point, 4326),
    status VARCHAR(20) DEFAULT 'Active' NOT NULL, -- 'Active', 'Resolved'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Index for spatial queries
CREATE INDEX IF NOT EXISTS idx_reports_geometry ON reports USING GIST (geometry);
CREATE INDEX IF NOT EXISTS idx_reports_status ON reports (status);
CREATE INDEX IF NOT EXISTS idx_reports_issue_type ON reports (issue_type);

-- Photos Table
CREATE TABLE IF NOT EXISTS photos (
    id SERIAL PRIMARY KEY,
    report_id INTEGER REFERENCES reports(id) ON DELETE CASCADE,
    image_url TEXT NOT NULL,
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_photos_report_id ON photos (report_id);

-- Verifications Table
CREATE TABLE IF NOT EXISTS verifications (
    id SERIAL PRIMARY KEY,
    report_id INTEGER REFERENCES reports(id) ON DELETE CASCADE,
    verification_type VARCHAR(20) NOT NULL, -- 'Confirmed', 'Duplicate', 'Resolved'
    session_id VARCHAR(100) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    UNIQUE (report_id, session_id, verification_type)
);

CREATE INDEX IF NOT EXISTS idx_verifications_report_id ON verifications (report_id);

-- Updates Table
CREATE TABLE IF NOT EXISTS updates (
    id SERIAL PRIMARY KEY,
    report_id INTEGER REFERENCES reports(id) ON DELETE CASCADE,
    update_text TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_updates_report_id ON updates (report_id);
