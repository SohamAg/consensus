# Setup Instructions

## 1. Database Setup

Execute `src/db/schema.sql` in your Supabase SQL Editor to create the 3 tables:
- `rooms` - Room state
- `messages` - All chat messages
- `interventions` - AI intervention logs

## 2. Environment Variables

Create `.env.local`:

```env
# Stream Chat
STREAM_KEY=your_key
STREAM_SECRET=your_secret
NEXT_PUBLIC_STREAM_API_KEY=your_api_key

# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_key

# Letta AI
LETTA_API_KEY=your_letta_key
LETTA_AGENT_ID=your_agent_id

# Janitor
JANITOR_BASE_URL=https://janitorai.com/hackathon
JANITOR_API_KEY=calhacks2047
```

## 3. Run

```bash
npm install
npm run dev
```

Visit: http://localhost:3000

## 4. Test

1. Click "Create Test Room"
2. Open multiple tabs with different users
3. Send messages - Letta agent will respond
4. Watch terminal for logs

## Architecture

- User message → Saved to DB → Triggers Letta agent
- Letta calls tool endpoints to get context
- If intervention needed: Calls `janitor_speak` tool
- Janitor generates message → Posts to chat as "Consensus"

### Tool Endpoints

Letta agent calls these 6 endpoints:

1. `GET /api/tools/get_room_context` - Room state
2. `GET /api/tools/get_recent_messages` - Last 20 messages
3. `GET /api/tools/get_participant_stats` - User stats
4. `GET /api/tools/check_silence_duration` - Time since last message
5. `POST /api/tools/janitor_speak` - Generate and post AI message
6. `POST /api/tools/log_intervention` - Log intervention

## Letta Agent Configuration

In Letta dashboard, configure these tools pointing to your domain:
```
https://your-domain/api/tools/get_room_context
https://your-domain/api/tools/get_recent_messages
https://your-domain/api/tools/get_participant_stats
https://your-domain/api/tools/check_silence_duration
https://your-domain/api/tools/janitor_speak
https://your-domain/api/tools/log_intervention
```

