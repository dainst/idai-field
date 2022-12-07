import { Observer } from 'rxjs/internal/types';
import { Observable } from 'rxjs/internal/Observable';
import { ObserverUtil } from 'idai-field-core';
import { Message } from './message';
import { MD } from './md';
import { MDInternal } from './md-internal';
import { MsgWithParams } from './msg-with-params';


/**
 * Maintains a collection of currently active messages the
 * user can see at a given moment. Message content is defined
 * by message dictionary keys.
 *
 * @author Jan G. Wieners
 * @author Daniel M. de Oliveira
 * @author Thomas Kleinke
 */
export class Messages {

    private internalMessagesDictionary = new MDInternal();
    private activeMessages: Message[] = [];
    private newMessagesObservers: Array<Observer<Document>> = [];

    // Messages of these types fade away after the given timeout.
    private static TIMEOUT_TYPES: string[] = ['success', 'info'];


    constructor(private messagesDictionary: MD,
                private timeout: number) {}


    public newMessagesNotifications = (): Observable<Document> => ObserverUtil.register(this.newMessagesObservers);


    /**
     * @param msgWithParams an array of strings and numbers
     *   msgWithParams[0] -> key. Used to identify the message. Must be an existing key.
     *   msgWithParams[1..n] -> params. Contains strings which will be inserted into the message content.
     *   Every occurrence of "[0]", "[1]", "[2]" etc. will be replaced with the param string at the corresponding
     *   array position: [0] will be replaced with params[0] etc.
     */
    public add(msgWithParams: MsgWithParams) {

        if (msgWithParams.length == 0) {
            return this.addUnknownError('no msg found for key of M with id: "undefined"');
        }

        const key: string = msgWithParams[0];
        msgWithParams.splice(0, 1);

        const template: Message = this.fetchTemplate(key);
        if (!template) {
            this.addUnknownError('no msg found for key of M with id: "' + key + '"', msgWithParams);
        } else {
            const message: Message = Messages.buildFromTemplate(template, msgWithParams);
            this.startTimeout(message);
            this.activeMessages.push(message);
            ObserverUtil.notify(this.newMessagesObservers, undefined);
        }
    }


    public removeMessage(message: Message) {

        const index: number = this.activeMessages.indexOf(message, 0);
        if (index > -1) {
            this.activeMessages.splice(index, 1);
        }
    }


    public removeAllMessages() {

        this.activeMessages.splice(0, this.activeMessages.length);
    }


    public hideMessage(message: Message) {

        message.hidden = true;
    }


    public setHiddenForAll(hidden: boolean) {

        this.activeMessages.forEach(message => message.hidden = hidden);
    }


    public getActiveMessages(): Message[] {

        return this.activeMessages;
    }


    private addUnknownError(consoleError: string, parameters?: string[]) {

        if (parameters && parameters.length > 0) console.error(consoleError, parameters);
        else console.error(consoleError);

        const message = Messages.buildFromTemplate(
            this.fetchTemplate(MDInternal.MESSAGES_ERROR_UNKNOWN_MESSAGE),
            undefined
        );
        this.startTimeout(message);
        this.activeMessages.push(message);
    }


    private fetchTemplate(key: string): Message {

        return this.messagesDictionary.msgs[key] || this.internalMessagesDictionary.msgs[key];
    }


    private startTimeout(message: Message) {

        if (this.shouldSetTimeout(message)) {
            setTimeout(() => message.hidden = true, this.timeout);
        }
    }


    private shouldSetTimeout(message: Message): boolean {

        return Messages.TIMEOUT_TYPES.includes(message.level) && this.timeout > 0;
    }


    private static buildFromTemplate(template: Message, params?: Array<string>): Message {

        return {
            content: template.content,
            level: template.level,
            params: params ? params.slice() : template.params,
            hidden: false
        };
    }
}
