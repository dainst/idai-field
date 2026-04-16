import { Injectable } from '@angular/core';
import { Observable, Observer } from 'rxjs';
import { ObserverUtil } from 'idai-field-core';
import { StateSerializer } from './state-serializer';

const path = window.require('path');
const fs = window.require('fs');


export type DataTransferType = 'none'|'import'|'fileImport'|'export';

export type DataTransferNotification = {
    previousDataTransfer: DataTransferType;
    newDataTransfer: DataTransferType;
};


/**
 * @author Thomas Kleinke
 */
@Injectable()
export class AppState {

    private codeScannerCameraId: string|undefined;
    private folderPaths: { [context: string]: string };
    
    private runningDataTransfer: DataTransferType = 'none';
    private dataTransferObservers: Array<Observer<DataTransferNotification>> = [];


    constructor(private stateSerializer: StateSerializer) {}


    public dataTransferNotifications = (): Observable<DataTransferNotification> =>
        ObserverUtil.register(this.dataTransferObservers);


    public getRunningDataTransfer(): DataTransferType {

        return this.runningDataTransfer;
    }


    public setRunningDataTransfer(runningDataTransfer: DataTransferType) {

        const notification: DataTransferNotification = {
            previousDataTransfer: this.runningDataTransfer,
            newDataTransfer: runningDataTransfer
        };

        this.runningDataTransfer = runningDataTransfer;

        ObserverUtil.notify(this.dataTransferObservers, notification);
    }


    public getCodeScannerCameraId(): string {

        return this.codeScannerCameraId;
    }


    public async setCodeScannerCameraId(codeScannerCameraId: string) {

        this.codeScannerCameraId = codeScannerCameraId;
        await this.store();
    }

    
    public getFolderPath(context: string): string {

        const folderPath: string = this.folderPaths?.[context];
        return fs.existsSync(folderPath) ? folderPath : undefined;
    }


    public async setFolderPath(fileOrFolderPath: string, context: string, isFolder: boolean = false) {
        
        if (!this.folderPaths) this.folderPaths = {};
        this.folderPaths[context] = isFolder ? fileOrFolderPath : path.dirname(fileOrFolderPath);
        await this.store();
    }


    public async load() {

        const loadedState: any = await this.stateSerializer.load('app-state');

        if (loadedState.codeScannerCameraId) this.codeScannerCameraId = loadedState.codeScannerCameraId;
        if (loadedState.folderPaths) this.folderPaths = loadedState.folderPaths;
    }


    public async store() {

        await this.stateSerializer.store(this.createSerializationObject(), 'app-state');
    }


    private createSerializationObject(): any {

        const result: any = {
            folderPaths: this.folderPaths
        };

        if (this.codeScannerCameraId) {
            result.codeScannerCameraId = this.codeScannerCameraId;
        }

        return result;
    }
}
