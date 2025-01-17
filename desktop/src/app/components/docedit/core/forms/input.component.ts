import { Component, Input, OnChanges } from '@angular/core';
import { Map } from 'tsfun';
import { ProjectConfiguration } from 'idai-field-core';
import { Language, Languages } from '../../../../services/languages';
import { SettingsProvider } from '../../../../services/settings/settings-provider';


@Component({
    selector: 'form-field-input',
    templateUrl: './input.html',
    standalone: false
})
/**
 * @author Thomas Kleinke
 */
export class InputComponent implements OnChanges {

    @Input() fieldContainer: any;
    @Input() fieldName: string;
    @Input() languages: Map<Language>;
    @Input() multiLine: boolean;

    public fieldLanguages: Array<Language>;


    constructor(private projectConfiguration: ProjectConfiguration,
                private settingsProvider: SettingsProvider) {}


    ngOnChanges() {

        this.fieldLanguages = Languages.getFieldLanguages(
            this.fieldContainer[this.fieldName],
            this.languages,
            this.projectConfiguration.getProjectLanguages(),
            this.settingsProvider.getSettings().languages,
            $localize `:@@languages.noLanguage:Ohne Sprachangabe`
        );
    }


    public update(fieldData: any) {

        if (fieldData) {
            this.fieldContainer[this.fieldName] = fieldData;
        } else {
            delete this.fieldContainer[this.fieldName];
        }
    }
}
