import {Injectable} from '@angular/core';
import {Observable, Observer} from 'rxjs';
import {Document} from 'idai-components-2';
import {NavigationPath} from './resources/view/state/navigation-path';
import {ObserverUtil} from '../core/util/observer-util';
import {StateSerializer} from '../common/state-serializer';
import {IndexFacade} from '../core/datastore/index/index-facade';


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


    constructor(indexFacade: IndexFacade,
                private stateSerializer: StateSerializer) {

        indexFacade.changesNotifications().subscribe(document => this.updateTabLabel(document));
        this.deserialize().then(tabs => this.tabs = tabs);
    }


    public notifications = (): Observable<NavigationPath> => ObserverUtil.register(this.observers);

    public getTabs = (): Array<Tab> => this.tabs;


    public isOpen(name: string): boolean {

        return this.tabs.find(tab => tab.name === name) !== undefined;
    }


    public async openTab(name: string, label: string) {

        this.tabs.push({ name: name, label: label });
        await this.serialize();
    }


    public async closeTab(name: string) {

        this.tabs = this.tabs.filter(tab => tab.name !== name);
        await this.serialize();
    }


    public async updateTabLabel(document: Document) {

        const tab: Tab|undefined = this.tabs.find(tab => tab.name === document.resource.id);
        if (tab) tab.label = document.resource.identifier;

        await this.serialize();
    }


    private async serialize() {

        await this.stateSerializer.store({ tabs: this.tabs }, 'tabs-state');
    }


    private async deserialize(): Promise<Array<Tab>> {

        const loadedState: any = await this.stateSerializer.load('tabs-state');

        return loadedState && loadedState.tabs && Array.isArray(loadedState.tabs)
            ? loadedState.tabs
            : [];
    }
}