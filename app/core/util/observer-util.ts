import {Observer, Observable} from 'rxjs';


/**
 * @author Daniel de Oliveira
 */
export class ObserverUtil {

    public static notify<A>(observers: Array<Observer<A>>, a: A) {

        this.removeClosedObservers(observers);

        for (let observer of observers) {
            try {
                observer.next(a);
            } catch (err) {
                console.log('Error in ObserverUtil.notify, calling next', err);
            }
        }
    }


    public static register<A>(observers: Array<Observer<A>>) {

        return Observable.create((observer: Observer<A>) => {
            observers.push(observer);
        });
    }


    private static removeClosedObservers(observers: Array<any>) {

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