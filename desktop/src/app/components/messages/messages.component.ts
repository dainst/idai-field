import { ChangeDetectorRef, Component, Input, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs/internal/Subscription';
import { Messages } from './messages';
import { Message } from './message';

/**
 * @author Jan G. Wieners
 * @author Thomas Kleinke
 */
@Component({
    selector: 'messages',
    templateUrl: './messages.html'
})

export class MessagesComponent implements OnDestroy {

    @Input() alwaysShowClose = false;

    private newMessagesSubscription: Subscription;


    constructor(changeDetectorRef: ChangeDetectorRef,
                private messages: Messages) {

        this.newMessagesSubscription = this.messages.newMessagesNotifications()
            .subscribe(() => changeDetectorRef.detectChanges());
    }


    public getActiveMessages = () => this.messages.getActiveMessages();

    public closeAlert = (message: Message) => this.messages.hideMessage(message);


    ngOnDestroy() {

        if (this.newMessagesSubscription) this.newMessagesSubscription.unsubscribe();
    }


    public getMessageContent(message: Message): string {

        let content = message.content;

        if (message.params) {
            for (let i in message.params) {
                content = content.replace('[' + i + ']', message.params[i]);
            }
        }

        return content;
    }
}
