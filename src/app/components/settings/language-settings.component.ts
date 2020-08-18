import {Component, Input} from '@angular/core';
import {CdkDragDrop} from '@angular/cdk/drag-drop';
import {NgbModal, NgbModalRef} from '@ng-bootstrap/ng-bootstrap';
import {clone} from 'tsfun/struct';
import {map} from 'tsfun/associative';
import {Settings} from '../../core/settings/settings';
import {LanguagePickerModalComponent} from './language-picker-modal.component';
import {MenuContext, MenuService} from '../menu-service';

const cldr = typeof window !== 'undefined' ? window.require('cldr') : require('cldr');
const remote = typeof window !== 'undefined' ? window.require('electron').remote : require('electron').remote;


type Language = {
    label: string;
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
                private menuService: MenuService) {

        this.languages = LanguageSettingsComponent.getAvailableLanguages();
    }


    public removeLanguage(language: string) {

        this.selectedLanguages.splice(this.selectedLanguages.indexOf(language), 1);
    }


    public onDrop(event: CdkDragDrop<string[], any>) {

        this.selectedLanguages.splice(
            event.currentIndex,
            0,
            this.selectedLanguages.splice(event.previousIndex, 1)[0]
        );
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


    private static getAvailableLanguages(): { [languageCode: string]: Language } {

        const languages = cldr.extractLanguageDisplayNames(Settings.getLocale());
        const mainLanguages: string[] = remote.getGlobal('getMainLanguages')();

        return Object.keys(languages).reduce((result, languageCode) => {
            if (languageCode.length === 2 ) {
                result[languageCode] = {
                    label: languages[languageCode],
                    isMainLanguage: mainLanguages.includes(languageCode)
                };
            }
            return result;
        }, {});
    }
}
