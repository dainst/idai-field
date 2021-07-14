import { I18N } from 'idai-field-core';

const ELECTRON_CONFIG_LANGUAGES: string[] = typeof window !== 'undefined' && window.require
    ? window.require('@electron/remote').getGlobal('config').languages
    : ['de'];

/**
 * @author Daniel de Oliveira
 */
export class Labels {

    public get(labeledValue: I18N.LabeledValue): string {

        return I18N.getLabel(labeledValue, ELECTRON_CONFIG_LANGUAGES);
    }

    public getLabelAndDescription(labeledValue: I18N.LabeledValue)
            : { label: string, description?: string } {

        return I18N.getLabelAndDescription(labeledValue, ELECTRON_CONFIG_LANGUAGES);
    }

    public getLanguages() {

        return ELECTRON_CONFIG_LANGUAGES;
    }
}
