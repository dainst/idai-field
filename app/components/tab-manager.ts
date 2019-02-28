import {Injectable} from '@angular/core';
import {I18n} from '@ngx-translate/i18n-polyfill';
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
                private datastore: FieldReadDatastore,
                private i18n: I18n) {

        indexFacade.changesNotifications().subscribe(document => this.updateTabLabels(document));
        this.deserialize().then(async tabs => this.tabs = await this.validateTabs(tabs));
    }


    public getTabs = (): Array<Tab> => this.tabs;


    public isOpen(routeName: string, resourceId?: string): boolean {

        return this.getTab(routeName, resourceId) !== undefined;
    }


    public async openTab(routeName: string, operationId?: string, operationIdentifier?: string) {

        if (this.isOpen(routeName, operationId)) return;

        this.tabs.push({
            routeName: routeName,
            label: this.getLabel(routeName, operationIdentifier),
            resourceId: operationId
        });

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


    private getLabel(routeName: string, operationIdentifier?: string): string {

        switch(routeName) {
            case 'resources':
                return operationIdentifier as string;
            case 'matrix':
                return operationIdentifier + ' – ' + this.i18n({ id: 'navbar.matrix', value: 'Matrix'});
            case 'help':
                return this.i18n({ id: 'navbar.taskbar.dropdown.help', value: 'Hilfe' });
            case 'images':
                return this.i18n({ id: 'navbar.taskbar.dropdown.images', value: 'Bilder' });
            case 'import':
                return this.i18n({ id: 'navbar.taskbar.dropdown.import', value: 'Import' });
            case 'export':
                return this.i18n({ id: 'navbar.taskbar.dropdown.export', value: 'Export' });
            case 'backup-creation':
                return this.i18n(
                    { id: 'navbar.taskbar.dropdown.createBackup', value: 'Backup erstellen' }
                );
            case 'backup-loading':
                return this.i18n(
                    { id: 'navbar.taskbar.dropdown.restoreBackup', value: 'Backup einlesen' }
                );
            case 'settings':
                return this.i18n({ id: 'navbar.taskbar.dropdown.settings', value: 'Einstellungen' });
            default:
                return '';
        }
    }
}