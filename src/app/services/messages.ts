import {Injectable} from "angular2/core";
import {Message} from "../model/message";

/**
 * @author Jan G. Wieners
 */
@Injectable()

export class Messages {

    private messages: Message[] = [];
    public messageStack = [];

    private flattenMessages(): void {

        this.messageStack.length = 0;

        for (var p in this.messages) {
            if(this.messages.hasOwnProperty(p)) {
                this.messageStack.push(this.messages[p]);
            }
        }
    }

    public add(id,content,level): void {

        this.messages[id] = {
            'level' : level,
            content: content
        };
        this.flattenMessages();
    }

    public delete(id) {
        delete this.messages[id];
        this.flattenMessages();
    }

    public deleteMessages() {
        this.messages.length = 0;
        this.messageStack.length = 0;
    }

    public getMessages(): Array {
        return this.messageStack;
    }
}

