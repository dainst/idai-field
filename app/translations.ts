const remote = require('electron').remote;
const fs = require('fs');

/**
 * @author Thomas Kleinke
 */
export module Translations {

    export function getTranslations(): string {

        const locale: string = remote.getGlobal('config').locale;
        const filePath: string = remote.app.getAppPath() + '/app/i18n/messages.' + locale + '.xlf';

        return fs.readFileSync(filePath, 'utf8');
    }
}
