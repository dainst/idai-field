import {Injectable} from "@angular/core";
import {Message} from "idai-components-2/idai-components-2"

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

    public static IMPORTER_START : string = 'importer/start';
    public static IMPORTER_SUCCESS_SINGLE : string = 'importer/success/single';
    public static IMPORTER_SUCCESS_MULTIPLE : string = 'importer/success/multiple';
    public static IMPORTER_FAILURE_FILEUNREADABLE : string = 'importer/failure/fileunreadable';
    public static IMPORTER_FAILURE_INVALIDJSON : string = 'importer/failure/invalidjson';
    public static IMPORTER_FAILURE_IDEXISTS: string = 'importer/failure/idexists';
    public static IMPORTER_FAILURE_IDMISSING: string = 'importer/failure/idmissing';
    public static IMPORTER_FAILURE_GENERICDATASTOREERROR: string = 'importer/failure/genericdatastoreerrror';
    public static IMPORTER_FAILURE_INVALIDTYPE: string = 'importer/failure/invalidtype';
    public static IMPORTER_FAILURE_INVALIDFIELD: string = 'importer/failure/invalidfield';
    public static OBJLIST_IDEXISTS : string = 'objectlist/idexists';
    public static OBJLIST_IDMISSING : string = 'objectlist/idmissing';
    public static OBJLIST_SAVE_SUCCESS : string = 'objectlist/savesuccess';
    public static DATASTORE_GENERIC_SAVE_ERROR : string = 'datastore/genericsaveerror';
    public static MESSAGES_NOBODY : string = 'messages/nobody';
    public static PC_GENERIC_ERROR : string = 'pmc/generic';
    public static PARSE_GENERIC_ERROR : string = 'parse/generic';
    public static VALIDATION_ERROR_INVALIDTYPE: string = '/validation/error/invalidtype';
    public static VALIDATION_ERROR_INVALIDFIELD: string = '/validation/error/invalidfield';

    public msgs : { [id: string]: Message } = {};

    constructor() {
        this.msgs[M.IMPORTER_START]={
            content: 'Starte Import...',
            level: 'info',
            params: []
        };
        this.msgs[M.IMPORTER_SUCCESS_SINGLE]={
            content: 'Eine Ressource wurde erfolgreich importiert.',
            level: 'success',
            params: []
        };
        this.msgs[M.IMPORTER_SUCCESS_MULTIPLE]={
            content: '{0} Ressourcen wurden erfolgreich importiert.',
            level: 'success',
            params: [ "Mehrere"]
        };
        this.msgs[M.IMPORTER_FAILURE_FILEUNREADABLE]={
            content: 'Beim Import ist ein Fehler aufgetreten: Die Datei {0} konnte nicht gelesen werden.',
            level: 'danger',
            params: [ "" ]
        };
        this.msgs[M.IMPORTER_FAILURE_INVALIDJSON]={
            content: 'Beim Import ist ein Fehler aufgetreten: Das JSON in Zeile {0} ist nicht valide.',
            level: 'danger',
            params: [ "?" ]
        };
        this.msgs[M.IMPORTER_FAILURE_IDEXISTS]={
            content: 'Beim Import ist ein Fehler aufgetreten: Ressourcen-Identifier {0} existiert bereits.',
            level: 'danger',
            params: [ "" ]
        };
        this.msgs[M.IMPORTER_FAILURE_GENERICDATASTOREERROR]={
            content: 'Beim Import ist ein Fehler aufgetreten: Die Ressource {0} konnte nicht ' +
                     'gespeichert werden.',
            level: 'danger',
            params: [ "?" ]
        };
        this.msgs[M.IMPORTER_FAILURE_IDMISSING]={
            content: 'Beim Import ist ein Fehler aufgetreten: Ein Ressourcen-Identifier fehlt.',
            level: 'danger',
            params: []
        };
        this.msgs[M.IMPORTER_FAILURE_INVALIDTYPE]={
            content: "Beim Import ist ein Fehler aufgetreten: Der Typ {0} der Ressource {1} wird nicht unterstützt.",
            level: 'danger',
            params: ["", ""]
        };
        this.msgs[M.IMPORTER_FAILURE_INVALIDFIELD]={
            content: "Beim Import ist ein Fehler aufgetreten: Ein Feld der Ressource {0} wird nicht unterstützt.",
            level: 'danger',
            params: [""]
        };
        this.msgs[M.OBJLIST_IDEXISTS]={
            content: 'Objekt-Identifier existiert bereits.',
            level: 'danger',
            params: []
        };
        this.msgs[M.OBJLIST_IDMISSING]={
            content: 'Objekt-Identifier fehlt.',
            level: 'danger',
            params: []
        };
        this.msgs[M.OBJLIST_SAVE_SUCCESS]={
            content: 'Das Objekt wurde erfolgreich gespeichert.',
            level: 'success',
            params: []
        };
        this.msgs[M.DATASTORE_GENERIC_SAVE_ERROR]={
            content: 'Beim Speichern des Objekts ist ein Fehler aufgetreten.',
            level: 'danger',
            params: []
        };
        this.msgs[M.MESSAGES_NOBODY]={
            content: "Keine Message gefunden für Schlüssel 'id'.",
            level: 'danger',
            params: []
        };
        this.msgs[M.PC_GENERIC_ERROR]={
            content: "Fehler beim Auswerten eines Konfigurationsobjektes.",
            level: 'danger',
            params: []
        };
        this.msgs[M.PARSE_GENERIC_ERROR]={
            content: "Fehler beim Parsen einer Konfigurationsdatei.",
            level: 'danger',
            params: []
        };
        this.msgs[M.VALIDATION_ERROR_INVALIDTYPE]={
            content: "Der Typ der Ressource wird nicht unterstützt.",
            level: 'danger',
            params: []
        };
        this.msgs[M.VALIDATION_ERROR_INVALIDFIELD]={
            content: "Ein Feld der Ressource wird nicht unterstützt.",
            level: 'danger',
            params: []
        };
    }
}