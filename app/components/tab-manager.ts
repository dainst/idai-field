import {Injectable} from '@angular/core';
import {Document, FieldDocument} from 'idai-components-2';
import {StateSerializer} from '../common/state-serializer';
import {IndexFacade} from '../core/datastore/index/index-facade';
import {FieldReadDatastore} from '../core/datastore/field/field-read-datastore';


export type Tab = {
    routeName: string,
    label: string
    resourceId?: string
}


@Injectable()
/**
 * @author Thomas Kleinke
 */
export class TabManager {

    private tabs: Array<Tab> = [];


    constructor(indexFacade: IndexFacade,
                private stateSerializer: StateSerializer,
                private datastore: FieldReadDatastore) {

        indexFacade.changesNotifications().subscribe(document => this.updateTabLabels(document));
        this.deserialize().then(async tabs => this.tabs = await this.validateTabs(tabs));
    }


    public getTabs = (): Array<Tab> => this.tabs;


    public isOpen(routeName: string, resourceId?: string): boolean {

        return this.getTab(routeName, resourceId) !== undefined;
    }


    public async openTab(routeName: string, label: string, resourceId?: string) {

        if (this.isOpen(routeName, resourceId)) return;

        this.tabs.push({ routeName: routeName, label: label, resourceId: resourceId });
        await this.serialize();
    }


    public async closeTab(routeName: string, resourceId?: string) {

        this.tabs = this.tabs.filter(tab => {
            return tab.routeName !== routeName || tab.resourceId !== resourceId;
        });
        await this.serialize();
    }


    public resetForE2E() {

        this.tabs = [];
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


    private async validateTabs(tabs: Array<Tab>): Promise<Array<Tab>> {

        const validatedTabs: Array<Tab> = [];

        for (let tab of tabs) {
            if (tab.resourceId) {
                try {
                    const document: FieldDocument = await this.datastore.get(tab.resourceId);
                    tab.label = document.resource.identifier;
                } catch (err) {
                    continue;
                }
            }
            validatedTabs.push(tab);
        }

        return validatedTabs;
    }


    private getTab(routeName: string, resourceId?: string): Tab|undefined {

        return this.tabs.find(tab => {
            return tab.routeName === routeName && tab.resourceId === resourceId
        });
    }
}