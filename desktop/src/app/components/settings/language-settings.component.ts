import { CdkDragDrop } from '@angular/cdk/drag-drop';
import { Component, Input } from '@angular/core';
import { moveInArray } from 'idai-field-core';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { I18n } from '@ngx-translate/i18n-polyfill';
import { clone, map } from 'tsfun';
import { Settings } from '../../core/settings/settings';
import { MenuContext, MenuService } from '../menu-service';
import { LanguagePickerModalComponent } from './language-picker-modal.component';

const cldr = typeof window !== 'undefined' ? window.require('cldr') : require('cldr');
const remote = typeof window !== 'undefined' ? window.require('@electron/remote') : undefined;


type Language = {
    label: string;
    info?: string;
    isMainLanguage: boolean;
}


@Component({
    selector: 'language-settings',
    templateUrl: './language-settings.html'
})
/**
 * @author Thomas Kleinke
 */
export class LanguageSettingsComponent {

    @Input() selectedLanguages: string[];

    public readonly languages: { [languageCode: string]: Language };
    public dragging: boolean = false;


    constructor(private modalService: NgbModal,
                private menuService: MenuService,
                private i18n: I18n) {

        this.languages = this.getAvailableLanguages();
    }


    public removeLanguage(language: string) {

        this.selectedLanguages.splice(this.selectedLanguages.indexOf(language), 1);
    }


    public onDrop(event: CdkDragDrop<string[], any>) {

        moveInArray(this.selectedLanguages, event.previousIndex, event.currentIndex);
    }


    public async addLanguage() {

        this.menuService.setContext(MenuContext.MODAL);

        const modalReference: NgbModalRef
            = this.modalService.open(LanguagePickerModalComponent);
        modalReference.componentInstance.languages = this.getUnselectedLanguages();

        try {
            this.selectedLanguages.push(await modalReference.result);
        } catch (err) {
            // Modal has been canceled
        } finally {
            this.menuService.setContext(MenuContext.DEFAULT);
        }
    }


    private getUnselectedLanguages(): { [languageCode: string]: string } {

        const result = map(language => language.label)(clone(this.languages));

        Object.keys(this.languages).forEach(languageCode => {
            if (this.selectedLanguages.includes(languageCode)) delete result[languageCode];
        });

        return result as { [languageCode: string]: string };
    }


    private getAvailableLanguages(): { [languageCode: string]: Language } {

        const languages = cldr.extractLanguageDisplayNames(Settings.getLocale());
        const mainLanguages: string[] = remote.getGlobal('getMainLanguages')();

        return Object.keys(languages).reduce((result, languageCode) => {
            if (languageCode.length === 2 ) {
                result[languageCode] = {
                    label: languages[languageCode][0].toUpperCase() + languages[languageCode].slice(1),
                    isMainLanguage: mainLanguages.includes(languageCode)
                };

                if (languageCode === 'it') {
                    result[languageCode].info = this.i18n({
                        id: 'settings.languageInfo.it',
                        value: 'Die italienische Übersetzung wird bereitgestellt vom DAI Rom. Bei Fragen und Anmerkungen zur Übersetzung wenden Sie sich bitte an: idai.field-italiano@dainst.de'
                    });
                }
            }
            return result;
        }, {});
    }
}
