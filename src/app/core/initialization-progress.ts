import {Injectable} from '@angular/core';
import {AngularUtility} from '../angular/angular-utility';
import {INITIALIZATION_MESSAGES} from './initialization-messages';
import {reload} from './common/reload';
import {SettingsService} from './settings/settings-service';


type InitializationPhase =
     'settingUpServer'
    |'loadingSettings'
    |'settingUpDatabase'
    |'loadingSampleObjects'
    |'loadingConfiguration'
    |'loadingDocuments'
    |'indexingDocuments';


@Injectable()
/**
 * @author Thomas Kleinke
 */
export class InitializationProgress {

    private phase: InitializationPhase = 'settingUpServer';
    private documentsToIndex: number;
    private indexedDocuments: number = 0;
    private locale: string = 'en';
    private error: boolean = false;


    constructor(private settingsService: SettingsService) {}


    public async setPhase(phase: InitializationPhase) {

        this.phase = phase;
        await this.updateProgressBar();
    }


    public setDocumentsToIndex(documentsToIndex: number) {

        this.documentsToIndex = documentsToIndex;
    }


    public async setIndexedDocuments(indexedDocuments: number) {

        this.indexedDocuments = indexedDocuments;
        await this.updateProgressBar();
    }


    public async setEnvironment(projectName: string, locale: string) {

        this.locale = locale;
        this.updateInitializationInfo(projectName);
    }


    public async setError(errorMsgKey: string) {

        this.error = true;

        InitializationProgress.setElementClasses(
            'initialization-progress-bar',
            ['bg-danger', 'progress-bar-striped', 'progress-bar-animated']
        );

        InitializationProgress.setElementText(
            'initialization-info-message-1',
            INITIALIZATION_MESSAGES[this.locale][errorMsgKey]
        );
        InitializationProgress.setElementText('initialization-info-project-name', '');
        InitializationProgress.setElementText('initialization-info-message-2', '');

        this.showReloadButton();

        await this.updateProgressBar();
    }


    private async updateProgressBar() {

        const element: HTMLElement = document.getElementById('initialization-progress-bar');

        if (element) {
            element.style.width = this.getProgress() + '%';
            await AngularUtility.refresh();
        }
    }


    private async updateInitializationInfo(projectName: string) {

        InitializationProgress.setElementText(
            'initialization-info-message-1',
            INITIALIZATION_MESSAGES[this.locale]['loading1']
        );

        InitializationProgress.setElementText(
            'initialization-info-project-name',
            projectName
        );

        InitializationProgress.setElementText(
            'initialization-info-message-2',
            INITIALIZATION_MESSAGES[this.locale]['loading2']
        );

        await AngularUtility.refresh();
    }


    private showReloadButton() {

        const element: HTMLElement = document.getElementById('reload-button');
        if (element) {
            element.style.display = 'block';
            element.innerText = INITIALIZATION_MESSAGES[this.locale]['loadTestProject'];
            element.onclick = async () => {
                await this.settingsService.selectProject('test');
                reload();
            }
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
                return 20;
            case 'loadingSampleObjects':
                return 25;
            case 'loadingConfiguration':
                return 35;
            case 'loadingDocuments':
                return this.documentsToIndex - this.indexedDocuments < 1000 ? 100 : 45;
            case 'indexingDocuments':
                return this.documentsToIndex - this.indexedDocuments < 1000 ? 100 : 50 + this.getIndexingProgress();
        }
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
