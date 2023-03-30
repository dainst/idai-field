import { Component, Input } from '@angular/core';
import { I18n } from '@ngx-translate/i18n-polyfill';
import { Map } from 'tsfun';
import { Resource, Dating, I18N, Labels, ProjectConfiguration } from 'idai-field-core';
import { Language, Languages } from '../../../../services/languages';
import { SettingsProvider } from '../../../../services/settings/settings-provider';
import { UtilTranslations } from '../../../../util/util-translations';


@Component({
    selector: 'form-field-dating',
    templateUrl: './dating.html'
})
/**
 * @author Sebastian Cuy
 * @author Thomas Kleinke
 */
export class DatingComponent {

    @Input() resource: Resource;
    @Input() field: any;
    @Input() languages: Map<Language>;

    public newDating: Dating|undefined = undefined;
    public fieldLanguages: Array<Language>;


    constructor(private utilTranslations: UtilTranslations,
                private labels: Labels,
                private projectConfiguration: ProjectConfiguration,
                private settingsProvider: SettingsProvider,
                private i18n: I18n) {}


    public removeDating(index: number) {

        this.resource[this.field.name].splice(index, 1);
        if (this.resource[this.field.name].length === 0) delete this.resource[this.field.name];
    }


    public createNewDating(type: Dating.Types = 'range') {

        this.fieldLanguages = Languages.getFieldLanguages(
            undefined,
            this.languages,
            this.projectConfiguration.getProjectLanguages(),
            this.settingsProvider.getSettings().languages,
            this.i18n({ id: 'languages.noLanguage', value: 'Ohne Sprachangabe' })
        );

        this.newDating = { type: type };

        if (type !== 'exact' && type !== 'before') {
            this.newDating.begin = { year: 0, inputYear: 0, inputType: 'bce' };
        }
        
        if (type !== 'after') {
            this.newDating.end = { year: 0, inputYear: 0, inputType: 'bce' };
        };
    }


    public addNewDating() {

        if (!this.resource[this.field.name]) this.resource[this.field.name] = [];
        this.resource[this.field.name].push(this.newDating);
        this.newDating = undefined;
    }


    public updateSource(dating: Dating, source: any) {

        if (source) {
            dating.source = source;
        } else {
            delete dating.source;
        }
    }


    public getLabel(dating: Dating): string {

        return dating.label
            ? dating.label
            : Dating.generateLabel(
                dating,
                (key: string) => this.utilTranslations.getTranslation(key),
                (value: I18N.String|string) => this.labels.getFromI18NString(value)
            );
    }


    public validate(dating: Dating): boolean {

        if (dating.type === 'scientific') {
            dating.begin.inputType = dating.end.inputType;
        }
        
        Dating.addNormalizedValues(dating);

        return Dating.isDating(dating) && Dating.isValid(dating);
    }
}
