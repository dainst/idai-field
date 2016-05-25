import {Injectable} from "@angular/core";
import {Message} from "./message";
import {M} from "../m";

/**
 * Maintains a collection of currently active messages the
 * user can see at a given moment. Messages can be added
 * or removed based on identifiers.
 *
 * @author Jan G. Wieners
 * @author Daniel M. de Oliveira
 */
@Injectable()
export class Messages {

    constructor(private messagesDictionary:M){ }

    private messageMap: { [id: string]: Message } = {};

    /**
     * Holds the collection to be delivered when calling {@link Messages#getMessages()}.
     *
     * Angular2 expects a non-changing
     * object / array to generate the view.
     * If getMessages() would convert the map "messages" every time to an array when it gets executed,
     * Angular2 would fail with "Expression has changed after it was checked" exception.
     */
    private messageList : Message[] = [];


    /**
     * @param id used to identify the message. Must be an existing key.
     *   If it is not, the the id param gets interpreted as a message content of an unkown
     *   error condition with level 'danger'.
     */
    public add(id:string): void {

        var msg = this.messagesDictionary.msgs[id];

        if (msg)
            this.messageMap[id] = msg;
        else {
            this.messageMap[id] = {
                content: id,
                level: 'danger'
            }
        }
    }

    /**
     * Removes all messages.
     */
    public clear() {
        for (var p in this.messageMap) delete this.messageMap[p]; 
    }

    /**
     * Provides access to the messages data structure
     * which can be used as an angular model since
     * it is guaranteed that getMessages() returns always the
     * same object.
     *
     * @returns {Array} reference to the list of current messages.
     */
    public getMessages() : Message[] {
        this.refreshMessageList();
        return this.messageList;
    }

    /**
     * Updates messageList on the basis of the current state of messages.
     */
    private refreshMessageList(): void {

        this.messageList.length = 0;

        for (var p in this.messageMap) {
            this.messageList.push(this.messageMap[p]);
        }
    }
}