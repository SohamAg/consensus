# Consensus

**AI-powered multiplayer chat with intelligent conversation facilitation**

Consensus is a real-time collaborative chat platform that uses **Letta AI** for intelligent decision-making and **Janitor AI** for character-based agent conversations to guide discussions toward a productive consensus.

---

## 🎯 Overview

Consensus creates AI-facilitated discussion rooms where:
- Multiple participants chat in real-time via Stream Chat
- **Letta** analyzes conversation dynamics and decides when to intervene
- **Janitor AI** generates context-aware, character-driven responses
- The AI agent (named "Consensus") appears in chat with purple notifications
- All activity is logged to Supabase for analytics

### Key Technologies

- **Frontend**: Next.js 14 (App Router), React, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, Node.js
- **Real-time**: Stream Chat React SDK
- **Database**: Supabase (PostgreSQL)
- **AI**: Letta AI (decision-making) + Janitor AI (message generation)

---

## 🏗️ Architecture

### Frontend (`src/`)

```
src/
├── app/                          # Next.js App Router
│   ├── page.tsx                  # Landing page (room list + create)
│   ├── room/[id]/page.tsx       # Chat room UI
│   ├── api/                      # Backend API routes
│   │   ├── stream/
│   │   │   └── webhook/          # Stream Chat webhooks
│   │   ├── rooms/
│   │   │   └── create/           # Create new room
│   │   ├── tools/                # Letta tool endpoints
│   │   │   ├── get_room_context/
│   │   │   ├── get_recent_messages/
│   │   │   ├── get_participant_stats/
│   │   │   ├── check_silence_duration/
│   │   │   ├── janitor_speak/    # ⭐ Generates AI messages
│   │   │   └── log_intervention/
│   │   ├── test/
│   │   │   └── send-message/     # Triggers Letta agent
│   │   └── messages/              # Get messages from DB
│   ├── globals.css               # Tailwind + animations
│   └── layout.tsx                # Root layout
├── components/
│   ├── ChatRoom.tsx              # Main chat interface
│   ├── ConsensusBanner.tsx       # "Consensus: Online" indicator
│   └── RoomHeader.tsx             # Chat header
├── lib/
│   ├── stream.ts                 # Stream Chat client setup
│   └── supabase.ts               # Supabase client setup
└── db/
    └── schema.sql                # Database schema (3 tables)
```

### Database Schema (`src/db/schema.sql`)

**Supabase Tables:**
1. **`rooms`** - Chat rooms (topic, character, participants)
2. **`messages`** - All chat messages (username, text, timestamp)
3. **`interventions`** - AI intervention logs (type, mood, context)

---

## 🤖 Letta + JanitorAI Integration

### Flow Overview

```
User sends message
    ↓
Message saved to Supabase
    ↓
Client triggers Letta agent via /api/test/send-message
    ↓
Letta analyzes conversation using tools:
    ├─ get_room_context
    ├─ get_recent_messages
    ├─ get_participant_stats
    └─ check_silence_duration
    ↓
Letta returns decision (JSON):
    {
      "action": "janitor_speak",
      "mood": "playful",
      "intent": "celebrate consensus",
      "context": "Alice and Bob agreed on Paris"
    }
    ↓
Backend calls Janitor API:
    └─ Character prompt + User intent
    ↓
Janitor generates character-based response
    ↓
Message posted to Stream Chat as "Consensus"
    ↓
Frontend displays purple notification
    ↓
Intervention logged to database
```

### Letta Agent Configuration

Your Letta agent should have these **tools** configured:

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/tools/get_room_context` | POST | Get room state (character, topic) |
| `/api/tools/get_recent_messages` | POST | Fetch recent messages |
| `/api/tools/get_participant_stats` | POST | Get participant message counts |
| `/api/tools/check_silence_duration` | POST | Calculate time since last message |
| `/api/tools/janitor_speak` | POST | Generate & post AI message |
| `/api/tools/log_intervention` | POST | Log intervention to database |

### JanitorAI Integration

**Endpoints:**
- `POST https://janitorai.com/hackathon/completions`
- Uses Bearer token authentication

**Character Prompts:**
The system generates character-specific prompts for several known characters depending on the topic

**Mood/Tone/Context:**
Depending on the context of the conversation, the agent continually adapts the mood/tone of speech, but in the style of the same character

**Response Format:**
```json
{
  "choices": [{
    "message": {
      "content": "Generated message text..."
    }
  }]
}
```

---

## 🌐 Networking

### API Routes

#### Message Flow (`/api/test/send-message`)

Triggered by client when user sends a message:

1. Saves message to Supabase `messages` table
2. Updates room `participants` list
3. Calls Letta agent with room context
4. If intervention needed:
   - Retrieves room character from DB
   - Builds Janitor prompt
   - Calls Janitor API
   - Posts to Stream Chat as 'consensus'
   - Saves to database
   - Logs intervention

#### Stream Chat Integration

**Configuration:**
- Webhook URL: `https://your-ngrok-url.ngrok.io/api/stream/webhook`
- Events: `message.new`

**Users:**
- Real users (alice, bob, carol, dave)
- AI user: `consensus` (name: "Consensus")

---

## 🚀 Setup

### Prerequisites

- Node.js 18+
- Supabase account
- Stream Chat account
- Letta AI API key
- Janitor AI API key

### Environment Variables (`.env.local`)

```bash
# Stream Chat
NEXT_PUBLIC_STREAM_API_KEY=your_stream_key
STREAM_API_SECRET=your_stream_secret
STREAM_KEY=your_stream_key

# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# AI Services
LETTA_API_KEY=your_letta_token
LETTA_AGENT_ID=your_agent_id

# Janitor AI (optional, defaults provided)
JANITOR_BASE_URL=https://janitorai.com/hackathon/completions
JANITOR_API_KEY=calhacks2047
```

### Installation

```bash
# Install dependencies
npm install

# Run database migrations
# Copy and paste src/db/schema.sql into Supabase SQL Editor

# Start development server
npm run dev
```

Visit: **http://localhost:3000**

### Testing

1. **Create a room** from the landing page
2. **Open multiple tabs** with different users (alice, bob, carol)
3. **Send messages** in the room
4. **Watch for AI notifications** in the top-right (purple cards)
5. **Check terminal logs** for Letta/Janitor activity

---

## 📊 Frontend Components

### ChatRoom (`src/components/ChatRoom.tsx`)

**Features:**
- Real-time message display (Stream Chat)
- Triggers Letta on user messages
- Shows AI notifications as purple toasts
- Handles deduplication (one trigger per message)

**Key Logic:**
```typescript
// Listen for new messages
channel.on('message.new', handleMessage)

// Trigger Letta
await fetch('/api/test/send-message', { ... })

// Fetch and display AI response
const messages = await fetch('/api/messages?username=consensus')
setAiMessages([...messages])
```

### AI Notifications

Displayed as **absolute positioned** purple cards:
- Slides in from right
- Auto-dismisses after 8 seconds
- Shows "✨ Consensus AI" header
- Contains AI-generated message text

---

## 🔧 Development

### Key API Endpoints

**Message Handling:**
- `POST /api/test/send-message` - Trigger Letta (called by client)
- `GET /api/messages` - Fetch messages from DB

**Letta Tools:**
- `POST /api/tools/janitor_speak` - Generate & post AI message
- `POST /api/tools/get_room_context` - Get room state
- `POST /api/tools/get_recent_messages` - Get recent messages
- `POST /api/tools/get_participant_stats` - Participant analytics
- `POST /api/tools/check_silence_duration` - Silence detection
- `POST /api/tools/log_intervention` - Log AI activity

### Debugging

**Terminal logs show:**
```
🚀 Triggering Letta for message...
🎯 Letta decided to INTERVENE!
🎭 Calling Janitor API...
💬 Generated message: "..."
✅ Posted to Stream Chat
```

**Browser console shows:**
```
🎯 Letta intervened! Fetching AI message...
📥 Fetching messages from /api/messages...
✅ AI message added to state
```

---

## 🎨 Features

- **Multi-user chat** via Stream Chat
- **AI facilitation** via Letta decision-making
- **Character-based responses** via Janitor AI
- **Real-time notifications** with purple toast UI
- **Intervention logging** for analytics
- **Deduplication** to prevent duplicate triggers
- **Automatic participant tracking**

---

## 📝 Notes

- **Deduplication**: Each message is processed once via `processedMessagesRef`
- **Consensus User**: Created automatically in Stream Chat as a member
- **Character System**: Rooms can have different AI characters (dolly_parton, jack_sparrow, gordon_ramsay)
- **Notifications**: AI messages appear as purple notifications, not in Stream Chat UI
- **Webhook Alternative**: Client-side triggering used instead of webhooks for local dev

---

## 🛠️ Troubleshooting

**AI messages not showing:**
- Check browser console for logs
- Verify Letta agent is responding
- Check Janitor API is working
- Ensure `consensus` user exists in Stream

**Duplicate triggers:**
- Already handled by deduplication logic
- Only processes current user's messages

**Letta not responding:**
- Verify LETTA_API_KEY and LETTA_AGENT_ID are set
- Check Letta dashboard for agent status
- Review terminal logs for API errors
