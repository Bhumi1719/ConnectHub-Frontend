import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-typing-indicator',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './typing-indicator.component.html'
})
export class TypingIndicatorComponent {
    @Input() typingUsers: string[] = [];

    get label(): string {
        const u = this.typingUsers;
        if (u.length === 0) return '';
        if (u.length === 1) return `${u[0]} is typing`;
        if (u.length === 2) return `${u[0]} and ${u[1]} are typing`;
        return `${u[0]}, ${u[1]} and ${u.length - 2} more are typing`;
    }
}