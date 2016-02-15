import {Component, Input} from 'angular2/core';
import {Messages} from "../services/messages";

/**
 * @author Jan G. Wieners
 */
@Component({
    selector: 'message',
    templateUrl: 'templates/message.html'
})

export class MessagesComponent {

    //@Input() identifier: string;

    constructor(private messages: Messages) {
    }
}