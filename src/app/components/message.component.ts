import {Component, Input} from 'angular2/core';
import {Message} from "../services/message";

/**
 * @author Jan G. Wieners
 */
@Component({
    selector: 'message',
    templateUrl: 'templates/message.html'
})

export class MessageComponent {

    @Input() identifier: string;

    constructor(private message: Message) {
    }
}