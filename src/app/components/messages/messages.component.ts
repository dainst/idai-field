import {Component, Input} from '@angular/core';
import {Messages} from './messages';
import {Message} from './message';

/**
 * @author Jan G. Wieners
 * @author Thomas Kleinke
 */
@Component({
    selector: 'messages',
    templateUrl: './messages.html'
})

export class MessagesComponent {

    @Input() alwaysShowClose = false;


    constructor(private messages: Messages) {}


    public getActiveMessages = () => this.messages.getActiveMessages();

    public closeAlert = (message: Message) => this.messages.hideMessage(message);


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
