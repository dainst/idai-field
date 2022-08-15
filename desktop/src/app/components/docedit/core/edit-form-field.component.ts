import { Component, Input, OnChanges } from '@angular/core';
import { I18n } from '@ngx-translate/i18n-polyfill';
import { isObject, Map, set } from 'tsfun';
import { Resource, Field, ProjectConfiguration, I18N } from 'idai-field-core';
import { Language } from '../../../services/languages';
import { SettingsProvider } from '../../../services/settings/settings-provider';


@Component({
    selector: 'edit-form-field',
    templateUrl: './edit-form-field.html'
})
/**
 * @author Thomas Kleinke
 * @author Daniel de Oliveira
 */
export class EditFormFieldComponent implements OnChanges {

    @Input() resource: Resource;
    @Input() field: Field;
    @Input() languages: Map<Language>;

    public fieldLanguages: Array<Language>;
    
    constructor(private settingsProvider: SettingsProvider,
                private projectConfiguration: ProjectConfiguration,
                private i18n: I18n) {}


    ngOnChanges() {
        
        this.fieldLanguages = this.getFieldLanguages();
    }


    private getFieldLanguages(): Array<Language> {

        const configuredLanguages: string[] = this.getConfiguredLanguages();
        const settingsLanguages: string[] = this.settingsProvider.getSettings().languages;
        const fieldLanguages: string[] = set(this.getUsedLanguages().concat(configuredLanguages));

        return fieldLanguages.sort((language1, language2) => {
            return this.getIndexForSorting(settingsLanguages, language1)
                - this.getIndexForSorting(settingsLanguages, language2);
        }).map(languageCode => this.getLanguage(languageCode));
    }


    private getConfiguredLanguages(): string[] {

        const configuredLanguages: string[] = this.projectConfiguration.getProjectLanguages();

        return configuredLanguages.length > 0
            ? configuredLanguages
            : [I18N.NO_LANGUAGE];
    }


    private getUsedLanguages(): string[] {

        const fieldContent: any = this.resource[this.field.name];

        if (!isObject(fieldContent)) return [];

        return Object.keys(fieldContent).filter(languageCode => {
            return this.languages[languageCode] || languageCode === I18N.NO_LANGUAGE;
        });
    }


    private getLanguage(languageCode: string): Language {

        return languageCode === I18N.NO_LANGUAGE
            ? {
                code: languageCode,
                label: this.i18n({ id: 'languages.noLanguage', value: 'Ohne Sprachangabe' }),
                isMainLanguage: false
            }
            : this.languages[languageCode]
    }


    private getIndexForSorting(settingsLanguages: string[], language: string): number {

        const index: number = settingsLanguages.indexOf(language);
        return index === -1
            ? language === I18N.NO_LANGUAGE
                ? -1
                : 1000000
            : index;
    }
}
