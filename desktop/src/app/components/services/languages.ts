const CONFIGURED_LANGUAGES: string[] = typeof window !== 'undefined' && window.require
    ? window.require('@electron/remote').getGlobal('config').languages
    : ['de'];

export class Languages {

    public get() {

        return CONFIGURED_LANGUAGES;
    }
}
