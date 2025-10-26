-- Simplified schema as per Letta specifications

-- ROOMS table
CREATE TABLE IF NOT EXISTS rooms (
  id TEXT PRIMARY KEY,
  character TEXT, -- e.g., "jack_sparrow", "dolly_parton", NULL = not set yet
  topic TEXT,
  discussion_type TEXT, -- casual|intellectual|emotional|chaotic
  temperature TEXT, -- neutral|excited|tense|flat|warm
  participants JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- MESSAGES table
CREATE TABLE IF NOT EXISTS messages (
  id SERIAL PRIMARY KEY,
  room_id TEXT REFERENCES rooms(id) ON DELETE CASCADE,
  username TEXT NOT NULL,
  text TEXT NOT NULL,
  timestamp TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_messages_room ON messages(room_id);
CREATE INDEX IF NOT EXISTS idx_messages_timestamp ON messages(timestamp DESC);

-- INTERVENTIONS table
CREATE TABLE IF NOT EXISTS interventions (
  id SERIAL PRIMARY KEY,
  room_id TEXT REFERENCES rooms(id) ON DELETE CASCADE,
  intervention_type TEXT,
  mood_used TEXT,
  context JSONB,
  timestamp TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_interventions_room ON interventions(room_id);

