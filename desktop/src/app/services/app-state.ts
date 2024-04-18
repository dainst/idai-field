import { Injectable } from '@angular/core';
import { StateSerializer } from './state-serializer';

const path = typeof window !== 'undefined' ? window.require('path') : require('path');
const fs = typeof window !== 'undefined' ? window.require('fs') : require('fs');


/**
 * @author Thomas Kleinke
 */
@Injectable()
export class AppState {

    private codeScannerCameraId: string|undefined;
    private folderPaths: { [context: string]: string };


    constructor(private stateSerializer: StateSerializer) {}


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


    public async setFolderPath(fileOrFolderPath: string, context: string) {

        if (!this.folderPaths) this.folderPaths = {};
        this.folderPaths[context] = path.dirname(fileOrFolderPath);
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
            result[this.codeScannerCameraId] = this.codeScannerCameraId;
        }

        return result;
    }
}
