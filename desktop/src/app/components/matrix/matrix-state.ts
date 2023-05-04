import { Injectable } from '@angular/core';
import { StateSerializer } from '../../services/state-serializer';


export type MatrixRelationsMode = 'temporal'|'spatial';
export type MatrixLineMode = 'ortho'|'curved';
export type MatrixClusterMode = 'periods'|'none';


/**
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 */
@Injectable()
export class MatrixState {

    private selectedOperationId: string = 't2'; // this is the test projects second trench. if it does not exist in other projects, the app handles that
    private relationsMode: MatrixRelationsMode = 'temporal';
    private lineMode: MatrixLineMode = 'ortho';
    private clusterMode: MatrixClusterMode = 'periods';


    constructor(private stateSerializer: StateSerializer) {}


    public getSelectedOperationId(): string {

        return this.selectedOperationId;
    }


    public setSelectedOperationId(selectedOperationId: string) {

        this.selectedOperationId = selectedOperationId;
    }


    public getRelationsMode(): MatrixRelationsMode {

        return this.relationsMode;
    }


    public async setRelationsMode(relationsMode: MatrixRelationsMode) {

        this.relationsMode = relationsMode;
        await this.store();
    }


    public getLineMode(): MatrixLineMode {

        return this.lineMode;
    }


    public async setLineMode(lineMode: MatrixLineMode) {

        this.lineMode = lineMode;
        await this.store();
    }


    public getClusterMode(): MatrixClusterMode {

        return this.clusterMode;
    }


    public async setClusterMode(clusterMode: MatrixClusterMode) {

        this.clusterMode = clusterMode;
        await this.store();
    }


    public async load() {

        const loadedState: any = await this.stateSerializer.load('matrix-state');

        if (loadedState.relationsMode) this.relationsMode = loadedState.relationsMode;
        if (loadedState.lineMode) this.lineMode = loadedState.lineMode;
        if (loadedState.clusterMode) this.clusterMode = loadedState.clusterMode;
    }


    public async store() {

        await this.stateSerializer.store(this.createSerializationObject(), 'matrix-state');
    }


    private createSerializationObject(): any {

        return {
            relationsMode: this.relationsMode,
            lineMode: this.lineMode,
            clusterMode: this.clusterMode
        };
    }
}
