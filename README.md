# Consensus

AI-powered multiplayer chat with Letta integration.

## Quick Start

```bash
# Install
npm install

# Setup database
# Run src/db/schema.sql in Supabase SQL Editor

# Setup .env.local
# See SETUP.md for environment variables

# Run
npm run dev
```

Visit: http://localhost:3000

## How It Works

1. User sends message
2. Message saved to Supabase `messages` table
3. Triggers Letta agent
4. Letta calls tool endpoints to get context
5. If intervention needed: Generates message via Janitor
6. Posts to Stream Chat as "Consensus"
7. Logs intervention to database

## Files

- `src/db/schema.sql` - Database schema (3 tables only)
- `src/app/api/tools/` - 6 tool endpoints for Letta
- `src/app/api/stream/webhook/route.ts` - Message webhook
- `SETUP.md` - Detailed setup instructions

## Letta Tool Endpoints

Configure these in your Letta agent:

- `GET /api/tools/get_room_context`
- `GET /api/tools/get_recent_messages`
- `GET /api/tools/get_participant_stats`
- `GET /api/tools/check_silence_duration`
- `POST /api/tools/janitor_speak`
- `POST /api/tools/log_intervention`
