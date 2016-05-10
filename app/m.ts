import {Injectable} from "angular2/core";

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
export class M { // = Messages Dictionary. For reasons of brevity of calls to it just "M".

    public static OBJLIST_IDEXISTS : string = 'objectlist/idexists';
    public static OBJLIST_IDMISSING : string = 'objectlist/idmissing';
    public static OBJLIST_SAVE_SUCCESS : string = 'objectlist/savesuccess';
    public static MESSAGES_NOBODY : string = 'messages/nobody';
    public static PC_GENERIC_ERROR : string = 'pmc/generic';
    public static PARSE_GENERIC_ERROR : string = 'parse/generic';

    public msgs;

    constructor() {
        this.msgs={};
        this.msgs[M.OBJLIST_IDEXISTS]= "Objekt Identifier existiert bereits. Bei Klick auf ein anderes Objekt wird der ursprüngliche Zustand wiederhergestellt.";
        this.msgs[M.OBJLIST_IDMISSING]= "Objekt Identifier fehlt. Bei Klick auf ein anderes Objekt wird der ursprüngliche Zustand wiederhergestellt.";
        this.msgs[M.OBJLIST_SAVE_SUCCESS] = "Das Objekt wurde erfolgreich gespeichert.";
        this.msgs[M.MESSAGES_NOBODY]= "Kein Message gefunden für Schlüssel 'id'.";
        this.msgs[M.PC_GENERIC_ERROR]= "Fehler beim Auswertenwerten eines Konfigurationsobjektes.";
        this.msgs[M.PARSE_GENERIC_ERROR]= "Fehler beim Parsen einer Konfigurationsdatei.";
    }

    public static MSG_WRONG_LEVEL = "Message level 'msglevel' is not available.";

    public static LEVELS = [
        "success",
        "info",
        "warning",
        "danger"
    ];
}