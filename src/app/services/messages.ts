import {Injectable} from "angular2/core";
import {Message} from "../model/message";

/**
 * @author Jan G. Wieners
 */
@Injectable()

export class Messages {

    private messages: Message[] = [];

    /**
     * Property "messageStack" and method "flattenMessages()" are used because Angular2 expects a non-changing
     * object / array to generate the view.
     * If getMessages() would convert the map "messages" every time to an array when it gets executed,
     * Angular2 would fail with "Expression has changed after it was checked" exception.
     */
    private messageStack = [];

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

    public getMessages() {
        return this.messageStack;
    }
}

