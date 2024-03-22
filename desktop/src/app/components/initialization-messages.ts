import messagesDe from '../i18n/initialization/messages.de.json';
import messagesEn from '../i18n/initialization/messages.en.json';
import messagesIt from '../i18n/initialization/messages.it.json';
import messagesTr from '../i18n/initialization/messages.tr.json';
import messagesUk from '../i18n/initialization/messages.uk.json';


const messageDictionary = {
    de: messagesDe,
    en: messagesEn,
    it: messagesIt,
    tr: messagesTr,
    uk: messagesUk
};


export const getMessage = (key: string, locale: string, parameters?: string[]): string | undefined => {

    let message: string = messageDictionary[locale][key];

    if (!message) return undefined;

    if (parameters) {
        for (let i = 0; i < parameters.length; i++) {
            message = message.replace('[' + i + ']', parameters[i]);
        }
    }

    return message;
};
