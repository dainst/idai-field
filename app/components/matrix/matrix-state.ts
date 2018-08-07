import {Injectable} from '@angular/core';
import {StateSerializer} from '../../common/state-serializer';

export type MatrixLineMode = 'ortho'|'curved';
export type MatrixClusterMode = 'periods'|'none';


/**
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 */
@Injectable()
export class MatrixState {

    private selectedTrenchId: string = 't2'; // this is the test projects second trench. if it does not exist in other projects, the app handles that
    private lineMode: MatrixLineMode = 'ortho';
    private clusterMode: MatrixClusterMode = 'periods';


    constructor(private stateSerializer: StateSerializer) {}


    public getSelectedTrenchId(): string {

        return this.selectedTrenchId;
    }


    public setSelectedTrenchId(selectedTrenchId: string) {

        this.selectedTrenchId = selectedTrenchId;
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

        if (loadedState.lineMode) this.lineMode = loadedState.lineMode;
        if (loadedState.clusterMode) this.clusterMode = loadedState.clusterMode;
    }


    public async store() {

        await this.stateSerializer.store(this.createSerializationObject(), 'matrix-state');
    }


    private createSerializationObject(): any {

        return {
            lineMode: this.lineMode,
            clusterMode: this.clusterMode
        };
    }
}