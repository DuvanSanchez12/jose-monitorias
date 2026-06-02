-- Create profiles table for Jose's info
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  full_name TEXT,
  university TEXT DEFAULT 'Universidad del Tolima',
  semester TEXT DEFAULT '5to Semestre',
  program TEXT DEFAULT 'Medicina',
  bio TEXT,
  photo_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create weekly availability table (recurring slots)
CREATE TABLE IF NOT EXISTS availability_weekly (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  day_of_week INT NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT valid_time_range CHECK (start_time < end_time)
);

-- Create specific availability table (one-off dates)
CREATE TABLE IF NOT EXISTS availability_specific (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  is_booked BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT valid_time_range CHECK (start_time < end_time)
);

-- Create availability_days table (one row per day Jose is available)
CREATE TABLE IF NOT EXISTS availability_days (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL UNIQUE,
  is_available BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create topics table
CREATE TABLE IF NOT EXISTS topics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create monitorias table (tutoring sessions)
CREATE TABLE IF NOT EXISTS monitorias (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_name TEXT NOT NULL,
  student_email TEXT NOT NULL,
  student_phone TEXT,
  semester TEXT,
  program TEXT,
  topic TEXT,
  description TEXT,
  mode TEXT CHECK (mode IN ('virtual', 'presencial')) DEFAULT 'virtual',
  status TEXT CHECK (status IN ('pending', 'confirmed', 'completed', 'cancelled')) DEFAULT 'pending',
  scheduled_date DATE NOT NULL,
  scheduled_time TEXT NOT NULL,
  created_by TEXT CHECK (created_by IN ('student', 'admin')) DEFAULT 'student',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE availability_weekly ENABLE ROW LEVEL SECURITY;
ALTER TABLE availability_specific ENABLE ROW LEVEL SECURITY;
ALTER TABLE availability_days ENABLE ROW LEVEL SECURITY;
ALTER TABLE topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE monitorias ENABLE ROW LEVEL SECURITY;

-- RLS policies (drop first to allow re-running)
DO $$ BEGIN
  DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON profiles;
  DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;
  DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
  DROP POLICY IF EXISTS "Availability is viewable by everyone" ON availability_weekly;
  DROP POLICY IF EXISTS "Only authenticated users can manage availability" ON availability_weekly;
  DROP POLICY IF EXISTS "Specific availability is viewable by everyone" ON availability_specific;
  DROP POLICY IF EXISTS "Only authenticated users can manage specific availability" ON availability_specific;
  DROP POLICY IF EXISTS "Availability days are viewable by everyone" ON availability_days;
  DROP POLICY IF EXISTS "Only authenticated users can manage availability days" ON availability_days;
  DROP POLICY IF EXISTS "Topics are viewable by everyone" ON topics;
  DROP POLICY IF EXISTS "Only authenticated users can manage topics" ON topics;
  DROP POLICY IF EXISTS "Monitorias are viewable by everyone (for public scheduling)" ON monitorias;
  DROP POLICY IF EXISTS "Students can insert monitorias" ON monitorias;
  DROP POLICY IF EXISTS "Only authenticated users can update monitorias" ON monitorias;
  DROP POLICY IF EXISTS "Only authenticated users can delete monitorias" ON monitorias;
END $$;

CREATE POLICY "Public profiles are viewable by everyone"
  ON profiles FOR SELECT USING (TRUE);

CREATE POLICY "Users can insert their own profile"
  ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Availability is viewable by everyone"
  ON availability_weekly FOR SELECT USING (TRUE);

CREATE POLICY "Only authenticated users can manage availability"
  ON availability_weekly FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Specific availability is viewable by everyone"
  ON availability_specific FOR SELECT USING (TRUE);

CREATE POLICY "Only authenticated users can manage specific availability"
  ON availability_specific FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Availability days are viewable by everyone"
  ON availability_days FOR SELECT USING (TRUE);

CREATE POLICY "Only authenticated users can manage availability days"
  ON availability_days FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Topics are viewable by everyone"
  ON topics FOR SELECT USING (TRUE);

CREATE POLICY "Only authenticated users can manage topics"
  ON topics FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Monitorias are viewable by everyone (for public scheduling)"
  ON monitorias FOR SELECT USING (TRUE);

CREATE POLICY "Students can insert monitorias"
  ON monitorias FOR INSERT WITH CHECK (TRUE);

CREATE POLICY "Only authenticated users can update monitorias"
  ON monitorias FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Only authenticated users can delete monitorias"
  ON monitorias FOR DELETE USING (auth.role() = 'authenticated');

-- Prevent double booking: only one non-cancelled booking per slot
-- First remove duplicates keeping the newest row
DELETE FROM monitorias
WHERE id IN (
  SELECT id FROM (
    SELECT id, ROW_NUMBER() OVER (
      PARTITION BY scheduled_date, scheduled_time
      ORDER BY created_at DESC, id DESC
    ) AS rn
    FROM monitorias
    WHERE status != 'cancelled'
  ) dup
  WHERE dup.rn > 1
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_monitorias_active_booking
ON monitorias (scheduled_date, scheduled_time)
WHERE status != 'cancelled';

-- Create function to update updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_updated_at ON monitorias;
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON monitorias
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- Insert Jose's profile (run after creating user in auth)
-- UPDATE: Run this after creating the user in Supabase Auth
-- INSERT INTO profiles (id, full_name, university, semester, program, bio)
-- VALUES ('USER_UUID', 'Jose Gilberto Soler Callejas', 'Universidad del Tolima', '5to Semestre', 'Medicina', 'Monitor de Medicina - Quinto Semestre');
