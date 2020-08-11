import {Component, Input} from '@angular/core';
import {CdkDragDrop} from '@angular/cdk/drag-drop';
import {NgbModal, NgbModalRef} from '@ng-bootstrap/ng-bootstrap';
import {clone} from 'tsfun/struct';
import {Settings} from '../../core/settings/settings';
import {LanguagePickerModalComponent} from './language-picker-modal.component';
import {SettingsComponent} from './settings.component';

const cldr = typeof window !== 'undefined' ? window.require('cldr') : require('cldr');
const remote = typeof window !== 'undefined' ? window.require('electron').remote : require('electron').remote;


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
    private readonly mainLanguages: string[];


    constructor(private modalService: NgbModal,
                private settingsComponent: SettingsComponent) {

        this.languages = LanguageSettingsComponent.getAvailableLanguages();
        this.mainLanguages = remote.getGlobal('getMainLanguages')();
    }


    public isMainLanguage = (language: string) => this.mainLanguages.includes(language);


    public getLabel(language: string): string {

        return cldr.extractLanguageDisplayNames(Settings.getLocale())[language];
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

        this.settingsComponent.modalOpened = true;

        const modalReference: NgbModalRef
            = this.modalService.open(LanguagePickerModalComponent);
        modalReference.componentInstance.languages = this.getUnselectedLanguages();

        try {
            this.selectedLanguages.push(await modalReference.result);
        } catch (err) {
            // Modal has been canceled
        } finally {
            this.settingsComponent.modalOpened = false;
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
