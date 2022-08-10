import { Component } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { clone, sameset } from 'tsfun';
import { ConfigurationDocument } from 'idai-field-core';
import { Language, Languages } from '../../../services/languages';
import { ApplyChangesResult } from '../configuration.component';


@Component({
    templateUrl: './project-languages-modal.html',
    host: {
        '(window:keydown)': 'onKeyDown($event)',
    }
})

/**
 * @author Thomas Kleinke
 */
export class ProjectLanguagesModalComponent {

    public configurationDocument: ConfigurationDocument;
    public applyChanges: (configurationDocument: ConfigurationDocument,
        reindexConfiguration?: boolean) => Promise<ApplyChangesResult>;

    public languages: { [languageCode: string]: Language };
    public selectedLanguages: string[];
    public clonedSelectedLanguages: string[];


    constructor(public activeModal: NgbActiveModal) {}


    public async onKeyDown(event: KeyboardEvent) {

        if (event.key === 'Escape') this.activeModal.dismiss('cancel');
    }


    public initialize() {

        this.languages = Languages.getAvailableLanguages();
        this.selectedLanguages = this.configurationDocument.resource.projectLanguages ?? [];
        this.clonedSelectedLanguages = clone(this.selectedLanguages);

        console.log('l:', this.languages);
    }


    public async apply() {

        if (!this.hasChanged()) return;

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
