import { Component, OnInit } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { isEmpty  } from 'tsfun';
import { Labels, Template, I18N, ProjectConfiguration, CategoryForm } from 'idai-field-core';
import { ProjectIdentifierValidation } from '../../model/project-identifier-validation';
import { ConfigurationIndex } from '../../services/configuration/index/configuration-index';
import { Language, Languages } from '../../services/languages';
import { reloadAndSwitchToHomeRoute } from '../../services/reload';
import { SettingsProvider } from '../../services/settings/settings-provider';
import { SettingsService } from '../../services/settings/settings-service';
import { M } from '../messages/m';
import { Messages } from '../messages/messages';
import { ProjectIdentifierValidatorMessagesConversion } from '../messages/project-identifier-validator-messages-conversion';
import { MsgWithParams } from '../messages/msg-with-params';

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

    public projectIdentifier: string
    public projectName: I18N.String|undefined;
    public selectedTemplate: Template;
    public selectedLanguages: string[];
    public creating: boolean = false;
    public modalOpened: boolean = false;
    public page: number = 0;

    public languages: { [languageCode: string]: Language };


    constructor(public activeModal: NgbActiveModal,
                private settingsService: SettingsService,
                private settingsProvider: SettingsProvider,
                private messages: Messages,
                private configurationIndex: ConfigurationIndex,
                private projectConfiguration: ProjectConfiguration,
                private labels: Labels) {}

    
    public getTemplateNames = () => Object.keys(this.configurationIndex.getTemplates());

    public getTemplate = (templateName: string) => this.configurationIndex.getTemplates()[templateName];

    public getTemplateLabel = (templateName: string) => this.labels.get(this.getTemplate(templateName));

    public getTemplateDescription = (templateName: string) =>
        this.labels.getDescription(this.getTemplate(templateName));

    public getSelectedLanguageObjects = () => this.selectedLanguages.map(languageCode => this.languages[languageCode]);

    public getIdentifierMaxLength = () => ProjectIdentifierValidation.PROJECT_IDENTIFIER_MAX_LENGTH;

    public goBack = () => this.page--;

    public resetProjectName = () => this.projectName = undefined;


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


    public updateProjectName(newProjectName: I18N.String) {

        this.projectName = newProjectName && !isEmpty(newProjectName)
            ? newProjectName
            : undefined;
    }


    public isFilledIn(): boolean {

        switch (this.page) {
            case 0:
                return true;
            case 1:
                return this.selectedLanguages && this.selectedLanguages.length > 0;
            case 2:
                return this.projectIdentifier && !this.creating;
        }
    }


    public async confirm() {
        
        if (!this.isFilledIn()) return;

        if (this.page < 2) {
            this.page++;
        } else {
            await this.createProject();
        }
    }


    public async createProject() {

        if (this.creating) return;
        
        this.creating = true;

        const validationErrorMessage: MsgWithParams|undefined = this.validate();
        if (validationErrorMessage) {
            this.creating = false;
            return this.messages.add(validationErrorMessage);
        }

        this.validateProjectName();

        try {
            await this.settingsService.createProject(
                this.projectIdentifier,
                this.selectedTemplate,
                this.selectedLanguages,
                this.projectName,
                remote.getGlobal('switches') && remote.getGlobal('switches').destroy_before_create
            );
            reloadAndSwitchToHomeRoute();
        } catch (msgWithParams) {
            this.messages.add(msgWithParams);
            this.creating = false;
        }
    }


    public getNameMaxLength(): number {
        
        return CategoryForm.getField(this.projectConfiguration.getCategory('Project'), 'shortName')
            .maxCharacters;
    }


    private validate(): MsgWithParams|undefined {

        let validationErrorMessage: MsgWithParams|undefined = ProjectIdentifierValidatorMessagesConversion.convert(
            ProjectIdentifierValidation.validate(this.projectIdentifier, this.settingsProvider.getSettings().dbs)
        );
        if (validationErrorMessage) return validationErrorMessage;

        if (this.selectedLanguages.length === 0) return [M.CONFIGURATION_ERROR_NO_PROJECT_LANGUAGES];

        validationErrorMessage = this.validateProjectName();
        if (validationErrorMessage) return validationErrorMessage;
    }


    private validateProjectName(): MsgWithParams|undefined {

        if (!this.projectName) return;

        const maxLength: number = this.getNameMaxLength();

        for (let language of Object.keys(this.projectName)) {
            const name = this.projectName[language];
            if (name.length > maxLength) {
                return [
                    M.PROJECT_CREATION_ERROR_NAME_LENGTH,
                    this.languages[language].label,
                    (name.length - maxLength).toString()
                ];
            }
        }
    } 
}
