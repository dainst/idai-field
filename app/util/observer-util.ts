import {Observer} from "rxjs/Observer";

export const inform = <A>(a: A) => (observer: Observer<A>) => observer.next(a);