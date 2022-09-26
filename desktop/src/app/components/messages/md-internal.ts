import { Message } from './message';
import { MD } from './md';


/**
 * A message dictionary with messages for native library functionality.
 *
 * @author Daniel de Oliveira
 */
export class MDInternal extends MD {

    public static MESSAGES_ERROR_UNKNOWN_MESSAGE: string = 'messages.error.unknownMessage';
    public static PROJECT_CONFIGURATION_ERROR_GENERIC: string = 'projectConfiguration.error.generic';

    public msgs: { [id: string]: Message } = {};


    constructor() {

        super();

        this.msgs[MDInternal.MESSAGES_ERROR_UNKNOWN_MESSAGE] = {
            content: 'Ein unbekannter Fehler ist aufgetreten. Details können in der Developer Console eingesehen werden.',
            level: 'danger',
            params: [],
            hidden: false
        };
        this.msgs[MDInternal.PROJECT_CONFIGURATION_ERROR_GENERIC] = {
            content: 'Fehler beim Auswerten eines Konfigurationsobjektes.',
            level: 'danger',
            params: [],
            hidden: false
        };
    }
}
