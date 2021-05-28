import { Component } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { Language, LanguagesUtil } from '../../core/util/languages-util';


@Component({
    templateUrl: './language-picker-modal.html'
})
/**
 * @author Thomas Kleinke
 */
export class LanguagePickerModalComponent {

    public languages: { [languageCode: string]: Language };


    constructor(public activeModal: NgbActiveModal) {}


    public getLanguageCodes = () => LanguagesUtil.getSortedLanguageCodes(this.languages);

    public getLabel = (languageCode: string) => this.languages[languageCode].label;

    public select = (languageCode: string) => this.activeModal.close(languageCode);
}
