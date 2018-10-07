import {Injectable} from '@angular/core';
import {Observable, Observer} from 'rxjs';


export interface MeshLoadingProgressState {

    loadingProgress: number;
    preparationProgress: number;
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


    public isLoading(): boolean {

        const totalProgress: number = this.getTotalProgress();
        return totalProgress > -1 && totalProgress < 100;
    }


    public setLoadingProgress(meshId: string, current: number, total: number) {

        if (!this.progressStates[meshId]) this.progressStates[meshId] = {
            loadingProgress: 0,
            preparationProgress: 0
        };

        this.progressStates[meshId].loadingProgress = (current / total) * 100;

        this.notifyObservers();
    }


    public setPreparationProgress(meshId: string, current: number, total: number) {

        this.progressStates[meshId].preparationProgress = (current / total) * 100;

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

        return Math.round((progressState.loadingProgress + progressState.preparationProgress) / 2);
    }


    private notifyObservers() {

        this.observers.forEach(observer => observer.next(this.getTotalProgress()));
    }
}