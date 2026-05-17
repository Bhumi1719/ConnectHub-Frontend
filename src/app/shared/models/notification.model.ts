// export interface Notification {
//     notificationId: string;
//     recipientId: string;
//     type: string;
//     title: string;
//     message: string;
//     roomId?: string;
//     isRead: boolean;
//     createdAt: string;
// }

export interface Notification {
    notificationId: string;
    type: 'MESSAGE' | 'JOIN_REQUEST' | 'ROOM_INVITE' | 'MENTION' | 'SYSTEM';
    title: string;
    message: string;
    roomId?: string;
    isRead: boolean;
    createdAt: string;
    recipientId?: string;
}

export interface Presence {
    userId: string;
    status: 'ONLINE' | 'AWAY' | 'DND' | 'OFFLINE' | 'INVISIBLE';
    lastPingAt?: string;
}