# 🗨️ Sahab (سحــاب)

Welcome to the **Sahab** project! This application is designed to deliver seamless and real-time communication. Below is a detailed breakdown of the database schema, entities, and features. The project uses **MongoDB** as its database, ensuring reliability and scalability.


[!Logo](../Reat-Time-Chat-App_assests/enLOGO.svg)
---
 
## 🗂️ Collections and Entities

### 1. **Users Collection**

Represents the users of the Chatters app, storing essential details and privacy preferences.

```javascript
{
  _id: ObjectId,
  phoneNumber: { type: String, unique: true, required: true },
  username: String, // Optional username
  profilePic: String, // URL of the profile picture
  status: String, // Custom status message
  lastSeen: Date, // Timestamp of the last online activity
  createdAt: Date, // Account creation date
  updatedAt: Date, // Last update to the user document
  privacySettings: {
    lastSeenVisibility: String, // 'everyone', 'contacts', 'nobody'
    profilePhotoVisibility: String // Privacy settings for profile photo
  }
}
```

### 2. **Conversations Collection**

Captures chat sessions, including private chats, group conversations, and broadcast channels.

```javascript
{
  _id: ObjectId,
  type: { type: String, enum: ['private', 'group', 'channel'], required: true },
  name: String, // Name of the group or channel
  description: String, // Optional description for groups/channels
  creator: { type: ObjectId, ref: 'users' }, // User who created the conversation
  isBroadcast: Boolean, // True for broadcast channels
  avatar: String, // URL for the conversation's avatar
  createdAt: Date, // Creation timestamp
  updatedAt: Date, // Last update timestamp
  lastMessage: { type: ObjectId, ref: 'messages' }, // Reference to the last message
  participantCount: Number // Cached participant count
}
```

### 3. **Participants Collection**

Tracks the relationship between users and conversations, including roles and notifications.

```javascript
{
  _id: ObjectId,
  conversation: { type: ObjectId, ref: 'conversations', required: true },
  user: { type: ObjectId, ref: 'users', required: true },
  role: { type: String, enum: ['member', 'admin', 'owner'], default: 'member' },
  joinedAt: { type: Date, default: Date.now },
  mutedUntil: Date, // Muted notifications until a specific date
  lastReadMessage: { type: ObjectId, ref: 'messages' }, // Last read message reference
  customNotifications: {
    mute: Boolean, // Mute notifications for the conversation
    customSound: String // Custom notification sound
  }
}
```

### 4. **Messages Collection**

Holds all messages sent within conversations, supporting text, media, and reactions.

```javascript
{
  _id: ObjectId,
  conversation: { type: ObjectId, ref: 'conversations', required: true },
  sender: { type: ObjectId, ref: 'users', required: true },
  content: {
    text: String, // Message text content
    media: [{
      url: String, // Media file URL
      type: String, // 'image', 'video', 'document'
      caption: String // Optional media caption
    }]
  },
  type: { type: String, enum: ['text', 'media', 'system'], required: true },
  timestamp: { type: Date, default: Date.now },
  status: { type: String, enum: ['sent', 'delivered', 'read'] },
  deleted: { type: Boolean, default: false },
  editedAt: Date, // Timestamp for message edits
  parentMessage: { type: ObjectId, ref: 'messages' }, // For replies/threads
  reactions: [{
    user: { type: ObjectId, ref: 'users' },
    emoji: String // Emoji reaction
  }],
  metadata: {
    forwarded: Boolean, // Whether the message was forwarded
    forwardedFrom: ObjectId // Original sender reference
  }
}
```

### 5. **Group Metadata Collection (Optional)**

Stores additional data specific to group conversations.

```javascript
{
  _id: ObjectId,
  conversation: { type: ObjectId, ref: 'conversations', unique: true },
  joinSettings: { type: String, enum: ['open', 'approval'] },
  announcement: String, // Pinned group announcement
  bannedUsers: [{ type: ObjectId, ref: 'users' }], // List of banned users
  adminOnlyPosts: Boolean // Restrict posting to admins
}
```

### 6. **Channel Metadata Collection (Optional)**

Provides metadata for channels, including analytics and broadcast history.

```javascript
{
  _id: ObjectId,
  conversation: { type: ObjectId, ref: 'conversations', unique: true },
  verified: Boolean, // Indicates if the channel is verified
  subscriberCount: Number, // Cached subscriber count
  broadcastHistory: [{ type: ObjectId, ref: 'messages' }], // List of broadcast messages
  analytics: {
    views: Number, // Total views
    shares: Number // Total shares
  }
}
```

---

## 🚀 Features

- **Real-Time Messaging**: Instant message delivery with status updates.
- **Group and Channel Support**: Seamless group chats and broadcast channels.
- **Media Sharing**: Share images, videos, and documents effortlessly.
- **Custom Notifications**: Tailor notifications per conversation.
- **Privacy Controls**: Advanced privacy settings for last seen and profile photo.
- **Reactions & Replies**: Engage with message reactions and threaded replies.

---
