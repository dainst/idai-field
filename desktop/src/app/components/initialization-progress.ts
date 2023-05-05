import { Injectable } from '@angular/core';
import { isUndefinedOrEmpty, not, rest, isArray } from 'tsfun';
import { AngularUtility } from '../angular/angular-utility';
import { getMessage } from './initialization-messages';
import { reload } from '../services/reload';
import { SettingsService } from '../services/settings/settings-service';


type InitializationPhase =
     'settingUpServer'
    |'loadingSettings'
    |'settingUpDatabase'
    |'loadingSampleObjects'
    |'processingImages'
    |'loadingConfiguration'
    |'loadingDocuments'
    |'indexingDocuments';


@Injectable()
/**
 * @author Thomas Kleinke
 */
export class InitializationProgress {

    private phase: InitializationPhase = 'settingUpServer';
    private imagesToProcess: number;
    private processedImages: number = 0;
    private documentsToIndex: number;
    private indexedDocuments: number = 0;
    private locale: string = 'en';
    private error: boolean = false;


    constructor(private settingsService: SettingsService) {}


    public async setPhase(phase: InitializationPhase) {

        this.phase = phase;
        await this.updateProgressBar();
        this.updateInitializationDetailInfo(phase, 5000);
    }


    public setImagesToProcess(imagesToProcess: number) {

        this.imagesToProcess = imagesToProcess;
    }


    public async setProcessedImages(processedImages: number) {

        this.processedImages = processedImages;
        await this.updateProgressBar();
    }


    public setDocumentsToIndex(documentsToIndex: number) {

        this.documentsToIndex = documentsToIndex;
    }


    public async setIndexedDocuments(indexedDocuments: number) {

        this.indexedDocuments = indexedDocuments;
        await this.updateProgressBar();
    }


    public async setLocale(locale: string) {

        this.locale = locale;
    }


    public async setProjectName(projectName: string, projectIdentifier?: string) {

        this.updateInitializationInfo(projectName, projectIdentifier);
    }


    public async setError(errorMsgKey: string, msgsWithParams?: any[]) {

        if (msgsWithParams) console.error(msgsWithParams);

        this.error = true;

        InitializationProgress.setElementClasses(
            'initialization-progress-bar',
            ['bg-danger', 'progress-bar-striped', 'progress-bar-animated']
        );

        InitializationProgress.setElementText(
            'initialization-info-message-1',
            getMessage(errorMsgKey, this.locale)
        );
        InitializationProgress.setElementText('initialization-info-project-name', '');
        InitializationProgress.setElementText('initialization-info-project-identifier', '');
        InitializationProgress.setElementText('initialization-info-message-2', '');
        InitializationProgress.setElementText('initialization-detail-info', '');

        const errorMessages: string[] = this.getErrorMessages(msgsWithParams);
        if (errorMessages.length > 0) this.showErrorMessages(errorMessages);

        this.showReloadButton(
            errorMessages.length > 0,
            errorMsgKey !== 'alreadyOpenError'
        );

        await this.updateProgressBar();
    }


    private getErrorMessages(msgsWithParams: any[]|undefined): string[] {

        if (!msgsWithParams || !isArray(msgsWithParams)) return [];

        return msgsWithParams.map((msgWithParams: string[]) => {
            return isArray(msgWithParams)
                ? getMessage(msgWithParams[0], this.locale, rest(msgWithParams))
                : undefined;
        }).filter(not(isUndefinedOrEmpty));
    }


    private showErrorMessages(errorMessages: string[]) {

        const containerElement: HTMLElement = document.getElementById('error-messages-container');
        containerElement.style.display = 'block';
        containerElement.style.opacity = '1';

        const headerElement: HTMLElement = document.getElementById('error-messages-header');
        headerElement.innerText = getMessage(
            errorMessages.length === 1 ? 'oneConfigurationError' : 'multipleConfigurationErrors',
            this.locale
        );

        const bodyElement: HTMLElement = document.getElementById('error-messages-body');
        bodyElement.innerText = errorMessages.join('\n');

        InitializationProgress.setElementClasses(
            'initialization',
            ['with-error-messages']
        );
    }


    private async updateProgressBar() {

        const element: HTMLElement = document.getElementById('initialization-progress-bar');

        if (element) {
            element.style.width = this.getProgress() + '%';
            await AngularUtility.refresh();
        }
    }


    private async updateInitializationInfo(projectName: string, projectIdentifier?: string) {

        InitializationProgress.setElementText(
            'initialization-info-message-1',
            getMessage('loading1', this.locale)
        );

        InitializationProgress.setElementText(
            'initialization-info-project-name',
            projectName
        );

        if (projectIdentifier && projectName !== projectIdentifier) {
            InitializationProgress.setElementText(
                'initialization-info-project-identifier',
                '(' + projectIdentifier + ')'
            );
        }

        InitializationProgress.setElementText(
            'initialization-info-message-2',
            getMessage('loading2', this.locale)
        );

        await AngularUtility.refresh();
    }


    private updateInitializationDetailInfo(phase: InitializationPhase, delay: number) {

        const message: string = getMessage('phase/' + this.phase, this.locale);

        if (message) {
            setTimeout(() => {
                if (this.phase !== phase || this.error) return;
                InitializationProgress.setElementText(
                    'initialization-detail-info',
                    message
                );
            }, delay);
        } else {
            InitializationProgress.setElementText('initialization-detail-info', '');
        }
    }


    private showReloadButton(withErrorMessages: boolean, loadTestProject: boolean) {

        const element: HTMLElement = document.getElementById('reload-button');
        if (element) {
            element.style.opacity = '1';
            if (['settingUpServer', 'loadingSettings', 'settingUpDatabase'].includes(this.phase)) {
                element.style.animation = '1.5s ease-in-out init-fade-in';
                element.style.transition = 'none';
            }
            
            element.innerText = getMessage(
                loadTestProject
                    ? 'loadTestProject'
                    : 'restart',
                this.locale
            );
            element.onclick = async () => {
                if (loadTestProject) await this.settingsService.selectProject('test');
                reload();
            };
            if (withErrorMessages) element.classList.add('with-error-messages');
        }
    }


    private getProgress(): number {

        if (this.error) return 100;

        switch(this.phase) {
            case 'settingUpServer':
                return 0;
            case 'loadingSettings':
                return 5;
            case 'settingUpDatabase':
                return 15;
            case 'loadingSampleObjects':
                return 20;
            case 'processingImages':
                return 25 + this.getImageProcessingProgress();
            case 'loadingConfiguration':
                return 35;
            case 'loadingDocuments':
                return this.documentsToIndex - this.indexedDocuments < 1000 ? 100 : 45;
            case 'indexingDocuments':
                return this.documentsToIndex - this.indexedDocuments < 1000 ? 100 : 50 + this.getIndexingProgress();
        }
    }


    private getImageProcessingProgress(): number {

        return this.processedImages > 0
            ? Math.round(10 * (this.processedImages / this.imagesToProcess))
            : 0;
    }


    private getIndexingProgress(): number {

        return this.indexedDocuments > 0
            ? Math.round(50 * (this.indexedDocuments / this.documentsToIndex))
            : 0;
    }


    private static setElementText(elementId: string, text: string) {

        const element: HTMLElement = document.getElementById(elementId);
        if (element) element.innerText = text;
    }


    private static setElementClasses(elementId: string, classNames: string[]) {

        const element: HTMLElement = document.getElementById(elementId);
        if (element) {
            classNames.forEach((className: string) => element.classList.add(className));
        }
    }
}
