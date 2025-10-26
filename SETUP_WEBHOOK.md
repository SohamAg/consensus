# How to Configure Stream Chat Webhook

## Problem
Stream cannot reach `http://localhost:3000` from their servers, so webhooks won't fire.

## Solution: Use ngrok

### Option 1: Quick ngrok Setup

1. **Install ngrok** (if not installed):
   ```bash
   # Download from https://ngrok.com/download
   # Or on Windows: choco install ngrok
   ```

2. **Run ngrok:**
   ```bash
   ngrok http 3000
   ```

3. **Copy the ngrok URL** (looks like `https://abc123.ngrok.io`)

4. **In Stream Dashboard:**
   - Go to Chat → Settings → Webhooks
   - Add webhook:
     - URL: `https://abc123.ngrok.io/api/stream/webhook`
     - Event: `message.new`
   - Save

5. **Keep ngrok running** while you test

### Option 2: Without Webhook (Client-Side)

If you don't want to use ngrok, I can modify the code to trigger Letta directly from the client when messages are sent.

## Test

After configuring:
1. Send a message in any room
2. Check terminal for:
   ```
   📨 NEW MESSAGE
   ✅ Message saved
   🤖 Triggering Letta agent
   ```
3. If Letta decides to intervene, you'll see a message from "consensus" in the chat

Which option do you want? ngrok (quickest) or modify code?

