import { Component, OnInit } from '@angular/core';
import { NgbActiveModal, NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { Labels, Template } from 'idai-field-core';
import { ProjectNameValidation } from '../../model/project-name-validation';
import { ConfigurationIndex } from '../../services/configuration/index/configuration-index';
import { Language, Languages } from '../../services/languages';
import { reloadAndSwitchToHomeRoute } from '../../services/reload';
import { SettingsProvider } from '../../services/settings/settings-provider';
import { SettingsService } from '../../services/settings/settings-service';
import { M } from '../messages/m';
import { Messages } from '../messages/messages';
import { ProjectNameValidatorMsgConversion } from '../messages/project-name-validator-msg-conversion';

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
    public modalOpened: boolean = false;

    public languages: { [languageCode: string]: Language };


    constructor(public activeModal: NgbActiveModal,
                private settingsService: SettingsService,
                private settingsProvider: SettingsProvider,
                private messages: Messages,
                private configurationIndex: ConfigurationIndex,
                private labels: Labels) {}

    
    public getTemplateNames = () => Object.keys(this.configurationIndex.getTemplates());

    public getTemplate = (templateName: string) => this.configurationIndex.getTemplates()[templateName];

    public getTemplateLabel = (templateName: string) => this.labels.get(this.getTemplate(templateName));

    public getTemplateDescription = (templateName: string) =>
        this.labels.getDescription(this.getTemplate(templateName));

    public isConfirmButtonEnabled = () => this.projectName && this.selectedLanguages
        && this.selectedLanguages.length > 0 && !this.creating;


    ngOnInit() {

        this.selectedTemplate = this.getTemplate(this.getTemplateNames()[0]);
        this.selectedLanguages = [];
        this.languages = Languages.getAvailableLanguages();
    }


    public async onKeyDown(event: KeyboardEvent) {

        if (event.key === 'Escape' && !this.modalOpened) this.activeModal.dismiss('cancel');
    }


    public selectTemplate(templateName: string) {

        this.selectedTemplate = this.getTemplate(templateName);
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

        if (this.selectedLanguages.length === 0) {
            this.creating = false;
            return this.messages.add([M.CONFIGURATION_ERROR_NO_PROJECT_LANGUAGES]);
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
