import {Injectable} from '@angular/core';


@Injectable()
/**
 * @author Thomas Kleinke
 * @author Daniel de Oliveira
 */
export class Loading {

    private loadingStatus: { [context: string]: { loading: number; start: Date } } = {};


    public start(context: string = 'DEFAULT') {

        if (!this.loadingStatus[context]) this.loadingStatus[context] = {
            loading: 0,
            start: new Date()
        };

        this.loadingStatus[context].loading++;
    }


    public stop(context: string = 'DEFAULT') {

        if (!this.loadingStatus[context]) return;

        this.loadingStatus[context].loading--;
        if (this.loadingStatus[context].loading === 0) {
            delete this.loadingStatus[context];
        }
    }


    public isLoading(context: string = 'DEFAULT'): boolean {

        return this.loadingStatus[context] !== undefined;
    }


    public getLoadingTimeInMilliseconds(context: string = 'DEFAULT'): number {

        if (!this.loadingStatus[context]) return -1;

        return new Date().getTime() - this.loadingStatus[context].start.getTime();
    }
}
