export interface Message {
    messageId: string;
    roomId: string;
    senderId: string;
    senderUsername: string;
    senderAvatarUrl?: string;
    content: string;
    type: 'TEXT' | 'IMAGE' | 'FILE';
    status: 'SENT' | 'DELIVERED' | 'READ';
    isDeleted: boolean;
    isEdited: boolean;
    createdAt: string;
    updatedAt?: string;
    mediaUrl?: string; 
    mimeType?: string;
    sizeKb?: number;
    reactions?: { emoji: string; count: number; userIds: string[] }[];
}

export interface RoomMember {
    userId: string;
    username: string;
    email: string;
    avatarUrl?: string;
    role: 'ADMIN' | 'MEMBER';
    isMuted: boolean;
    isOnline?: boolean;
}