import { isArray } from 'tsfun';
import { MD } from '../../../../components/messages/md';
import { MessageTemplate } from '../../../../components/messages/message';
import { MessagesConversion } from '../../../../components/import/messages-conversion';
import { MsgWithParams } from '../../../../components/messages/msg-with-params';


/**
 * @author Thomas Kleinke
 */
export function getErrorMessage(error: any, messagesDictionary: MD): string|any {

    if (isArray(error)) {
        const convertedError: MsgWithParams = MessagesConversion.convertMessage(error);
        const messageTemplate: MessageTemplate = messagesDictionary.msgs[convertedError[0]];
        if (!messageTemplate) return error;

        let message: string = messageTemplate.content;
        const parameters: any[] = error.slice(1);
        for (let i in parameters) {
            message = message.replace('[' + i + ']', parameters[i]);
        }
        return message;
    }

    if (error.message) return error.message;

    return error;
}
