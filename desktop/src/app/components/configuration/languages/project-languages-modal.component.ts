import { Component } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { clone, sameset } from 'tsfun';
import { ConfigurationDocument } from 'idai-field-core';
import { Language, Languages } from '../../../services/languages';
import { Messages } from '../../messages/messages';
import { M } from '../../messages/m';


@Component({
    templateUrl: './project-languages-modal.html',
    host: {
        '(window:keydown)': 'onKeyDown($event)',
    },
    standalone: false
})

/**
 * @author Thomas Kleinke
 */
export class ProjectLanguagesModalComponent {

    public configurationDocument: ConfigurationDocument;
    public applyChanges: (configurationDocument: ConfigurationDocument,
        reindexConfiguration?: boolean) => Promise<void>;

    public languages: { [languageCode: string]: Language };
    public selectedLanguages: string[];
    public clonedSelectedLanguages: string[];
    public modalOpened: boolean = false;

    
    public isConfirmButtonEnabled = () => this.hasChanged() && this.clonedSelectedLanguages
        && this.clonedSelectedLanguages.length > 0;


    constructor(public activeModal: NgbActiveModal,
                private messages: Messages) {}


    public async onKeyDown(event: KeyboardEvent) {

        if (event.key === 'Escape' && !this.modalOpened) this.activeModal.dismiss('cancel');
    }


    public initialize() {

        this.languages = Languages.getAvailableLanguages();
        this.selectedLanguages = this.configurationDocument.resource.projectLanguages ?? [];
        this.clonedSelectedLanguages = clone(this.selectedLanguages);
    }


    public async apply() {

        if (!this.hasChanged()) return;

        if (this.clonedSelectedLanguages.length === 0) {
            return this.messages.add([M.CONFIGURATION_ERROR_NO_PROJECT_LANGUAGES]);
        }

        this.configurationDocument.resource.projectLanguages = this.clonedSelectedLanguages;
        await this.applyChanges(this.configurationDocument);
        
        this.activeModal.close();
    }


    public cancel() {

        this.activeModal.dismiss('cancel');
    }


    public hasChanged() {

        return this.selectedLanguages
            && this.clonedSelectedLanguages
            &&  !sameset(this.selectedLanguages)(this.clonedSelectedLanguages);
    }
}
