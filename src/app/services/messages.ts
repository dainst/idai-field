import {Injectable} from "angular2/core";
import {Message} from "../model/message";

/**
 * @author Jan G. Wieners
 */
@Injectable()

export class Messages {

    /**
     * Message stack
     */
    public messages: Message[] = [];

    public addMessage(type, content) {

        this.messages.push({
            'type': type,
            'content': content
        });
    }

    public deleteMessages() {
        this.messages.length = 0;
    }

    public getMessages() {
        return this.messages;
    }
}

