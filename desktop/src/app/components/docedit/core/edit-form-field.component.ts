import { Component, Input, OnChanges } from '@angular/core';
import { isObject, Map, set } from 'tsfun';
import { Resource, Field, ProjectConfiguration } from 'idai-field-core';
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
                private projectConfiguration: ProjectConfiguration) {}


    ngOnChanges() {
        
        this.fieldLanguages = this.getFieldLanguages();
    }


    private getFieldLanguages(): Array<Language> {

        const configuredLanguages: string[] = this.projectConfiguration.getProjectLanguages();
        const settingsLanguages: string[] = this.settingsProvider.getSettings().languages;
        const fieldLanguages: string[] = set(this.getUsedLanguages().concat(configuredLanguages));

        return fieldLanguages.sort((language1, language2) => {
            return this.getIndexForSorting(settingsLanguages, language1)
                - this.getIndexForSorting(settingsLanguages, language2);
        }).map(languageCode => this.languages[languageCode]);
    }


    private getUsedLanguages(): string[] {

        const fieldContent: any = this.resource[this.field.name];

        if (!isObject(fieldContent)) return [];

        return Object.keys(fieldContent).filter(languageCode => this.languages[languageCode]);
    }


    private getIndexForSorting(settingsLanguages: string[], language: string): number {

        const index: number = settingsLanguages.indexOf(language);
        return index === -1 ? 10000000 : index; 
    }
}
