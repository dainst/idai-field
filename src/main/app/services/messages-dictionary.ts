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
    public static MSGKEY_OBJLIST_IDMISSING : string = 'objectlist/idmissing';
    public static MSGKEY_MESSAGES_NOBODY : string = 'messages/nobody';
    public static MSGKEY_DMC_GENERIC_ERROR : string = 'dmc/generic';

    // Can we access the above defined keys for the left hand side of the map here?
    public static MESSAGES = {
        "objectlist/idexists" : "Object Identifier already exists.",
        "objectlist/idmissing" : "Object Identifier is missing.",
        "messages/nobody" : "No message body found for key 'id'.",
        "dmc/generic" : "An error occured during parsing of Configuration.json.",
    };

    public static MSG_WRONG_LEVEL = "Message level 'msglevel' is not available.";

    public static LEVELS = [
        "success",
        "info",
        "warning",
        "danger"
    ];
}