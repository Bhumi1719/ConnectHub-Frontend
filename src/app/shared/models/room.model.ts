export interface RoomDirectoryEntry {
    roomId: string;
    name: string;
    description: string;
    type: 'GROUP' | 'DM';
    memberCount: number;
    createdById: string;
    isMember: boolean;
    hasPendingRequest: boolean;
}

export interface Room {
    roomId: string;
    name: string;
    type: 'GROUP' | 'DM';
    description?: string;
    dmPartnerId?: string; 
    maxMembers?: number;
    lastMessage?: string;
    lastMessageTime?: string;
    unreadCount?: number;
    avatarUrl?: string;
}

export interface RoomJoinRequest {
    requestId: string;
    roomId: string;
    userId: string;
    username: string;
    avatarUrl?: string;
    requestedAt: string;
    status: 'PENDING' | 'APPROVED' | 'REJECTED';
}