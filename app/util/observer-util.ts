import {Observer} from "rxjs/Observer";
import {Observable} from 'rxjs/Observable';

/**
 * @author Daniel de Oliveira
 */
export class ObserverUtil {

    public static notify<A>(observers: Array<Observer<A>>, a: A) {

        for (let observer of observers) observer.next(a);
    }


    public static register<A>(observers: Array<Observer<A>>) {

        return Observable.create((observer: Observer<A>) => {
            observers.push(observer);
        });
    }
}