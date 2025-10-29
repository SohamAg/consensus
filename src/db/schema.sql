-- ═══ ROOMS TABLE ═══
CREATE TABLE rooms (
  room_id UUID PRIMARY KEY,
  character VARCHAR(50) NOT NULL, -- 'jack_sparrow', 'gordon_ramsay', etc
  topic TEXT,
  discussion_type VARCHAR(20), -- 'casual', 'intellectual', 'emotional', 'chaotic'
  temperature VARCHAR(20), -- 'neutral', 'excited', 'tense', 'flat', 'warm'
  created_at TIMESTAMP DEFAULT NOW(),
  last_activity TIMESTAMP DEFAULT NOW(),
  is_active BOOLEAN DEFAULT TRUE,
  participant_count INT DEFAULT 0,
  message_count INT DEFAULT 0
);

-- ═══ MESSAGES TABLE ═══
CREATE TABLE messages (
  message_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID REFERENCES rooms(room_id) ON DELETE CASCADE,
  username VARCHAR(100) NOT NULL,
  text TEXT NOT NULL,
  message_type VARCHAR(20) DEFAULT 'user', -- 'user', 'facilitator', 'system'
  timestamp TIMESTAMP DEFAULT NOW(),
  INDEX idx_room_timestamp (room_id, timestamp)
);

-- ═══ PARTICIPANTS TABLE ═══
CREATE TABLE participants (
  participant_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID REFERENCES rooms(room_id) ON DELETE CASCADE,
  username VARCHAR(100) NOT NULL,
  message_count INT DEFAULT 0,
  last_active TIMESTAMP DEFAULT NOW(),
  participation_ratio DECIMAL(5,2), -- percentage of room messages
  is_silent BOOLEAN DEFAULT FALSE,
  joined_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(room_id, username),
  INDEX idx_room_user (room_id, username)
);

-- ═══ INTERVENTIONS TABLE ═══
CREATE TABLE interventions (
  intervention_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID REFERENCES rooms(room_id) ON DELETE CASCADE,
  intervention_type VARCHAR(50) NOT NULL, -- 'mediate', 'amplify', 'celebrate', 'balance', 're_engage'
  character VARCHAR(50) NOT NULL,
  mood VARCHAR(50) NOT NULL, -- 'empathetic', 'sarcastic', 'enthusiastic', etc
  intent TEXT, -- strategic goal
  context TEXT, -- situation details
  message_sent TEXT, -- actual response
  outcome VARCHAR(20) DEFAULT 'pending', -- 'success', 'failed', 'pending'
  triggered_by TEXT, -- what pattern triggered this
  timestamp TIMESTAMP DEFAULT NOW(),
  INDEX idx_room_interventions (room_id, timestamp)
);

-- ═══ PROPOSALS TABLE ═══
CREATE TABLE proposals (
  proposal_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID REFERENCES rooms(room_id) ON DELETE CASCADE,
  proposed_by VARCHAR(100) NOT NULL,
  text TEXT NOT NULL,
  status VARCHAR(20) DEFAULT 'active', -- 'active', 'agreed', 'rejected', 'abandoned'
  supporters TEXT[], -- array of usernames who supported
  opposers TEXT[], -- array of usernames who opposed
  proposed_at TIMESTAMP DEFAULT NOW(),
  resolved_at TIMESTAMP,
  INDEX idx_room_proposals (room_id, status)
);

-- ═══ ROOM_STATE TABLE (live tracking) ═══
CREATE TABLE room_state (
  state_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID REFERENCES rooms(room_id) ON DELETE CASCADE UNIQUE,
  active_conflicts JSONB DEFAULT '[]', -- [{users: [], topic: '', severity: ''}]
  agreements_reached JSONB DEFAULT '[]', -- [{text: '', supporters: [], timestamp: ''}]
  silence_duration_seconds INT DEFAULT 0,
  last_message_at TIMESTAMP,
  dominant_speakers JSONB DEFAULT '[]', -- [{username: '', percentage: 0}]
  silent_users JSONB DEFAULT '[]', -- [usernames]
  unanswered_questions JSONB DEFAULT '[]', -- [{text: '', asked_by: '', timestamp: ''}]
  decision_paralysis_detected BOOLEAN DEFAULT FALSE,
  updated_at TIMESTAMP DEFAULT NOW()
);

-- ═══ LEARNING_LOG TABLE (for self-improvement) ═══
CREATE TABLE learning_log (
  log_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID REFERENCES rooms(room_id) ON DELETE CASCADE,
  intervention_id UUID REFERENCES interventions(intervention_id),
  success BOOLEAN,
  character VARCHAR(50),
  mood VARCHAR(50),
  intervention_type VARCHAR(50),
  context_summary TEXT,
  outcome_notes TEXT,
  learned_pattern TEXT, -- what pattern was identified
  effectiveness_score DECIMAL(3,2), -- 0.00 to 1.00
  timestamp TIMESTAMP DEFAULT NOW(),
  INDEX idx_learning_patterns (intervention_type, character, mood)
);

-- ═══ INDEXES FOR PERFORMANCE ═══
CREATE INDEX idx_rooms_active ON rooms(is_active, last_activity);
CREATE INDEX idx_messages_recent ON messages(room_id, timestamp DESC);
CREATE INDEX idx_interventions_type ON interventions(intervention_type, character);
CREATE INDEX idx_learning_effectiveness ON learning_log(effectiveness_score DESC);