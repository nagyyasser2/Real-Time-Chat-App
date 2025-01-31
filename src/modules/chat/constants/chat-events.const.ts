export const CHAT_EVENTS = {
  // Connection & Session Management
  CONNECTION: 'connection',
  DISCONNECT: 'disconnect',
  RECONNECT_ATTEMPT: 'reconnect-attempt',
  SESSION_EXPIRED: 'session-expired',
  ERROR: 'error',

  // Messaging Core
  MESSAGE: 'message',
  MESSAGE_HISTORY: 'message-history',
  MESSAGE_EDIT: 'message-edit',
  MESSAGE_DELETE_FOR_ME: 'message-delete-for-me',
  MESSAGE_DELETE_FOR_ALL: 'message-delete-for-all',
  MESSAGE_REACTION_ADD: 'message-reaction-add',
  MESSAGE_REACTION_REMOVE: 'message-reaction-remove',
  MESSAGE_DELIVERED: 'message-delivered',
  MESSAGE_READ: 'message-read',
  MESSAGE_FAILED: 'message-failed',
  MESSAGE_PINNED: 'message-pinned',
  MESSAGE_UNPINNED: 'message-unpinned',

  // Typing Indicators
  TYPING_START: 'typing-start',
  TYPING_STOP: 'typing-stop',
  USER_TYPING: 'user-typing',
  USER_STOPPED_TYPING: 'user-stopped-typing',

  // Presence & Status
  USER_ONLINE: 'user-online',
  USER_OFFLINE: 'user-offline',
  USER_AWAY: 'user-away',
  USER_LAST_SEEN: 'user-last-seen',
  STATUS_UPDATE: 'status-update',
  STATUS_VIEWED: 'status-viewed',
  STATUS_REPLIED: 'status-replied',

  // Room Management
  JOIN_ROOM: 'join-room',
  LEAVE_ROOM: 'leave-room',
  ROOM_ARCHIVED: 'room-archived',
  ROOM_MUTED: 'room-muted',
  ROOM_UNMUTED: 'room-unmuted',
  USER_JOINED: 'user-joined',
  USER_LEFT: 'user-left',

  // User Management
  AUTH_SUCCESS: 'auth-success',
  AUTH_FAILURE: 'auth-failure',
  USER_PROFILE_UPDATED: 'user-profile-updated',
  USER_STATUS_UPDATE: 'user-status-update',
  USER_BLOCKED: 'user-blocked',
  USER_UNBLOCKED: 'user-unblocked',
  USER_REPORTED: 'user-reported',

  // Group Management
  GROUP_CREATED: 'group-created',
  GROUP_UPDATED: 'group-updated',
  GROUP_MEMBER_ADDED: 'group-member-added',
  GROUP_MEMBER_REMOVED: 'group-member-removed',
  GROUP_ADMIN_ADDED: 'group-admin-added',
  GROUP_ADMIN_REMOVED: 'group-admin-removed',
  GROUP_LEFT: 'group-left',
  GROUP_DELETED: 'group-deleted',
  GROUP_INVITE_SENT: 'group-invite-sent',
  GROUP_SETTINGS_CHANGED: 'group-settings-changed',

  // Calls & Meetings
  CALL_START: 'call-start',
  CALL_ACCEPT: 'call-accept',
  CALL_REJECT: 'call-reject',
  CALL_END: 'call-end',
  CALL_MISSED: 'call-missed',
  CALL_BUSY: 'call-busy',
  CALL_FAILED: 'call-failed',
  CALL_RINGING: 'call-ringing',
  CALL_MUTE_TOGGLE: 'call-mute-toggle',
  CALL_VIDEO_TOGGLE: 'call-video-toggle',
  CALL_HOLD: 'call-hold',
  CALL_PARTICIPANT_JOINED: 'call-participant-joined',
  CALL_PARTICIPANT_LEFT: 'call-participant-left',

  // Media Management
  FILE_UPLOAD_START: 'file-upload-start',
  FILE_UPLOAD_PROGRESS: 'file-upload-progress',
  FILE_UPLOAD_COMPLETE: 'file-upload-complete',
  FILE_UPLOAD_FAILED: 'file-upload-failed',
  MEDIA_PLAYED: 'media-played',
  VOICE_MESSAGE_RECORDING: 'voice-message-recording',
  MEDIA_DOWNLOAD_START: 'media-download-start',
  MEDIA_DOWNLOAD_COMPLETE: 'media-download-complete',

  // Notifications
  NEW_NOTIFICATION: 'new-notification',
  NOTIFICATION_READ: 'notification-read',
  NOTIFICATION_DISMISSED: 'notification-dismissed',
  REMINDER_SET: 'reminder-set',
  REMINDER_TRIGGERED: 'reminder-triggered',

  // Location Sharing
  LOCATION_SHARED: 'location-shared',
  LIVE_LOCATION_START: 'live-location-start',
  LIVE_LOCATION_UPDATE: 'live-location-update',
  LIVE_LOCATION_END: 'live-location-end',

  // Security & Privacy
  ENCRYPTION_HANDSHAKE: 'encryption-handshake',
  SECURITY_CODE_CHANGED: 'security-code-changed',
  PRIVACY_SETTINGS_CHANGED: 'privacy-settings-changed',
  TWO_FACTOR_ENABLED: 'two-factor-enabled',
  SESSION_REVOKED: 'session-revoked',

  // System & Performance
  RATE_LIMIT_EXCEEDED: 'rate-limit-exceeded',
  STORAGE_LOW: 'storage-low',
  NETWORK_STATUS_CHANGED: 'network-status-changed',
  BATTERY_LOW: 'battery-low',

  // Business Features
  QUICK_REPLY_CREATED: 'quick-reply-created',
  AUTOMATION_TRIGGERED: 'automation-triggered',
  CHAT_TRANSFER: 'chat-transfer',
  CART_UPDATED: 'cart-updated',

  // Social Features
  POLL_CREATED: 'poll-created',
  POLL_VOTE: 'poll-vote',
  CONTACT_SHARED: 'contact-shared',
  PAYMENT_REQUEST: 'payment-request',
  PAYMENT_COMPLETED: 'payment-completed',
};
