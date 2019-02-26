import {Observable, Observer} from 'rxjs';
import {NavigationPath} from './resources/view/state/navigation-path';
import {ObserverUtil} from '../core/util/observer-util';


export type Tab = {
    name: string,
    label: string
}


/**
 * @author Thomas Kleinke
 */
export class TabManager {

    private tabs: Array<Tab> = [];
    private observers: Array<Observer<Array<Tab>>> = [];


    public notifications = (): Observable<NavigationPath> => ObserverUtil.register(this.observers);

    public getTabs = (): Array<Tab> => this.tabs;


    public isOpen(name: string): boolean {

        return this.tabs.find(tab => tab.name === name) !== undefined;
    }


    public openTab(name: string, label: string) {

        this.tabs.push({ name: name, label: label });
    }


    public closeTab(name: string) {

        this.tabs = this.tabs.filter(tab => tab.name !== name);
    }
}