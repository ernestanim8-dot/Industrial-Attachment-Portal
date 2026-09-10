-- ==========================================================
-- TTU Industrial Attachment Portal - Supabase Schema
-- ==========================================================

-- Enable pgcrypto for UUID generation if needed
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 1. USERS TABLE
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'student' CHECK (role IN ('student', 'supervisor', 'admin')),
    department TEXT CHECK (
        department IS NULL OR department IN (
            'Bachelor of Technology in Graphic Design',
            'Bachelor of Technology in Ceramics',
            'Bachelor of Technology in Textiles',
            'Bachelor of Technology in Fashion Design',
            'Bachelor of Technology in Sculpture and Industrial Production',
            'Bachelor of Technology in Painting'
        )
    ),
    phone TEXT,
    assigned_supervisor_id UUID REFERENCES users(id) ON DELETE SET NULL,
    otp TEXT,
    otp_expiry TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_assigned_supervisor ON users(assigned_supervisor_id);

DROP TRIGGER IF EXISTS trg_users_updated_at ON users;
CREATE TRIGGER trg_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 2. REPORTS TABLE
CREATE TABLE IF NOT EXISTS reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    file_url TEXT NOT NULL,
    file_name TEXT,
    file_size TEXT,
    type TEXT NOT NULL DEFAULT 'weekly' CHECK (type IN ('weekly', 'monthly', 'final')),
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'graded')),
    week_number INT,
    grade NUMERIC,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_reports_student_id ON reports(student_id);
CREATE INDEX IF NOT EXISTS idx_reports_status ON reports(status);

DROP TRIGGER IF EXISTS trg_reports_updated_at ON reports;
CREATE TRIGGER trg_reports_updated_at
    BEFORE UPDATE ON reports
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 3. ASSESSMENTS TABLE
CREATE TABLE IF NOT EXISTS assessments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    report_id UUID NOT NULL REFERENCES reports(id) ON DELETE CASCADE,
    supervisor_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    feedback TEXT NOT NULL,
    grade NUMERIC NOT NULL CHECK (grade >= 0 AND grade <= 100),
    criteria JSONB NOT NULL DEFAULT '{"content": 0, "presentation": 0, "understanding": 0}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_assessments_report_id ON assessments(report_id);
CREATE INDEX IF NOT EXISTS idx_assessments_supervisor_id ON assessments(supervisor_id);

DROP TRIGGER IF EXISTS trg_assessments_updated_at ON assessments;
CREATE TRIGGER trg_assessments_updated_at
    BEFORE UPDATE ON assessments
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 4. LOCATIONS TABLE
CREATE TABLE IF NOT EXISTS locations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    zone TEXT NOT NULL,
    city TEXT NOT NULL,
    address TEXT NOT NULL,
    description TEXT,
    contact_person TEXT,
    contact_phone TEXT,
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

DROP TRIGGER IF EXISTS trg_locations_updated_at ON locations;
CREATE TRIGGER trg_locations_updated_at
    BEFORE UPDATE ON locations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 5. CHECK-INS TABLE
CREATE TABLE IF NOT EXISTS check_ins (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    student_name TEXT NOT NULL,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    date TEXT NOT NULL,
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    address TEXT NOT NULL,
    city TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'verified_on_site' CHECK (status IN ('verified_on_site', 'off_site')),
    distance_from_assigned_km NUMERIC,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_check_ins_student_id ON check_ins(student_id);
CREATE INDEX IF NOT EXISTS idx_check_ins_date ON check_ins(date);

-- 6. DAILY REPORTS TABLE
CREATE TABLE IF NOT EXISTS daily_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    student_name TEXT NOT NULL,
    date TEXT NOT NULL,
    day_of_week TEXT NOT NULL,
    week_number INT NOT NULL,
    month_number INT NOT NULL,
    month_name TEXT NOT NULL,
    title TEXT NOT NULL,
    tasks_completed TEXT NOT NULL,
    skills_acquired TEXT,
    challenges_faced TEXT,
    hours_worked NUMERIC NOT NULL DEFAULT 8,
    equipment_or_tools TEXT,
    submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    status TEXT NOT NULL DEFAULT 'submitted' CHECK (status IN ('submitted', 'reviewed', 'graded')),
    grade NUMERIC,
    feedback TEXT,
    location_verified BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_daily_reports_student_id ON daily_reports(student_id);
CREATE INDEX IF NOT EXISTS idx_daily_reports_date ON daily_reports(date);

DROP TRIGGER IF EXISTS trg_daily_reports_updated_at ON daily_reports;
CREATE TRIGGER trg_daily_reports_updated_at
    BEFORE UPDATE ON daily_reports
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 7. ASSUMPTIONS (ASSUMPTION OF DUTY) TABLE
CREATE TABLE IF NOT EXISTS assumptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    student_name TEXT NOT NULL,
    submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    company_name TEXT NOT NULL,
    company_phone TEXT,
    company_email TEXT,
    company_zone TEXT,
    company_location TEXT,
    company_address TEXT,
    company_supervisor TEXT,
    letter_addressed_to TEXT,
    company_town TEXT,
    date_of_commencement TEXT,
    supervisor_phone TEXT,
    student_signature TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_assumptions_student_id ON assumptions(student_id);

DROP TRIGGER IF EXISTS trg_assumptions_updated_at ON assumptions;
CREATE TRIGGER trg_assumptions_updated_at
    BEFORE UPDATE ON assumptions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 8. ATTACHMENT LETTERS TABLE
CREATE TABLE IF NOT EXISTS attachment_letters (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    student_name TEXT NOT NULL,
    student_reg_no TEXT,
    student_phone TEXT,
    department TEXT,
    submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'verified', 'submitted', 'pdf_generated')),
    company_name TEXT NOT NULL,
    company_town TEXT NOT NULL,
    company_address TEXT,
    letter_addressed_to TEXT NOT NULL,
    student_signature TEXT,
    start_date TEXT,
    end_date TEXT,
    ref_number TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_attachment_letters_student_id ON attachment_letters(student_id);

DROP TRIGGER IF EXISTS trg_attachment_letters_updated_at ON attachment_letters;
CREATE TRIGGER trg_attachment_letters_updated_at
    BEFORE UPDATE ON attachment_letters
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 9. NOTIFICATIONS TABLE
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    recipient_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    type TEXT NOT NULL DEFAULT 'system' CHECK (type IN ('report_submitted', 'report_graded', 'report_reviewed', 'supervisor_assigned', 'system', 'info')),
    read BOOLEAN NOT NULL DEFAULT false,
    link TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_recipient_id ON notifications(recipient_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);

DROP TRIGGER IF EXISTS trg_notifications_updated_at ON notifications;
CREATE TRIGGER trg_notifications_updated_at
    BEFORE UPDATE ON notifications
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS) - Can be enabled per table
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE check_ins ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE assumptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE attachment_letters ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Allow service_role full access to all tables (used by backend API)
CREATE POLICY "Service role has full access to users" ON users FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role has full access to reports" ON reports FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role has full access to assessments" ON assessments FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role has full access to locations" ON locations FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role has full access to check_ins" ON check_ins FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role has full access to daily_reports" ON daily_reports FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role has full access to assumptions" ON assumptions FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role has full access to attachment_letters" ON attachment_letters FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role has full access to notifications" ON notifications FOR ALL USING (auth.role() = 'service_role');
