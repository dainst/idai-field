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

    constructor(private messages: Messages) {}
}