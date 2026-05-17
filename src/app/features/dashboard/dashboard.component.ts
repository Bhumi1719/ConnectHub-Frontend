// import { ChangeDetectorRef, Component, OnInit, signal } from '@angular/core';
// import { Router } from '@angular/router';
// import { CommonModule } from '@angular/common';
// import { FormsModule } from '@angular/forms';
// import { AuthStore } from '../../shared/stores/auth.store';
// import { RoomStore } from '../../shared/stores/room.store';
// import { RoomService } from '../../core/api/room.service';
// import { AuthService } from '../../core/api/auth.service';
// import { RoomDirectoryEntry } from '../../shared/models/room.model';
// import { User } from '../../shared/models/user.model';

// @Component({
//   selector: 'app-dashboard',
//   standalone: true,
//   imports: [CommonModule, FormsModule],
//   templateUrl: './dashboard.component.html'
// })
// export class Dashboard implements OnInit {

//   // Create Room
//   roomName = '';
//   roomDescription = '';
//   creating = false;
//   createError = '';

//   // Join Room
//   rooms: RoomDirectoryEntry[] = [];
//   roomsLoading = true;
//   pendingRooms = new Set<string>();

//   users: User[] = [];
//   usersLoading = true;
//   dmLoading = new Set<string>();

//   constructor(
//     public authStore: AuthStore,
//     private roomStore: RoomStore,
//     private roomService: RoomService,
//     private authService: AuthService,
//     private router: Router,
//     private cdr: ChangeDetectorRef
//   ) { }

//   ngOnInit() {
//     const userId = this.authStore.currentUser()?.userId;
//     if (!userId) return;

//     // Load rooms
//     this.roomService.getRoomDirectory(userId).subscribe({
//       next: (rooms: any[]) => {
//         this.rooms = rooms.map(r => ({
//           roomId: String(r.id ?? r.roomId),
//           name: r.name,
//           description: r.description ?? '',
//           type: 'GROUP' as const,
//           memberCount: r.membersCount ?? r.memberCount ?? 0,
//           createdById: String(r.createdBy ?? r.createdById),
//           isMember: r.isJoined ?? r.isMember ?? false,
//           hasPendingRequest: r.joinStatus === 'PENDING'
//         }));
//         this.roomsLoading = false;
//         this.cdr.detectChanges();   // ✅ force update
//       },
//       error: () => {
//         this.roomsLoading = false;
//         this.cdr.detectChanges();
//       }
//     });

//     this.authService.getAllUsers().subscribe({
//       next: (users) => {
//         this.users = users.filter(u => String(u.userId) !== String(userId));
//         this.usersLoading = false;
//         this.cdr.detectChanges();   // ✅ force update
//       },
//       error: () => {
//         this.usersLoading = false;
//         this.cdr.detectChanges();
//       }
//     });
//   }

//   createRoom() {
//     if (!this.roomName.trim()) return;
//     this.creating = true;
//     this.createError = '';

//     const userId = this.authStore.currentUser()!.userId;

//     this.roomService.createRoom({
//       name: this.roomName.trim(),
//       description: this.roomDescription.trim(),
//       type: 'GROUP',
//       isPrivate: false,
//       createdBy: userId
//     }).subscribe({
//       next: (res) => {
//         const roomId = String(res.id ?? res.roomId);
//         this.roomStore.addRoom({ roomId, name: res.name, type: 'GROUP' });
//         this.roomStore.setActiveRoom(roomId, 'group');
//         this.router.navigate(['/chat/room', roomId]);  // ✅
//       },
//       error: (err) => {
//         this.createError = err.error?.message || 'Failed to create room.';
//         this.creating = false;
//       }
//     });
//   }

//   // enterRoom(room: RoomDirectoryEntry) {
//   //   this.roomStore.addRoom({ roomId: room.roomId, name: room.name, type: 'GROUP' });
//   //   this.roomStore.setActiveRoom(room.roomId, 'group');
//   //   this.router.navigate(['/chat/room', room.roomId]);  // ✅ navigate directly to room
//   // }

//   enterRoom(room: any) {
//     console.log('enterRoom called', room.roomId);
//     const roomId = String(room.roomId);
//     this.roomStore.addRoom({ roomId, name: room.name, type: 'GROUP' as const });
//     this.roomStore.setActiveRoom(roomId, 'group');
//     this.router.navigate(['/chat/room', roomId]);
//   }
//   sendJoinRequest(room: RoomDirectoryEntry) {
//     const userId = this.authStore.currentUser()!.userId;
//     this.pendingRooms.add(room.roomId);

//     this.roomService.sendJoinRequest(room.roomId, userId).subscribe({
//       next: () => {
//         this.rooms = this.rooms.map(r =>
//           r.roomId === room.roomId ? { ...r, hasPendingRequest: true } : r
//         );
//         this.cdr.detectChanges();  // ✅
//       },
//       error: () => {
//         this.pendingRooms.delete(room.roomId);
//       }
//     });
//   }

//   openDM(user: User) {
//     if (this.dmLoading.has(user.userId)) return;
//     this.dmLoading.add(user.userId);

//     const currentUserId = this.authStore.currentUser()!.userId;

//     this.roomService.createRoom({
//       type: 'DM',
//       createdBy: currentUserId,
//       targetUserId: user.userId
//     }).subscribe({
//       next: (res) => {
//         const roomId = String(res.id ?? res.roomId);
//         this.roomStore.addRoom({ roomId, name: user.username, type: 'DM' });
//         this.roomStore.setActiveRoom(roomId, 'private');
//         this.router.navigate(['/chat/room', roomId]);  // ✅
//       },
//       error: () => {
//         this.dmLoading.delete(user.userId);
//       }
//     });
//   }

//   getInitial(name: any) {
//     return String(name ?? '').charAt(0).toUpperCase() || '?';
//   }

//   logout() {
//     this.authStore.logout();
//     this.router.navigate(['/login']);
//   }
// }


import { ChangeDetectorRef, Component, OnInit, signal } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthStore } from '../../shared/stores/auth.store';
import { RoomStore } from '../../shared/stores/room.store';
import { RoomService } from '../../core/api/room.service';
import { AuthService } from '../../core/api/auth.service';
import { RoomDirectoryEntry } from '../../shared/models/room.model';
import { User } from '../../shared/models/user.model';

type ModalType = 'create' | 'join' | 'dm' | null;

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.css'
})
export class Dashboard implements OnInit {

  // Modal state
  activeModal: ModalType = null;

  // Create Room
  roomName = '';
  roomDescription = '';
  creating = false;
  createError = '';

  // Join Room
  rooms: RoomDirectoryEntry[] = [];
  roomsLoading = true;
  pendingRooms = new Set<string>();

  users: User[] = [];
  usersLoading = true;
  dmLoading = new Set<string>();

  constructor(
    public authStore: AuthStore,
    private roomStore: RoomStore,
    private roomService: RoomService,
    private authService: AuthService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit() {
    const userId = this.authStore.currentUser()?.userId;
    if (!userId) return;

    // Load rooms
    this.roomService.getRoomDirectory(userId).subscribe({
      next: (rooms: any[]) => {
        this.rooms = rooms.map(r => ({
          roomId: String(r.id ?? r.roomId),
          name: r.name,
          description: r.description ?? '',
          type: 'GROUP' as const,
          memberCount: r.membersCount ?? r.memberCount ?? 0,
          createdById: String(r.createdBy ?? r.createdById),
          isMember: r.isJoined ?? r.isMember ?? false,
          hasPendingRequest: r.joinStatus === 'PENDING'
        }));
        this.roomsLoading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.roomsLoading = false;
        this.cdr.detectChanges();
      }
    });

    this.authService.getAllUsers().subscribe({
      next: (users) => {
        this.users = users.filter(u => String(u.userId) !== String(userId));
        this.usersLoading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.usersLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  // ── Modal helpers ─────────────────────────────────────────
  openModal(type: ModalType) {
    this.activeModal = type;
    // Reset create form when opening
    if (type === 'create') {
      this.roomName = '';
      this.roomDescription = '';
      this.createError = '';
    }
  }

  closeModal() {
    this.activeModal = null;
  }

  onBackdropClick(event: MouseEvent) {
    // Only close if clicking directly on the backdrop, not the modal panel
    if ((event.target as HTMLElement).classList.contains('ch-backdrop')) {
      this.closeModal();
    }
  }

  // ── Room actions ──────────────────────────────────────────
  createRoom() {
    if (!this.roomName.trim()) return;
    this.creating = true;
    this.createError = '';

    const userId = this.authStore.currentUser()!.userId;

    this.roomService.createRoom({
      name: this.roomName.trim(),
      description: this.roomDescription.trim(),
      type: 'GROUP',
      isPrivate: false,
      createdBy: userId
    }).subscribe({
      next: (res) => {
        const roomId = String(res.id ?? res.roomId);
        this.roomStore.addRoom({ roomId, name: res.name, type: 'GROUP' });
        this.roomStore.setActiveRoom(roomId, 'group');
        this.router.navigate(['/chat/room', roomId]);
      },
      error: (err) => {
        this.createError = err.error?.message || 'Failed to create room.';
        this.creating = false;
      }
    });
  }

  enterRoom(room: any) {
    const roomId = String(room.roomId);
    this.roomStore.addRoom({ roomId, name: room.name, type: 'GROUP' as const });
    this.roomStore.setActiveRoom(roomId, 'group');
    this.router.navigate(['/chat/room', roomId]);
  }

  sendJoinRequest(room: RoomDirectoryEntry) {
    const userId = this.authStore.currentUser()!.userId;
    this.pendingRooms.add(room.roomId);

    this.roomService.sendJoinRequest(room.roomId, userId).subscribe({
      next: () => {
        this.rooms = this.rooms.map(r =>
          r.roomId === room.roomId ? { ...r, hasPendingRequest: true } : r
        );
        this.cdr.detectChanges();
      },
      error: () => {
        this.pendingRooms.delete(room.roomId);
      }
    });
  }

  openDM(user: User) {
    if (this.dmLoading.has(user.userId)) return;
    this.dmLoading.add(user.userId);

    const currentUserId = this.authStore.currentUser()!.userId;

    this.roomService.createRoom({
      type: 'DM',
      createdBy: currentUserId,
      targetUserId: user.userId
    }).subscribe({
      next: (res) => {
        const roomId = String(res.id ?? res.roomId);
        this.roomStore.addRoom({ roomId, name: user.username, type: 'DM' });
        this.roomStore.setActiveRoom(roomId, 'private');
        this.router.navigate(['/chat/room', roomId]);
      },
      error: () => {
        this.dmLoading.delete(user.userId);
      }
    });
  }

  getInitial(name: any) {
    return String(name ?? '').charAt(0).toUpperCase() || '?';
  }

  logout() {
    this.authStore.logout();
    this.router.navigate(['/login']);
  }
}