import {Injectable} from '@angular/core';
import {Observable, Observer} from 'rxjs';
import {Document} from 'idai-components-2';
import {NavigationPath} from './resources/view/state/navigation-path';
import {ObserverUtil} from '../core/util/observer-util';
import {PouchdbDatastore} from '../core/datastore/core/pouchdb-datastore';


export type Tab = {
    name: string,
    label: string
}


@Injectable()
/**
 * @author Thomas Kleinke
 */
export class TabManager {

    private tabs: Array<Tab> = [];
    private observers: Array<Observer<Array<Tab>>> = [];


    constructor(datastore: PouchdbDatastore) {

        datastore.changesNotifications().subscribe(document => this.updateTabLabel(document));
    }


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


    public updateTabLabel(document: Document) {

        const tab: Tab|undefined = this.tabs.find(tab => tab.name === document.resource.id);
        if (tab) tab.label = document.resource.identifier;
    }
}