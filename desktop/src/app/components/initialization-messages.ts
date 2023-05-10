const fs = typeof window !== 'undefined' ? window.require('fs') : require('fs');
const remote = typeof window !== 'undefined' ? window.require('@electron/remote') : undefined;


const path = remote.app.getAppPath() + '/src/app/i18n/initialization/';

const initializationMessages = fs.readdirSync(path).reduce((result, fileName) => {
    const languageCode = fileName.split('.')[1];
    result[languageCode] = JSON.parse(fs.readFileSync(path + fileName));
    return result;
}, {});


export const getMessage = (key: string, locale: string, parameters?: string[]): string | undefined => {

    let message: string = initializationMessages[locale][key];

    if (!message) return undefined;

    if (parameters) {
        for (let i = 0; i < parameters.length; i++) {
            message = message.replace('[' + i + ']', parameters[i]);
        }
    }

    return message;
};
