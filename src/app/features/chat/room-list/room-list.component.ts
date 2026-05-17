// import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
// import { CommonModule } from '@angular/common';
// import { FormsModule } from '@angular/forms';
// import { AuthStore } from '../../../shared/stores/auth.store';
// import { RoomStore, RoomTab } from '../../../shared/stores/room.store';
// import { RoomService } from '../../../core/api/room.service';
// import { RoomItemComponent } from '../room-item/room-item.component';
// import { Room } from '../../../shared/models/room.model';

// @Component({
//     selector: 'app-room-list',
//     standalone: true,
//     imports: [CommonModule, FormsModule, RoomItemComponent],
//     templateUrl: './room-list.component.html',
//     host: { class: 'flex flex-col flex-1 min-h-0 overflow-hidden' }
// })
// export class RoomListComponent implements OnInit {
//     loading = true;
//     tabs: RoomTab[] = ['all', 'group', 'private'];

//     constructor(
//         public roomStore: RoomStore,
//         private authStore: AuthStore,
//         private roomService: RoomService,
//         private cdr: ChangeDetectorRef
//     ) { }

//     ngOnInit() {
//         const userId = this.authStore.currentUser()?.userId;
//         if (!userId) { this.loading = false; return; }

//         this.roomService.getUserRooms(userId).subscribe({
//             next: (raw: any[]) => {
//                 console.log('DM room raw:', raw.filter((r: any) => r.type === 'DM'));

//                 const rooms: Room[] = raw.map(r => ({
//                     roomId: String(r.roomId ?? r.id),
//                     name: r.type === 'DM'
//                         ? (r.partnerUsername ?? r.otherUsername ?? r.targetUsername ?? r.name ?? 'Direct Message')
//                         : (r.name ?? 'Room'),
//                     type: r.type ?? 'GROUP',
//                     description: r.description ?? '',
//                     avatarUrl: r.avatarUrl ?? null,
//                     dmPartnerId: r.type === 'DM'
//                         ? String(r.partnerId ?? r.otherUserId ?? r.targetUserId ?? '')
//                         : undefined,
//                     lastMessage: r.lastMessage ?? null,
//                     lastMessageTime: r.lastMessageTime ?? null,
//                     unreadCount: r.unreadCount ?? 0
//                 }));

//                 this.roomStore.setRooms(rooms);
//                 this.loading = false;
//                 this.cdr.detectChanges();
//             },
//             error: () => {
//                 this.loading = false;
//                 this.cdr.detectChanges();
//             }
//         });
//     }
//     setTab(tab: RoomTab) {
//         this.roomStore.setActiveTab(tab);
//     }

//     onSearch(query: string) {
//         this.roomStore.setSearchQuery(query);
//     }
//     trackByRoomId(_: number, room: Room) { return room.roomId; }
// }

import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthStore } from '../../../shared/stores/auth.store';
import { RoomStore, RoomTab } from '../../../shared/stores/room.store';
import { RoomService } from '../../../core/api/room.service';
import { RoomItemComponent } from '../room-item/room-item.component';
import { Room } from '../../../shared/models/room.model';
import { forkJoin, of } from 'rxjs';

@Component({
    selector: 'app-room-list',
    standalone: true,
    imports: [CommonModule, FormsModule, RoomItemComponent],
    templateUrl: './room-list.component.html',
    host: { class: 'flex flex-col flex-1 min-h-0 overflow-hidden' }
})
export class RoomListComponent implements OnInit {
    loading = true;
    tabs: RoomTab[] = ['all', 'group', 'private'];

    constructor(
        public roomStore: RoomStore,
        private authStore: AuthStore,
        private roomService: RoomService,
        private cdr: ChangeDetectorRef
    ) { }

    ngOnInit() {
        const userId = this.authStore.currentUser()?.userId;
        if (!userId) { this.loading = false; return; }

        this.roomService.getUserRooms(userId).subscribe({
            next: (raw: any[]) => {
                const rooms: Room[] = raw.map(r => ({
                    roomId: String(r.roomId ?? r.id),
                    name: r.type === 'DM'
                        ? (r.partnerUsername ?? r.otherUsername ?? r.targetUsername ?? r.name ?? 'Direct Message')
                        : (r.name ?? 'Room'),
                    type: r.type ?? 'GROUP',
                    description: r.description ?? '',
                    avatarUrl: r.avatarUrl ?? null,
                    dmPartnerId: r.type === 'DM'
                        ? String(r.partnerId ?? r.otherUserId ?? r.targetUserId ?? '')
                        : undefined,
                    lastMessage: r.lastMessage ?? null,
                    lastMessageTime: r.lastMessageTime ?? null,
                    unreadCount: r.unreadCount ?? 0
                }));

                // Set rooms immediately so UI shows something
                this.roomStore.setRooms(rooms);
                this.loading = false;
                this.cdr.detectChanges();

                // ✅ For every DM still named 'Direct Message', fetch members and resolve name
                const dmRooms = rooms.filter(r => r.type === 'DM' && r.name === 'Direct Message');
                dmRooms.forEach(dm => {
                    this.roomService.getMembers(dm.roomId).subscribe({
                        next: (members) => {
                            const partner = members.find(m => String(m.userId) !== String(userId));
                            if (partner?.username) {
                                this.roomStore.updateRoom(dm.roomId, {
                                    name: partner.username,
                                    dmPartnerId: String(partner.userId)
                                });
                                this.cdr.detectChanges();
                            }
                        }
                    });
                });
            },
            error: () => {
                this.loading = false;
                this.cdr.detectChanges();
            }
        });
    }

    setTab(tab: RoomTab) { this.roomStore.setActiveTab(tab); }
    onSearch(query: string) { this.roomStore.setSearchQuery(query); }
    trackByRoomId(_: number, room: Room) { return room.roomId; }
}