import { Component, Input, Output, EventEmitter } from '@angular/core';
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

    @Output() onModalToggled: EventEmitter<boolean> = new EventEmitter<boolean>();


    constructor(private modalService: NgbModal) {}


    public showNoLanguagesSelectedMessage = () => this.selectedLanguages && this.selectedLanguages.length === 0;


    public async addLanguage() {

        this.onModalToggled.emit(true);

        const modalReference: NgbModalRef = this.modalService.open(LanguagePickerModalComponent);
        modalReference.componentInstance.languages = Languages.getUnselectedLanguages(
            this.languages, this.selectedLanguages
        );
        modalReference.componentInstance.initialize();

        try {
            this.selectedLanguages.push(await modalReference.result);
        } catch (err) {
            // Modal has been canceled
        }

        this.onModalToggled.emit(false);
    }


    public removeLanguage(languageToRemove: string) {

        const index = this.selectedLanguages.indexOf(languageToRemove, 0);
        if (index !== -1) this.selectedLanguages.splice(index, 1);
    }
}
