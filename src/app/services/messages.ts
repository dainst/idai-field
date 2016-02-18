import {Injectable} from "angular2/core";
import {Message} from "../model/message";

/**
 * @author Jan G. Wieners
 */
@Injectable()

export class Messages {

    /**
     */
    public messages: Message[] = [];

    /**
     * @deprecated
     */
    public addMessage(type, content) {

        this.messages.push({
            'type': type,
            'content': content
        });
    }

    public add(id,content,level) {
        this.messages[id]= {
            content: content,
            level: level
        }
    }

    public delete(id) {
        delete this.messages[id];
    }

    public deleteMessages() {
        this.messages.length = 0;
    }

    public getMessages() {
        return this.messages;
    }
}

