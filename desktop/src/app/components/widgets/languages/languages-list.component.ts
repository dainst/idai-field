import { Component, Input, Output, EventEmitter } from '@angular/core';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { Language, Languages } from '../../../services/languages';
import { LanguagePickerModalComponent } from './language-picker-modal.component';
import { Menus } from '../../../services/menus';
import { MenuContext } from '../../../services/menu-context';


@Component({
    selector: 'languages-list',
    templateUrl: './languages-list.html',
    standalone: false
})
/**
 * @author Thomas Kleinke
 */
export class LanguagesListComponent {

    @Input() languages: { [languageCode: string]: Language };
    @Input() selectedLanguages: string[];

    @Output() onModalToggled: EventEmitter<boolean> = new EventEmitter<boolean>();
    @Output() onChanged: EventEmitter<void> = new EventEmitter<void>();


    constructor(private modalService: NgbModal,
                private menuService: Menus) {}


    public showNoLanguagesSelectedMessage = () => this.selectedLanguages && this.selectedLanguages.length === 0;


    public async addLanguage() {

        this.onModalToggled.emit(true);

        const currentMenuContext: MenuContext = this.menuService.getContext();

        this.menuService.setContext(
            currentMenuContext.includes('configuration')
                ? MenuContext.CONFIGURATION_MODAL
                : MenuContext.MODAL
        );

        const modalReference: NgbModalRef = this.modalService.open(LanguagePickerModalComponent, { animation: false });
        modalReference.componentInstance.languages = Languages.getUnselectedLanguages(
            this.languages, this.selectedLanguages
        );
        modalReference.componentInstance.initialize();

        try {
            this.selectedLanguages.push(await modalReference.result);
            this.onChanged.emit();
        } catch (err) {
            // Modal has been canceled
        }

        this.menuService.setContext(currentMenuContext);

        this.onModalToggled.emit(false);
    }


    public removeLanguage(languageToRemove: string) {

        const index = this.selectedLanguages.indexOf(languageToRemove, 0);
        if (index !== -1) this.selectedLanguages.splice(index, 1);
        
        this.onChanged.emit();
    }
}
