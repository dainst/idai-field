import {Injectable} from '@angular/core';

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


    public getSelectedTrenchId(): string {

        return this.selectedTrenchId;
    }


    public setSelectedTrenchId(selectedTrenchId: string) {

        this.selectedTrenchId = selectedTrenchId;
    }


    public getLineMode(): MatrixLineMode {

        return this.lineMode;
    }


    public setLineMode(lineMode: MatrixLineMode) {

        this.lineMode = lineMode;
    }


    public getClusterMode(): MatrixClusterMode {

        return this.clusterMode;
    }


    public setClusterMode(clusterMode: MatrixClusterMode) {

        this.clusterMode = clusterMode;
    }
}