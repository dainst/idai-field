import {Component, Input} from '@angular/core';
import {Messages} from "./messages";

/**
 * @author Jan G. Wieners
 */
@Component({
    selector: 'message',
    templateUrl: 'templates/message.html'
})

export class MessagesComponent {

    constructor(private messages: Messages) {}
}