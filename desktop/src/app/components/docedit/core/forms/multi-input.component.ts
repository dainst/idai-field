import { isObject, Map } from 'tsfun';
import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { I18n } from '@ngx-translate/i18n-polyfill';
import { isString } from 'tsfun';
import { I18N, ProjectConfiguration, Resource } from 'idai-field-core';
import { Language, Languages } from '../../../../services/languages';
import { SettingsProvider } from '../../../../services/settings/settings-provider';


@Component({
    selector: 'form-field-multi-input',
    templateUrl: './multi-input.html'
})

/**
 * @author Thomas Kleinke
 */
export class MultiInputComponent implements OnChanges {

    @Input() resource: Resource;
    @Input() fieldName: string;
    @Input() languages: Map<Language>;

    public fieldLanguages: Array<Language>;

    public newEntry: I18N.String|string;


    constructor(private projectConfiguration: ProjectConfiguration,
                private settingsProvider: SettingsProvider,
                private i18n: I18n) {}


    ngOnChanges(changes: SimpleChanges) {

        this.fieldLanguages = Languages.getFieldLanguages(
            this.resource[this.fieldName],
            this.languages,
            this.projectConfiguration.getProjectLanguages(),
            this.settingsProvider.getSettings().languages,
            this.i18n({ id: 'languages.noLanguage', value: 'Ohne Sprachangabe' })
        );
    }


    public hasNoConfiguredLanguages(): boolean {

        return this.fieldLanguages.length === 1 && this.fieldLanguages[0].code === I18N.UNSPECIFIED_LANGUAGE;
    }


    public updateExistingEntry(fieldData: any, index: number) {

        if (fieldData) {
            if (isString(fieldData)) {
                this.resource[this.fieldName][index] = fieldData;
            } else {
                this.updateEntryAsI18nString(fieldData, index);
            }
        } else {
            if (this.hasNoConfiguredLanguages()) {
                this.resource[this.fieldName][index] = '';
            } else {
                this.updateEntryAsI18nString({}, index);
            }
        }
    }


    public updateNewEntry(fieldData: any) {

        if (fieldData) {
            this.newEntry = fieldData;
        } else {
            this.newEntry = this.getEmptyEntry();
        }
    }


    public addNewEntry() {

        if (!this.isValidEntry(this.newEntry)) return;

        if (!this.resource[this.fieldName]) this.resource[this.fieldName] = [];
        this.resource[this.fieldName].push(this.newEntry);

        this.newEntry = this.getEmptyEntry();
    }


    public deleteEntry(entry: string) {

        const index: number = this.resource[this.fieldName].indexOf(entry);
        if (index > -1) this.resource[this.fieldName].splice(index, 1);

        if (this.resource[this.fieldName].length === 0) delete this.resource[this.fieldName];
    }


    public isValidEntry(entry: I18N.String|string): boolean {

        return (isString(entry) && entry.length > 0)
            || (isObject(entry) && Object.keys(entry).length > 0);
    }


    private getEmptyEntry(): I18N.String|string {

        return this.hasNoConfiguredLanguages() ? '' : {};
    }


    private updateEntryAsI18nString(fieldData: I18N.String, index: number) {

        if (isString(this.resource[this.fieldName][index])) {
            this.resource[this.fieldName][index] = fieldData;
        } else {
            MultiInputComponent.updateI18nString(this.resource[this.fieldName][index], fieldData);
        }
    }


    private static updateI18nString(i18nString: I18N.String|string, newI18nString: I18N.String) {

        Object.keys(i18nString).forEach(language => delete i18nString[language]);
        Object.assign(i18nString, newI18nString);
    }
}
