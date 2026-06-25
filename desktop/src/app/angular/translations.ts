import { electronRemote as remote } from 'src/app/electron/electron';
import { electronFs as fs } from 'src/app/electron/electron';


/**
 * @author Thomas Kleinke
 */
export module Translations {

    export function getTranslations(): string {

        const locale: string = remote.getGlobal('getLocale')();
        const filePath: string = remote.app.getAppPath() + '/src/app/i18n/angular/messages.' + locale + '.xlf';

        return fs.readFileSync(filePath, 'utf8');
    }
}
