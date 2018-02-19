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


    public static removeClosedObservers(observers: Array<any>) {

        const observersToDelete: any[] = [];
        for (let i = 0; i < observers.length; i++) {
            if ((observers[i] as any).closed) observersToDelete.push(observers[i]);
        }
        for (let observerToDelete of observersToDelete) {
            let i = observers.indexOf(observerToDelete as never);
            observers.splice(i, 1);
        }
    }
}