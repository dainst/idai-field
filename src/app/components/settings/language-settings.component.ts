import {Component, Input} from '@angular/core';
import {CdkDragDrop} from '@angular/cdk/drag-drop';
import {clone} from 'tsfun/struct';
import {Settings} from '../../core/settings/settings';
import {NgbModal, NgbModalRef} from '@ng-bootstrap/ng-bootstrap';
import {AddLanguageModalComponent} from './add-language-modal.component';

const cldr = typeof window !== 'undefined' ? window.require('cldr') : require('cldr');


@Component({
    selector: 'language-settings',
    templateUrl: './language-settings.html'
})
/**
 * @author Thomas Kleinke
 */
export class LanguageSettingsComponent {

    @Input() selectedLanguages: string[];

    private readonly languages: { [languageCode: string]: string };


    constructor(private modalService: NgbModal) {

        this.languages = LanguageSettingsComponent.getAvailableLanguages();
    }


    public getLabel(language: string): string {

        return cldr.extractLanguageDisplayNames(Settings.getLocale())[language];
    }


    public onDrop(event: CdkDragDrop<string[], any>) {

        this.selectedLanguages.splice(
            event.currentIndex,
            0,
            this.selectedLanguages.splice(event.previousIndex, 1)[0]
        );
    }


    public async addLanguage() {

        const modalReference: NgbModalRef
            = this.modalService.open(AddLanguageModalComponent, { keyboard: false });
        modalReference.componentInstance.languages = this.getUnselectedLanguages();

        try {
            this.selectedLanguages.push(await modalReference.result);
        } catch (err) {
            // Modal has been canceled
        }
    }


    private getUnselectedLanguages(): { [languageCode: string]: string } {

        const result = clone(this.languages);

        Object.keys(this.languages).forEach(languageCode => {
            if (this.selectedLanguages.includes(languageCode)) delete result[languageCode];
        });

        return result;
    }


    private static getAvailableLanguages(): { [languageCode: string]: string } {

        const languages = cldr.extractLanguageDisplayNames(Settings.getLocale());

        Object.keys(languages).forEach(languageCode => {
            if (languageCode.length !== 2 ) delete languages[languageCode];
        });

        return languages;
    }
}
