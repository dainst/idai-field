import { Component, Input, OnChanges } from '@angular/core';
import { I18n } from '@ngx-translate/i18n-polyfill';
import { Map } from 'tsfun';
import { ProjectConfiguration, Resource } from 'idai-field-core';
import { Language, Languages } from '../../../../services/languages';
import { SettingsProvider } from '../../../../services/settings/settings-provider';


@Component({
    selector: 'form-field-input',
    templateUrl: './input.html'
})
/**
 * @author Thomas Kleinke
 */
export class InputComponent implements OnChanges {

    @Input() resource: Resource;
    @Input() fieldName: string;
    @Input() languages: Map<Language>;
    @Input() multiLine: boolean;

    public fieldLanguages: Array<Language>;


    constructor(private projectConfiguration: ProjectConfiguration,
                private settingsProvider: SettingsProvider,
                private i18n: I18n) {}


    ngOnChanges() {

        this.fieldLanguages = Languages.getFieldLanguages(
            this.resource[this.fieldName],
            this.languages,
            this.projectConfiguration.getProjectLanguages(),
            this.settingsProvider.getSettings().languages,
            this.i18n({ id: 'languages.noLanguage', value: 'Ohne Sprachangabe' })
        );
    }


    public update(fieldData: any) {

        if (fieldData) {
            this.resource[this.fieldName] = fieldData;
        } else {
            delete this.resource[this.fieldName];
        }
    }
}
