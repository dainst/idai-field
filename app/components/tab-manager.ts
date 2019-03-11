import {Injectable} from '@angular/core';
import {Router} from '@angular/router';
import {I18n} from '@ngx-translate/i18n-polyfill';
import {Document, FieldDocument} from 'idai-components-2';
import {StateSerializer} from '../common/state-serializer';
import {IndexFacade} from '../core/datastore/index/index-facade';
import {FieldReadDatastore} from '../core/datastore/field/field-read-datastore';


export type Tab = {
    routeName: string,
    label: string
    operationId?: string
}


@Injectable()
/**
 * @author Thomas Kleinke
 */
export class TabManager {

    private tabs: Array<Tab> = [];


    constructor(indexFacade: IndexFacade,
                private stateSerializer: StateSerializer,
                private datastore: FieldReadDatastore,
                private router: Router,
                private i18n: I18n) {

        indexFacade.changesNotifications().subscribe(document => this.updateTabLabels(document));
        this.initialize();
    }


    public getTabs = (): Array<Tab> => this.tabs;


    async initialize() {

        this.tabs = await this.deserialize();
        await this.openTabForCurrentRoute();
        await this.validateTabs();
    }


    public isOpen(routeName: string, resourceId?: string): boolean {

        return this.getTab(routeName, resourceId) !== undefined;
    }


    public async openTab(routeName: string, operationId?: string, operationIdentifier?: string) {

        if (this.isOpen(routeName, operationId)) return;

        this.tabs.push({
            routeName: routeName,
            label: this.getLabel(routeName, operationIdentifier),
            operationId: operationId
        });

        await this.serialize();
    }


    public async closeTab(routeName: string, operationId?: string) {

        this.tabs = this.tabs.filter(tab => {
            return tab.routeName !== routeName || tab.operationId !== operationId;
        });
        await this.serialize();
    }


    public resetForE2E() {

        this.tabs = [];
    }


    private async updateTabLabels(document: Document) {

        this.tabs.filter(tab => tab.operationId === document.resource.id)
            .forEach(tab => tab.label = this.getLabel(tab.routeName, document.resource.identifier));

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


    private async validateTabs() {

        const validatedTabs: Array<Tab> = [];

        for (let tab of this.tabs) {
            if (tab.operationId) {
                try {
                    const document: FieldDocument = await this.datastore.get(tab.operationId);
                    tab.label = this.getLabel(tab.routeName, document.resource.identifier);
                } catch (err) {
                    continue;
                }
            }
            validatedTabs.push(tab);
        }

        this.tabs = validatedTabs;
    }


    private async openTabForCurrentRoute() {

        const route: string[] = this.router.url.split('/');
        const routeName: string = route[1];
        const operationId: string|undefined = route.length > 2 ? route[2] : undefined;

        if (operationId !== 'project' && !this.getTab(routeName, operationId)
                && (routeName === 'resources' || routeName === 'matrix')) {
            await this.openTab(routeName, operationId, '');
        }
    }


    private getTab(routeName: string, operationId?: string): Tab|undefined {

        return this.tabs.find(tab => {
            return tab.routeName === routeName && tab.operationId === operationId
        });
    }


    private getLabel(routeName: string, operationIdentifier?: string): string {

        switch(routeName) {
            case 'resources':
                return operationIdentifier as string;
            case 'matrix':
                return operationIdentifier + ' – ' + this.i18n({ id: 'navbar.matrix', value: 'Matrix'});
            default:
                return '';
        }
    }
}