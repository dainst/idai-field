import { Component, OnInit } from '@angular/core';
import { NgbActiveModal, NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { Labels, Template } from 'idai-field-core';
import { ProjectNameValidation } from '../../model/project-name-validation';
import { ConfigurationIndex } from '../../services/configuration/index/configuration-index';
import { Language, Languages } from '../../services/languages';
import { MenuContext } from '../../services/menu-context';
import { Menus } from '../../services/menus';
import { reloadAndSwitchToHomeRoute } from '../../services/reload';
import { SettingsProvider } from '../../services/settings/settings-provider';
import { SettingsService } from '../../services/settings/settings-service';
import { Messages } from '../messages/messages';
import { ProjectNameValidatorMsgConversion } from '../messages/project-name-validator-msg-conversion';
import { LanguagePickerModalComponent } from '../widgets/language-picker-modal.component';

const remote = typeof window !== 'undefined' ? window.require('@electron/remote') : undefined;


@Component({
    selector: 'create-project-modal',
    templateUrl: './create-project-modal.html',
    host: {
        '(window:keydown)': 'onKeyDown($event)',
    }
})

/**
 * @author Thomas Kleinke
 * @author Daniel de Oliveira
 */
export class CreateProjectModalComponent implements OnInit {

    public projectName: string;
    public selectedTemplate: Template;
    public selectedLanguages: string[];
    public creating: boolean = false;

    public languages: { [languageCode: string]: Language };


    constructor(public activeModal: NgbActiveModal,
                private settingsService: SettingsService,
                private settingsProvider: SettingsProvider,
                private messages: Messages,
                private configurationIndex: ConfigurationIndex,
                private labels: Labels,
                private menuService: Menus,
                private modalService: NgbModal) {}

    
    public getTemplateNames = () => Object.keys(this.configurationIndex.getTemplates());

    public getTemplate = (templateName: string) => this.configurationIndex.getTemplates()[templateName];

    public getTemplateLabel = (templateName: string) => this.labels.get(this.getTemplate(templateName));

    public getTemplateDescription = (templateName: string) =>
        this.labels.getDescription(this.getTemplate(templateName));


    ngOnInit() {

        this.selectedTemplate = this.getTemplate(this.getTemplateNames()[0]);
        this.selectedLanguages = [];
        this.languages = Languages.getAvailableLanguages();
    }


    public async onKeyDown(event: KeyboardEvent) {

        if (event.key === 'Escape') this.activeModal.dismiss('cancel');
    }


    public selectTemplate(templateName: string) {

        this.selectedTemplate = this.getTemplate(templateName);
    }


    public async addLanguage() {

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

        this.selectedLanguages = this.selectedLanguages.filter(language => language !== languageToRemove);
    }


    public async createProject() {

        if (this.creating) return;
        
        this.creating = true;

        const validationErrorMessage: string[]|undefined = ProjectNameValidatorMsgConversion.convert(
            ProjectNameValidation.validate(this.projectName, this.settingsProvider.getSettings().dbs)
        );
        if (validationErrorMessage) {
            this.creating = false;
            return this.messages.add(validationErrorMessage as any /* TODO any */);
        }

        try {
            await this.settingsService.createProject(
                this.projectName,
                this.selectedTemplate,
                this.selectedLanguages,
                remote.getGlobal('switches') && remote.getGlobal('switches').destroy_before_create
            );
            reloadAndSwitchToHomeRoute();
        } catch (msgWithParams) {
            this.messages.add(msgWithParams);
            this.creating = false;
        }
    }
}
