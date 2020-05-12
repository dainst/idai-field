const remote = window.require('electron').remote;
const fs = window.require('fs');

/**
 * @author Thomas Kleinke
 */

export module Translations {

    export function getTranslations(): string {

        const locale: string = remote.getGlobal('config').locale;
        // TODO remove /src from path
        const filePath: string = remote.app.getAppPath() + '/src/app/i18n/messages.' + locale + '.xlf';

        return fs.readFileSync(filePath, 'utf8');
    }
}

