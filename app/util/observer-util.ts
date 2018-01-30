import {Observer} from "rxjs/Observer";

/**
 * @author Daniel de Oliveira
 */
export function notify<A>(observers: Array<Observer<A>>, a: A) {

    for (let observer of observers) observer.next(a);
}