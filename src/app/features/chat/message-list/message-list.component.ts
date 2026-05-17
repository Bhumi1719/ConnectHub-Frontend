import {
    Component, Input, Output, EventEmitter,
    ViewChild, ElementRef, AfterViewInit, OnChanges, SimpleChanges, OnDestroy
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Message } from '../../../shared/models/message.model';
import { MessageBubbleComponent } from '../message-bubble/message-bubble.component';

@Component({
    selector: 'app-message-list',
    standalone: true,
    imports: [CommonModule, MessageBubbleComponent],
    templateUrl: './message-list.component.html',
    host: {
        class: 'flex flex-col overflow-hidden',
        style: 'flex: 1; min-height: 0;'
    }
})
export class MessageListComponent implements AfterViewInit, OnChanges, OnDestroy {
    @Input() messages: Message[] = [];
    @Input() currentUserId = '';
    @Input() isAdmin = false;
    @Input() isDm = false;   // NEW
    @Input() hasMore = true;
    @Input() loading = false;

    @Output() loadMore = new EventEmitter<void>();
    @Output() deleteMessage = new EventEmitter<string>();
    @Output() editMessage = new EventEmitter<{ messageId: string; content: string }>();

    @ViewChild('scrollContainer') scrollContainer!: ElementRef<HTMLDivElement>;
    @ViewChild('topSentinel') topSentinel!: ElementRef<HTMLDivElement>;

    private intersectionObserver!: IntersectionObserver;
    private mutationObserver!: MutationObserver;
    private prevScrollHeight = 0;
    private pendingScrollToBottom = false;

    ngAfterViewInit() {
        this.setupIntersectionObserver();
        this.setupMutationObserver();
    }

    ngOnDestroy() {
        this.intersectionObserver?.disconnect();
        this.mutationObserver?.disconnect();
    }

    ngOnChanges(changes: SimpleChanges) {
        if (changes['messages']) {
            const prev = changes['messages'].previousValue as Message[] | undefined;
            const curr = changes['messages'].currentValue as Message[];

            if (!curr || curr.length === 0) return;

            const isPrepend =
                prev && prev.length > 0 &&
                curr.length > prev.length &&
                curr[0]?.messageId !== prev[0]?.messageId;

            if (isPrepend) {
                setTimeout(() => {
                    const el = this.scrollContainer?.nativeElement;
                    if (el) el.scrollTop = el.scrollHeight - this.prevScrollHeight;
                }, 50);
            } else {
                this.pendingScrollToBottom = true;
                this.scrollToBottomAfterRender();
            }
        }
    }

    private scrollToBottomAfterRender() {
        setTimeout(() => {
            this.scrollToBottom();
            const el = this.scrollContainer?.nativeElement;
            if (!el) return;
            const images = Array.from(el.querySelectorAll('img'));
            if (images.length === 0) { this.pendingScrollToBottom = false; return; }
            let pending = images.length;
            const onSettled = () => { if (--pending <= 0) { this.scrollToBottom(); this.pendingScrollToBottom = false; } };
            images.forEach(img => {
                if (img.complete) { onSettled(); }
                else { img.addEventListener('load', onSettled, { once: true }); img.addEventListener('error', onSettled, { once: true }); }
            });
        }, 0);
    }

    private setupMutationObserver() {
        const el = this.scrollContainer?.nativeElement;
        if (!el) return;
        this.mutationObserver = new MutationObserver(() => {
            if (this.pendingScrollToBottom) this.scrollToBottom();
        });
        this.mutationObserver.observe(el, { childList: true, subtree: true });
    }

    private scrollToBottom() {
        const el = this.scrollContainer?.nativeElement;
        if (el) el.scrollTop = el.scrollHeight;
    }

    private setupIntersectionObserver() {
        this.intersectionObserver = new IntersectionObserver((entries) => {
            if (entries[0].isIntersecting && this.hasMore && !this.loading) {
                this.prevScrollHeight = this.scrollContainer.nativeElement.scrollHeight;
                this.loadMore.emit();
            }
        }, { threshold: 0.1 });
        if (this.topSentinel?.nativeElement) {
            this.intersectionObserver.observe(this.topSentinel.nativeElement);
        }
    }

    trackByMessageId(_: number, msg: Message) { return msg.messageId; }
    isOwnMessage(senderId: any): boolean { return String(senderId) === String(this.currentUserId); }
}