import { Labeled, LabeledValue } from 'idai-field-core';

const ELECTRON_CONFIG_LANGUAGES: string[] = typeof window !== 'undefined' && window.require
    ? window.require('@electron/remote').getGlobal('config').languages
    : ['de'];

// TODO review UtilTranslations
// TODO maybe rename to Translations or Languages and extend with more functionality?
export class Labels {

    public get(labeledValue: LabeledValue): string {

        return Labeled.getLabel(labeledValue, ELECTRON_CONFIG_LANGUAGES);
    }

    public getLabelAndDescription(labeledValue: LabeledValue)
            : { label: string, description?: string } {

        // TODO why is description in Labeled?
        return Labeled.getLabelAndDescription(labeledValue, ELECTRON_CONFIG_LANGUAGES);
    }


    // TODO maybe remove
    public getLanguages() {

        return ELECTRON_CONFIG_LANGUAGES;
    }
}
