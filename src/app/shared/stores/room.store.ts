import { Injectable, signal, computed } from '@angular/core';
import { Room } from '../models/room.model';

export type RoomTab = 'all' | 'private' | 'group';

@Injectable({ providedIn: 'root' })
export class RoomStore {
    rooms = signal<Room[]>([]);
    activeRoomId = signal<string | null>(null);
    activeTab = signal<RoomTab>('all');
    searchQuery = signal<string>('');

    filteredRooms = computed(() => {
        const tab = this.activeTab();
        const query = this.searchQuery().toLowerCase().trim();
        const allRooms = this.rooms();

        return allRooms.filter(room => {
            const matchesTab =
                tab === 'all' ||
                (tab === 'group' && room.type === 'GROUP') ||
                (tab === 'private' && room.type === 'DM');

            const matchesSearch =
                !query || room.name.toLowerCase().includes(query);

            return matchesTab && matchesSearch;
        });
    });

    activeRoom = computed(() =>
        this.rooms().find(r => r.roomId === this.activeRoomId()) ?? null
    );

    setRooms(rooms: Room[]) {
        this.rooms.set(rooms);
    }

    addRoom(room: Room) {
        this.rooms.update(existing => {
            const found = existing.find(r => r.roomId === room.roomId);
            if (found) return existing;
            return [...existing, room];
        });
    }

    setActiveRoom(roomId: string, tab?: RoomTab) {
        this.activeRoomId.set(roomId);
        if (tab) this.activeTab.set(tab);
    }

    setActiveTab(tab: RoomTab) {
        this.activeTab.set(tab);
    }

    setSearchQuery(q: string) {
        this.searchQuery.set(q);
    }

    updateRoom(roomId: string, changes: Partial<Room>) {
        this.rooms.update(existing =>
            existing.map(r => r.roomId === roomId ? { ...r, ...changes } : r)
        );
    }

    removeRoom(roomId: string) {
        this.rooms.update(existing => existing.filter(r => r.roomId !== roomId));
        if (this.activeRoomId() === roomId) {
            this.activeRoomId.set(null);
        }
    }

    clear() {
        this.rooms.set([]);
        this.activeRoomId.set(null);
        this.activeTab.set('all');
        this.searchQuery.set('');
    }
}