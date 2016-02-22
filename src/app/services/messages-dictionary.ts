import {Injectable} from "angular2/core";
import {Message} from "../model/message";

/**
 * This map contains the message bodies
 * messages identified by their key.
 * It can be replaced later by another data source
 * like an external service.
 *
 * @author Daniel M. de Oliveira
 * @author Jan G. Wieners
 */
@Injectable()
export class MessagesDictionary {

    public static MSGKEY_OBJLIST_IDEXISTS : string = 'objectlist/idexists';
    public static MSGKEY_MESSAGES_NOBODY : string = 'messages/nobody';

    // Can we access the above defined keys for the left hand side of the map here?
    public static MESSAGES = {
        "objectlist/idexists" : "Object Identifier already exists.",
        "messages/nobody" : "No message body found for key 'id'."
    };

    public static MSG_WRONG_LEVEL = "Message level 'msglevel' is not available.";

    public static LEVELS = [
        "success",
        "info",
        "warning",
        "danger"
    ];
}