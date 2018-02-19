import {Injectable} from '@angular/core';
import {Observable} from 'rxjs/Observable';
import {Observer} from 'rxjs/Observer';


export interface MeshLoadingProgressState {

    loadingProgress: number;
    adjustingProgress: number;
}


@Injectable()
/**
 * @author Thomas Kleinke
 */
export class MeshLoadingProgress {

    private progressStates: { [meshId: string]: MeshLoadingProgressState } = {};
    private observers: Array<Observer<number>> = [];


    public progressNotifications(): Observable<number> {

        return new Observable<number>((observer: Observer<any>) => {
            this.observers.push(observer);
        });
    }


    public setLoadingProgress(meshId: string, loaded: number, total: number) {

        if (!this.progressStates[meshId]) this.progressStates[meshId] = {
            loadingProgress: 0,
            adjustingProgress: 0
        };

        this.progressStates[meshId].loadingProgress = (loaded / total) * 100;

        this.notifyObservers();
    }


    public setAdjustingProgress(meshId: string, adjusted: number, total: number) {

        this.progressStates[meshId].adjustingProgress = (adjusted / total) * 100;

        this.notifyObservers();
    }


    public reset() {

        this.progressStates = {};
        this.notifyObservers();
    }


    private getTotalProgress(): number {

        const meshIds: string[] = Object.keys(this.progressStates);

        if (meshIds.length == 0) return -1;

        const progressSum: number = meshIds.reduce((value, meshId) => {
            return value + this.getMeshProgress(meshId);
        }, 0);

        return Math.round(progressSum / meshIds.length);
    }


    private getMeshProgress(meshId: string): number {

        const progressState: MeshLoadingProgressState|undefined = this.progressStates[meshId];

        if (!progressState) return 0;

        return Math.round((progressState.loadingProgress + progressState.adjustingProgress) / 2);
    }


    private notifyObservers() {

        this.observers.forEach(observer => observer.next(this.getTotalProgress()));
    }
}