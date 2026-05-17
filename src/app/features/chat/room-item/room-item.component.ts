import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Room } from '../../../shared/models/room.model';
import { RoomStore } from '../../../shared/stores/room.store';
import { PresenceService } from '../../../core/services/presence.service';

@Component({
    selector: 'app-room-item',
    standalone: true,
    imports: [CommonModule, RouterModule],
    templateUrl: './room-item.component.html'
})
export class RoomItemComponent {
    @Input() room!: Room;

    constructor(public roomStore: RoomStore,
        public presenceService: PresenceService
    ) { }

    get isActive() {
        return this.roomStore.activeRoomId() === this.room.roomId;
    }

    // ✅ ADD THESE TWO
    get roomName() {
        const live = this.roomStore.rooms().find(r => r.roomId === this.room.roomId);
        return live?.name ?? this.room.name;
    }

    get dmPartnerId() {
        const live = this.roomStore.rooms().find(r => r.roomId === this.room.roomId);
        return live?.dmPartnerId ?? this.room.dmPartnerId;
    }

    getInitial(name: any) {
        return String(name ?? '').charAt(0).toUpperCase() || '?';
    }

    getTabForRoom(): 'group' | 'private' {
        return this.room.type === 'GROUP' ? 'group' : 'private';
    }

    select() {
        this.roomStore.setActiveRoom(this.room.roomId, this.getTabForRoom());
    }
}