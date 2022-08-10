import { Component, Input } from '@angular/core';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { Language, Languages } from '../../../services/languages';
import { LanguagePickerModalComponent } from './language-picker-modal.component';


@Component({
    selector: 'languages-list',
    templateUrl: './languages-list.html'
})
/**
 * @author Thomas Kleinke
 */
export class LanguagesListComponent {

    @Input() languages: { [languageCode: string]: Language };
    @Input() selectedLanguages: string[];


    constructor(private modalService: NgbModal) {}


    public async addLanguage() {

        console.log('l2:', this.languages);

        const modalReference: NgbModalRef = this.modalService.open(LanguagePickerModalComponent);
        modalReference.componentInstance.languages = Languages.getUnselectedLanguages(
            this.languages, this.selectedLanguages
        );

        try {
            this.selectedLanguages.push(await modalReference.result);
        } catch (err) {
            // Modal has been canceled
        }
    }


    public removeLanguage(languageToRemove: string) {

        const index = this.selectedLanguages.indexOf(languageToRemove, 0);
        if (index !== -1) this.selectedLanguages.splice(index, 1);
    }
}
