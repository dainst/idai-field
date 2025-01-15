import { Component } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { Map } from 'tsfun';
import { Dating, I18N, ProjectConfiguration } from 'idai-field-core';
import { Language, Languages } from '../../../../../services/languages';
import { SettingsProvider } from '../../../../../services/settings/settings-provider';
import { Menus } from '../../../../../services/menus';
import { MenuContext } from '../../../../../services/menu-context';


@Component({
    templateUrl: './dating-entry-modal.html',
    host: {
        '(window:keydown)': 'onKeyDown($event)'
    },
    standalone: false
})
/**
 * @author Sebastian Cuy
 * @author Thomas Kleinke
 */
export class DatingEntryModalComponent {

    public entry: Dating;
    public isNew: boolean;
    public languages: Map<Language>;

    public fieldLanguages: Array<Language>;


    constructor(private projectConfiguration: ProjectConfiguration,
                private settingsProvider: SettingsProvider,
                private activeModal: NgbActiveModal,
                private menus: Menus) {}


    public cancel = () => this.activeModal.dismiss();


    public onKeyDown(event: KeyboardEvent) {

        if (event.key === 'Escape' && this.menus.getContext() === MenuContext.MODAL) {
            this.activeModal.dismiss();
        }
    }


    public async initialize() {

        if (this.isNew) {
            this.entry = {} as Dating;
            this.setType('range');
        }

        this.fieldLanguages = await this.getFieldLanguages();
    }
        
        
    public setType(type: Dating.Type) {

        this.reset();

        this.entry.type = type;

        if (type !== 'single' && type !== 'before') {
            this.entry.begin = { year: 0, inputYear: 0, inputType: 'bce' };
        }
        
        if (type !== 'after') {
            this.entry.end = { year: 0, inputYear: 0, inputType: 'bce' };
        };
    }


    public updateSource(source: I18N.String) {

        if (source) {
            this.entry.source = source;
        } else {
            delete this.entry.source;
        }
    }


    public validate(): boolean {

        if (this.entry.type === 'scientific') {
            this.entry.begin.inputType = this.entry.end.inputType;
        }
        
        Dating.addNormalizedValues(this.entry);

        return Dating.isDating(this.entry) && Dating.isValid(this.entry);
    }


    public confirm() {

        if (!this.validate()) return;

        this.activeModal.close(this.entry);
    }


    private reset() {

        delete this.entry.begin;
        delete this.entry.end;
        delete this.entry.margin;
        delete this.entry.source;

        this.entry.isImprecise = false;
        this.entry.isUncertain = false;
    }


    private getFieldLanguages(): Array<Language> {

        return Languages.getFieldLanguages(
            this.entry.source,
            this.languages,
            this.projectConfiguration.getProjectLanguages(),
            this.settingsProvider.getSettings().languages,
            $localize `:@@languages.noLanguage:Ohne Sprachangabe`
        );
    }
}
