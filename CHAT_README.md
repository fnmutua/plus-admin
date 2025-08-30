# Team Chat Feature

## Overview
A real-time chat system has been integrated into the admin panel, allowing users to see who's online and send messages in real-time.

## Features
- **Real-time messaging** - Messages are delivered instantly via WebSocket
- **Online users list** - See who's currently online
- **User status indicators** - Online, away, busy status with color-coded indicators
- **Mobile responsive design** - Optimized for both desktop and mobile devices
- **Private messaging** - Click on a user to start a private conversation
- **Message timestamps** - All messages include timestamps
- **Connection status** - Shows connection status (connected/offline)
- **Unread message counter** - Red badge shows unread messages count in navbar
- **Message status indicators** - See if messages are sent, delivered, or read
- **Message persistence** - All messages are stored in database
- **Message history** - Previous messages are loaded when joining chat
- **Read receipts** - Know when your messages have been read by others

## Location
The chat icon is located in the top navigation bar, next to the AI Assistant icon.

## Usage

### Starting the Chat Server
```bash
npm run chat:server
```
This starts a WebSocket server on port 3001.

### Accessing the Chat
1. Click the chat bubble icon in the top navigation bar
2. The chat drawer will slide in from the right showing online users and messages
3. Type your message and press Enter to send
4. Click on users in the top panel to start private conversations

### Desktop Layout (Drawer)
- Top panel: Compact online users list (horizontally scrollable)
- Main area: Chat messages and input area
- Click users to switch between general chat and private messages
- Drawer slides in from the right side of the screen

### Mobile Layout
- Users list view by default
- Click a user to enter chat view
- Back button to return to users list

## Technical Details

### Components
- `src/components/Chat/index.vue` - Main chat component with message status indicators
- `src/components/Chat/index.ts` - Component export
- `server/websocket-chat.js` - WebSocket server with database integration
- `server/chat_messages.json` - File-based message database

### Integration
- Added to `src/layout/components/ToolHeader.vue` next to AI Assistant
- Unread message badge integrated in navbar
- Uses the same styling patterns as existing components
- Integrated with user authentication system

### WebSocket Events
- `join` - User joins the chat
- `message` - Send/receive messages
- `message_delivered` - Message delivery confirmation
- `message_read` - Message read receipt
- `message_history` - Load previous messages on connect
- `typing` - Typing indicators (future enhancement)
- `user_joined`/`user_left` - User presence updates
- `users_update` - Online users list updates

### Message Status System
- **Sending** ⏰ - Message is being sent
- **Sent** ✓ - Message sent to server  
- **Delivered** ✓✓ (gray) - Message delivered to recipient(s)
- **Read** ✓✓ (blue) - Message read by recipient(s)
- **Failed** ❌ - Message failed to send

### Database Storage
Messages are stored in a JSON file (`server/chat_messages.json`) with the following structure:
```json
{
  "id": "unique_message_id",
  "content": "message text",
  "sender": { "id": "user_id", "name": "User Name" },
  "timestamp": "2024-01-01T12:00:00.000Z",
  "status": "read",
  "readBy": ["user_id1", "user_id2"],
  "createdAt": "2024-01-01T12:00:00.000Z",
  "updatedAt": "2024-01-01T12:00:05.000Z"
}
```

### Fallback Mode
If WebSocket server is not running, the chat component will:
- Show simulated online users for demo purposes
- Still allow message composition (local only)
- Display offline status indicator

## Configuration
The WebSocket server URL can be modified in the Chat component:
```javascript
const wsUrl = `ws://localhost:3001/chat`
```

For production, update this to your production WebSocket server URL.

## Dependencies Added
- `ws@^8.18.0` - WebSocket library for the server

## Future Enhancements
- Message persistence (database storage)
- File sharing capabilities
- Emoji support
- Message search
- Typing indicators
- Message reactions
- Group chat rooms
- Push notifications
- Message encryption
