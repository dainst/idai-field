import { Injectable } from '@angular/core';
import { StateSerializer } from './state-serializer';


/**
 * @author Thomas Kleinke
 */
@Injectable()
export class AppState {

    private codeScannerCameraId: string|undefined;


    constructor(private stateSerializer: StateSerializer) {}


    public getCodeScannerCameraId(): string {

        return this.codeScannerCameraId;
    }


    public async setCodeScannerCameraId(codeScannerCameraId: string) {

        this.codeScannerCameraId = codeScannerCameraId;
        await this.store();
    }


    public async load() {

        const loadedState: any = await this.stateSerializer.load('app-state');

        if (loadedState.codeScannerCameraId) this.codeScannerCameraId = loadedState.codeScannerCameraId;
    }


    public async store() {

        await this.stateSerializer.store(this.createSerializationObject(), 'app-state');
    }


    private createSerializationObject(): any {

        return this.codeScannerCameraId
            ? {
                codeScannerCameraId: this.codeScannerCameraId
            }
            : {};
    }
}
