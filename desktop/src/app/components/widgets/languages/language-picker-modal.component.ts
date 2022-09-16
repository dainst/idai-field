import { Component } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { Language, Languages } from '../../../services/languages';


@Component({
    templateUrl: './language-picker-modal.html'
})
/**
 * @author Thomas Kleinke
 */
export class LanguagePickerModalComponent {

    public languages: { [languageCode: string]: Language };


    constructor(public activeModal: NgbActiveModal) {}


    public getLanguageCodes = () => Languages.getSortedLanguageCodes(this.languages);

    public getLabel = (languageCode: string) => this.languages[languageCode].label;

    public select = (languageCode: string) => this.activeModal.close(languageCode);
}
