import {Injectable} from '@angular/core';
import {Document} from 'idai-components-2';
import {StateSerializer} from '../common/state-serializer';
import {IndexFacade} from '../core/datastore/index/index-facade';


export type Tab = {
    routeName: RouteName,
    label: string
    resourceId?: string
}

type RouteName = 'resources'|'matrix';


@Injectable()
/**
 * @author Thomas Kleinke
 */
export class TabManager {

    private tabs: Array<Tab> = [];


    constructor(indexFacade: IndexFacade,
                private stateSerializer: StateSerializer) {

        indexFacade.changesNotifications().subscribe(document => this.updateTabLabels(document));
        this.deserialize().then(tabs => this.tabs = tabs);
    }


    public getTabs = (): Array<Tab> => this.tabs;


    public isOpen(routeName: RouteName, resourceId: string): boolean {

        return this.tabs.find(tab => {
            return tab.routeName === routeName && tab.resourceId === resourceId
        }) !== undefined;
    }


    public async openTab(routeName: RouteName, label: string, resourceId?: string) {

        this.tabs.push({ routeName: routeName, label: label, resourceId: resourceId });
        await this.serialize();
    }


    public async closeTab(routeName: RouteName, resourceId?: string) {

        this.tabs = this.tabs.filter(tab => {
            return tab.routeName !== routeName || tab.resourceId !== resourceId;
        });
        await this.serialize();
    }


    private async updateTabLabels(document: Document) {

        this.tabs.filter(tab => tab.resourceId === document.resource.id)
            .forEach(tab => tab.label = document.resource.identifier);

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