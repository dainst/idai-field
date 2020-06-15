import {AngularUtility} from '../angular/angular-utility';

type InitializationPhase =
     'settingUpServer'
    |'loadingSettings'
    |'settingUpDatabase'
    |'loadingSampleObjects'
    |'loadingConfiguration'
    |'loadingDocuments'
    |'indexingDocuments';


/**
 * @author Thomas Kleinke
 */
export class InitializationProgress {

    private phase: InitializationPhase = 'settingUpServer';
    private documentsToIndex: number;
    private indexedDocuments: number = 0;


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


    private async updateProgressBar() {

        const element: HTMLElement = document.getElementById('initialization-progress-bar');

        if (element) {
            element.style.width = this.getProgress() + '%';
            await AngularUtility.refresh();
        }
    }


    private getProgress(): number {

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
}
