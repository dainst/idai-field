import {Injectable} from "angular2/core";
import {Message} from "../model/message";

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

    public static MSG_NO_BODY = "No message body found for key 'id'.";

    // This map contains the message bodies
    // messages identified by their key.
    // It can be replaced later by another data source
    // like an external service.
    public static MESSAGES = {
        "objectlist/idexists" : "Object Identifier already exists.",
        "temp" : "temp" // TODO used just for test, should be removed soon
    };

    /**
     * key = message id
     * value = message object
     */
    private messageMap: Message[] = [];

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
     * @param level should be one of "success", "info", "warning", "danger".
     * @throws Error if message for key id not found.
     */
    public add(id:string,level:string): void {

        var content : string = Messages.MESSAGES[id];
        if (!content)
            throw Messages.MSG_NO_BODY.replace('id',id);

        this.messageMap[id] = {
            'level' : level,
            content: content
        };

    }

    public delete(id:string) {
        delete this.messageMap[id];
    }

    /**
     * Removes all messages.
     */
    public clear() {
        for (var p in this.messageMap)
            delete this.messageMap[p];
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
            if(this.messageMap.hasOwnProperty(p)) {
                this.messageList.push(this.messageMap[p]);
            }
        }
    }
}

