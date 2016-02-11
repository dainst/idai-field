import {Injectable} from "angular2/core";

/**
 * @author Jan G. Wieners
 */
@Injectable()

export class Message {

    /**
     * Map: [IDENTIFIER][message]
     */
    public messages: string[][] = [];

    public addMessage(identifier, name) {
        this.messages[identifier] = name;
        console.log(this.messages)
    }

    public deleteMessage(identifier) {
        delete this.messages[identifier];
        console.log(this.messages);
    }

    public getMessages() {
        return this.messages;
    }
}

