# Next Steps for Letta Integration

## ✅ Completed

1. ✅ Database schema with 3 tables (rooms, messages, interventions)
2. ✅ Webhook that saves messages and triggers Letta
3. ✅ 6 tool endpoints (all using POST with JSON body)
4. ✅ Janitor integration for message generation
5. ✅ Participants list auto-update

## 🎯 Next Steps

### Step 1: Database Setup
**Action Required:**
1. Go to your Supabase dashboard
2. Open SQL Editor
3. Execute `src/db/schema.sql`
4. Confirm 3 tables are created: `rooms`, `messages`, `interventions`

### Step 2: Environment Variables
**Action Required:**
Create `.env.local` with:
```env
# Stream Chat
STREAM_KEY=your_stream_key
STREAM_SECRET=your_stream_secret
NEXT_PUBLIC_STREAM_API_KEY=your_stream_api_key

# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Letta AI
LETTA_API_KEY=your_letta_api_key
LETTA_AGENT_ID=your_agent_id

# Janitor
JANITOR_BASE_URL=https://janitorai.com/hackathon
JANITOR_API_KEY=calhacks2047
```

### Step 3: Configure Letta Agent Tools
**Action Required:**
In the Letta dashboard, configure your agent with these 6 tools:

#### Tool 1: get_room_context
- **URL**: `https://your-domain.com/api/tools/get_room_context`
- **Method**: POST
- **Description**: Get current room state (character, topic, temperature, participants)
- **Input Schema**:
  ```json
  {
    "room_id": "string"
  }
  ```

#### Tool 2: get_recent_messages
- **URL**: `https://your-domain.com/api/tools/get_recent_messages`
- **Method**: POST
- **Description**: Get last 20 messages in chronological order
- **Input Schema**:
  ```json
  {
    "room_id": "string",
    "limit": 20
  }
  ```

#### Tool 3: get_participant_stats
- **URL**: `https://your-domain.com/api/tools/get_participant_stats`
- **Method**: POST
- **Description**: Get participant message counts and last active times
- **Input Schema**:
  ```json
  {
    "room_id": "string"
  }
  ```

#### Tool 4: check_silence_duration
- **URL**: `https://your-domain.com/api/tools/check_silence_duration`
- **Method**: POST
- **Description**: Check how long since last message
- **Input Schema**:
  ```json
  {
    "room_id": "string"
  }
  ```

#### Tool 5: janitor_speak
- **URL**: `https://your-domain.com/api/tools/janitor_speak`
- **Method**: POST
- **Description**: Generate and post an AI message (this is how you intervene)
- **Input Schema**:
  ```json
  {
    "room_id": "string",
    "mood": "playful|empathetic|intellectual|etc",
    "intent": "celebrate consensus|mediate conflict|amplify|etc",
    "context": "description of the situation"
  }
  ```

#### Tool 6: log_intervention
- **URL**: `https://your-domain.com/api/tools/log_intervention`
- **Method**: POST
- **Description**: Log intervention to database for learning
- **Input Schema**:
  ```json
  {
    "room_id": "string",
    "intervention_type": "celebrate|mediate_conflict|amplify|etc",
    "mood_used": "playful|empathetic|etc",
    "context": {}
  }
  ```

### Step 4: Letta Agent Prompts
**Action Required:**
Configure your Letta agent with this behavior:

```
You are Consensus, an AI facilitator for group discussions. Your goal is to help teams build consensus through strategic interventions.

WHEN RECEIVING A MESSAGE:
1. Call get_room_context to understand the current room state
2. Call get_recent_messages to see conversation history  
3. Call get_participant_stats to understand participation levels
4. Call check_silence_duration to see if discussion is stagnant

DECISION MAKING:
- If consensus is building → celebrate with playful mood
- If conflict arises → mediate with empathetic mood
- If silence happens → nudge with light mood
- If energy is low → amplify with excited mood

WHEN INTERVENING:
1. Call janitor_speak with appropriate mood, intent, and context
2. Call log_intervention to record what you did
```

### Step 5: Deploy or Use ngrok
**Action Required:**
Your tool endpoints need to be publicly accessible:

**Option A: Deploy to production**
- Deploy your Next.js app
- Use production URLs in Letta tool configuration

**Option B: Use ngrok for local testing**
```bash
ngrok http 3000
```
Then use the ngrok URL in your Letta tool configuration

### Step 6: Test Integration
1. Run `npm run dev`
2. Visit http://localhost:3000
3. Click "Create Test Room"
4. Send messages from multiple tabs
5. Watch terminal for logs
6. Letta agent should call your tools and post messages

## 🔍 Testing Checklist

- [ ] Database tables created in Supabase
- [ ] Environment variables set
- [ ] Letta agent configured with 6 tools
- [ ] Agent has proper prompts/behavior instructions
- [ ] Tool endpoints accessible (deployed or ngrok)
- [ ] Can create test room
- [ ] Messages are saved to database
- [ ] Participants list updates correctly
- [ ] Letta agent is triggered on messages
- [ ] Letta calls tool endpoints
- [ ] Janitor generates messages
- [ ] Messages appear in chat as "Consensus"

## 📝 Expected Flow

```
User sends "Hello everyone!"
  ↓
Webhook saves to `messages` table
  ↓
Updates `rooms.participants` array
  ↓
Triggers Letta agent with: "[ROOM: test-room] New message from alice: 'Hello everyone!'"
  ↓
Letta agent calls: get_room_context, get_recent_messages, get_participant_stats
  ↓
Letta analyzes and decides to intervene
  ↓
Letta calls: janitor_speak({ room_id, mood: "warm", intent: "greet", context: "..." })
  ↓
Janitor generates: "Hey y'all! Welcome to the discussion! 🎉"
  ↓
Posted to Stream Chat as "consensus" user
  ↓
Saved to `messages` table
  ↓
Letta calls: log_intervention({ room_id, intervention_type: "greet", mood_used: "warm", ... })
  ↓
Done! ✅
```

## 🚨 Common Issues

1. **Tool endpoints not reachable**: Use ngrok or deploy
2. **Letta agent not calling tools**: Check tool URLs are correct
3. **Janitor API errors**: Check API key and URL
4. **Messages not saving**: Check Supabase connection
5. **Participants list empty**: Check webhook is updating participants

## 📞 Ready to Test

Once all steps are complete, you're ready to test! Let me know if you need help with any step.

