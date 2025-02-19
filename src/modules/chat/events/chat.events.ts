export enum ChatEvents {
    CONNECT = 'connect',
    DISCONNECT = 'disconnect',
    CREATE_CONVERSATION= 'createconversation',
    JOIN_CHAT = 'joinChat',
    LEAVE_CHAT = 'leaveChat',
    SEND_MESSAGE = 'sendMessage',
    RECEIVE_MESSAGE = 'receiveMessage',
    USER_TYPING = 'userTyping',
    USER_STOP_TYPING = 'userStopTyping',
    MESSAGE_DELIVERED = 'messageDelivered',
    MESSAGE_READ = 'messageRead',
    ERROR = 'error',
    CONVERSATION_CREATED = 'CONVERSATION_CREATED',
    NEW_CONVERSATION = 'NEW_CONVERSATION',
    CONVERSATION_EXISTS= 'CONVERSATION_EXISTS'
}