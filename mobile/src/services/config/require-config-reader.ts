/* eslint-disable @typescript-eslint/no-explicit-any */
import { ConfigReader } from 'idai-field-core';
import { clone } from 'tsfun';
import configDefault from './json/Config-Default.json';
import coreLanguageDe from './json/Core/Language.de.json';
import coreLanguageEn from './json/Core/Language.en.json';
import coreLanguageEs from './json/Core/Language.es.json';
import coreLanguageIt from './json/Core/Language.it.json';
import libraryCategories from './json/Library/Categories.json';
import libraryLanguageDe from './json/Library/Language.de.json';
import libraryLanguageEn from './json/Library/Language.en.json';
import libraryLanguageEs from './json/Library/Language.es.json';
import libraryLanguageIt from './json/Library/Language.it.json';
import libraryValuelists from './json/Library/Valuelists.json';
import order from './json/Order.json';
import search from './json/Search.json';


const MISSING_CUSTOM_CONF = 'configuration/error/missingCustomConf';


const PATH_MAP: Record<string, any> = {
    '/Core/Language.de.json': coreLanguageDe,
    '/Core/Language.en.json': coreLanguageEn,
    '/Core/Language.es.json': coreLanguageEs,
    '/Core/Language.it.json': coreLanguageIt,
    '/Library/Categories.json': libraryCategories,
    '/Library/Language.de.json': libraryLanguageDe,
    '/Library/Language.en.json': libraryLanguageEn,
    '/Library/Language.es.json': libraryLanguageEs,
    '/Library/Language.it.json': libraryLanguageIt,
    '/Library/Valuelists.json': libraryValuelists,
    '/Config-Default.json': configDefault,
    '/Order.json': order,
    '/Search.json': search,
};


export default class RequireConfigReader implements ConfigReader {

    exists = (path: string): boolean => (path in PATH_MAP);

    read = (path: string): any => {

        // eslint-disable-next-line no-throw-literal
        if (!this.exists(path)) throw MISSING_CUSTOM_CONF;

        return clone(PATH_MAP[path]);
    };

}
