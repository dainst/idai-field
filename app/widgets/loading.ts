import {Injectable} from '@angular/core';
import {Observable} from 'rxjs/observable';

@Injectable()

/**
 * @author Thomas Kleinke
 * @author Daniel de Oliveira
 */
export class Loading {

    constructor() {}

    private loading: number = 0;
    private observers: Array<any> = [];

    public start() {

        this.loading++;
        this.notifyObservers();
    }

    public stop() {

        this.loading--;
        this.notifyObservers();
    }

    public loadingStatus(): Observable<boolean> {

        return Observable.create(observer => {
            this.observers.push(observer);
        });
    }

    private notifyObservers() {

        for (let observer of this.observers) {
            observer.next(this.loading > 0);
        }
    }
}