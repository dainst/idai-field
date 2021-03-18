import {Component} from '@angular/core';
import {NgbActiveModal} from '@ng-bootstrap/ng-bootstrap';


@Component({
    templateUrl: './language-picker-modal.html'
})
/**
 * @author Thomas Kleinke
 */
export class LanguagePickerModalComponent {

    public languages: { [languageCode: string]: string };


    constructor(public activeModal: NgbActiveModal) {}


    public getLabel = (languageCode: string) => this.languages[languageCode];

    public select = (language: string) => this.activeModal.close(language);


    public getLanguages() {

        return Object.keys(this.languages).sort((a: string, b: string) => {
            return this.getLabel(a).localeCompare(this.getLabel(b));
        });
    }
}
