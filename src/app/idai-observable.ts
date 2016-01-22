import {IdaiObserver} from "./idai-observer";
export abstract class IdaiObservable {

    abstract subscribe(observer: IdaiObserver): any;

    abstract notifyObservers(): any;
}