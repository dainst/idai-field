import { Component, OnInit } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { isEmpty  } from 'tsfun';
import {
    CategoryForm,
    I18N,
    KOREAN_FIELDWORK_PROJECT_LANGUAGES,
    KOREAN_FIELDWORK_TEMPLATE_ID,
    Labels,
    ProjectConfiguration,
    Template
} from 'idai-field-core';
import { ProjectIdentifierValidation } from '../../model/project-identifier-validation';
import { ConfigurationIndex } from '../../services/configuration/index/configuration-index';
import { Language, Languages } from '../../services/languages';
import { reloadAndSwitchToHomeRoute } from '../../services/reload';
import { SettingsProvider } from '../../services/settings/settings-provider';
import {
    KoreanFieldworkProjectSetup,
    SettingsService
} from '../../services/settings/settings-service';
import { M } from '../messages/m';
import { Messages } from '../messages/messages';
import { ProjectIdentifierValidatorMessagesConversion } from '../messages/project-identifier-validator-messages-conversion';
import { MsgWithParams } from '../messages/msg-with-params';
import { Menus } from '../../services/menus';
import { MenuContext } from '../../services/menu-context';
import {
    KOREAN_FIELDWORK_INVESTIGATION_MODES,
    isKoreanFieldworkProjectSetupFilledIn
} from '../../util/korean-fieldwork-project-setup';

import { electronRemote as remote } from 'src/app/electron/electron';


@Component({
    selector: 'create-project-modal',
    templateUrl: './create-project-modal.html',
    host: {
        '(window:keydown)': 'onKeyDown($event)',
    },
    standalone: false
})

/**
 * @author Thomas Kleinke
 * @author Daniel de Oliveira
 */
export class CreateProjectModalComponent implements OnInit {

    public projectIdentifier: string
    public projectName: I18N.String|undefined;
    public koreanInvestigationMode: string = '';
    public koreanBoundarySummary: string = '';
    public selectedTemplate: Template;
    public selectedLanguages: string[];
    public selectedLanguageObjects: Array<Language>;
    public creating: boolean = false;
    public modalOpened: boolean = false;
    public page: number = 0;

    public languages: { [languageCode: string]: Language };
    public readonly koreanInvestigationModes = KOREAN_FIELDWORK_INVESTIGATION_MODES;
    public readonly koreanFieldworkStartSteps: string[] = [
        '프로젝트 기본 조사 방식을 정합니다.',
        '조사 경계 기준을 문장으로 남깁니다.',
        '프로젝트 생성 후 지도에서 경계를 그리거나 가져옵니다.'
    ];


    constructor(public activeModal: NgbActiveModal,
                private settingsService: SettingsService,
                private settingsProvider: SettingsProvider,
                private messages: Messages,
                private configurationIndex: ConfigurationIndex,
                private projectConfiguration: ProjectConfiguration,
                private labels: Labels,
                private menuService: Menus) {}

    
    public getTemplateNames = () => Object.keys(this.configurationIndex.getTemplates());

    public getTemplate = (templateName: string) => this.configurationIndex.getTemplates()[templateName];

    public getTemplateLabel = (templateName: string) => this.labels.get(this.getTemplate(templateName));

    public getTemplateDescription = (templateName: string) =>
        this.labels.getDescription(this.getTemplate(templateName));

    public getSelectableLanguages = () => {

        if (!this.isKoreanFieldworkTemplate()) return this.languages;

        return this.languages?.ko
            ? { ko: this.languages.ko }
            : {};
    }

    public getIdentifierMaxLength = () => ProjectIdentifierValidation.PROJECT_IDENTIFIER_MAX_LENGTH;

    public goBack = () => this.page--;

    public resetProjectName = () => this.projectName = undefined;


    ngOnInit() {

        this.selectedTemplate = this.getTemplate(this.getTemplateNames()[0]);
        this.selectedLanguages = [];
        this.languages = Languages.getAvailableLanguages();
    }


    public async onKeyDown(event: KeyboardEvent) {

        if (event.key === 'Escape' && !this.modalOpened
                && [MenuContext.MODAL, MenuContext.CONFIGURATION_MODAL].includes(this.menuService.getContext())) {
            this.activeModal.dismiss('cancel');
        }
    }


    public onLanguagesChanged() {

        if (this.isKoreanFieldworkTemplate()) {
            this.applyTemplateDefaults();
            return;
        }

        this.selectedLanguageObjects = this.selectedLanguages.map(languageCode => this.languages[languageCode]);
        this.resetProjectName();
    }


    public selectTemplate(templateName: string) {

        this.selectedTemplate = this.getTemplate(templateName);
        this.applyTemplateDefaults();
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
                return !!this.projectIdentifier
                    && !this.creating
                    && this.isKoreanFieldworkSetupFilledIn();
        }
    }


    public async confirm() {
        
        if (!this.isFilledIn()) return;

        if (this.page < 2) {
            if (this.page === 0) this.applyTemplateDefaults();
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
                remote.getGlobal('switches') && remote.getGlobal('switches').destroy_before_create,
                this.getKoreanFieldworkProjectSetup()
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

        if (!this.isKoreanFieldworkSetupFilledIn()) {
            return [M.PROJECT_CREATION_ERROR_KOREAN_FIELDWORK_SETUP];
        }
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


    private applyTemplateDefaults() {

        if (!this.isKoreanFieldworkTemplate()) return;

        this.selectedLanguages = KOREAN_FIELDWORK_PROJECT_LANGUAGES.slice();
        this.selectedLanguageObjects = this.selectedLanguages.map(languageCode => this.languages[languageCode]);
    }


    public isKoreanFieldworkTemplate = () => this.selectedTemplate?.name === KOREAN_FIELDWORK_TEMPLATE_ID;


    public getKoreanFieldworkSetupStatus(): string {

        if (!this.koreanInvestigationMode?.trim()) return '조사 방식을 선택해야 프로젝트를 만들 수 있습니다.';
        if (!this.koreanBoundarySummary?.trim()) return '조사 경계를 입력해야 프로젝트를 만들 수 있습니다.';

        return '프로젝트 생성 후 지도에서 조사 경계를 그리거나 가져와 확정하세요.';
    }


    private isKoreanFieldworkSetupFilledIn(): boolean {

        return !this.isKoreanFieldworkTemplate()
            || isKoreanFieldworkProjectSetupFilledIn(this.koreanInvestigationMode, this.koreanBoundarySummary);
    }


    private getKoreanFieldworkProjectSetup(): KoreanFieldworkProjectSetup|undefined {

        if (!this.isKoreanFieldworkTemplate()) return undefined;

        return {
            projectInvestigationMode: this.koreanInvestigationMode.trim(),
            projectBoundarySetupState: 'draftBoundary',
            projectBoundarySummary: this.koreanBoundarySummary.trim()
        };
    }
}
