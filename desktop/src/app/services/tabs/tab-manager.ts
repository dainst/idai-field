import { Datastore, Document, IndexFacade } from 'idai-field-core';
import { TabUtil } from './tab-util';
import { TabSpaceCalculator } from './tab-space-calculator';
import { Tab } from './tab';
import { StateSerializer } from '../state-serializer';


/**
 * @author Thomas Kleinke
 */
export class TabManager {

    private tabs: Array<Tab> = [];
    private activeTab: Tab|undefined;
    private url: string = '';

    private readonly initialized: Promise<any>;


    constructor(indexFacade: IndexFacade,
                private tabSpaceCalculator: TabSpaceCalculator,
                private stateSerializer: StateSerializer,
                private datastore: Datastore,
                private navigate: (path: string[]) => Promise<void>) {

        indexFacade.changesNotifications().subscribe(document => this.updateTabLabels(document));
        this.initialized = this.initialize();
    }


    public getShownTabs = (): Array<Tab> => this.tabs.filter(tab => tab.shown && this.isComplete(tab));

    public getHiddenTabs = (): Array<Tab> => this.tabs.filter(tab => !tab.shown && this.isComplete(tab));

    public isComplete = (tab: Tab): boolean => tab.operationCategory !== undefined && tab.label !== undefined;

    public getTabSpaceWidth = (): number => this.tabSpaceCalculator.getTabSpaceWidth();

    public openActiveTab = async () => await this.navigateToTabRoute(this.activeTab);

    public openTabToTheLeftOfActiveTab = async () => await this.navigateToTabRoute(
        this.getTabToTheLeftOfActiveTab()
    );


    public async routeChanged(url: string) {

        await this.openTabForRoute(url);
        this.updateActiveTab(url);
        this.url = url;
    }


    async initialize() {

        this.tabs = await this.deserialize();
        this.validateTabSpace();

        await this.openTabForRoute(this.url);
        await this.validateTabs();
        this.validateTabSpace();
    }


    public setTabSpaceWidth(width: number) {

        this.tabSpaceCalculator.setTabSpaceWidth(width);
        this.validateTabSpace();
    }


    public isOpen(routeName: string, resourceId: string): boolean {

        return this.getTab(routeName, resourceId) !== undefined;
    }


    public async openTab(routeName: string, operationId: string, operationIdentifier: string,
                         operationCategory: string) {

        await this.initialized;

        if (this.getTab(routeName, operationId)) return;

        this.tabs.push({
            routeName: routeName,
            label: TabManager.getLabel(routeName, operationIdentifier),
            operationId: operationId,
            operationCategory: operationCategory,
            shown: true
        });

        await this.serialize();
    }


    public async closeTab(routeName: string, operationId: string) {

        this.tabs = this.tabs.filter(tab => {
            return tab.routeName !== routeName || tab.operationId !== operationId;
        });

        this.validateTabSpace(undefined);

        await this.serialize();
    }


    public resetForE2E() {

        this.tabs = [];
        this.activeTab = undefined;
    }


    private async updateTabLabels(document: Document) {

        if (!document) return;

        this.tabs.filter(tab => tab.operationId === document.resource.id)
            .forEach(tab => {
                tab.label = TabManager.getLabel(tab.routeName, document.resource.identifier);
            });

        this.validateTabSpace();
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
        const operationIds: string[] = this.tabs.map(tab => tab.operationId);

        const operations = await this.datastore.getMultiple(operationIds);

        for (let operation of operations) {
            const tab: Tab|undefined = this.tabs.find(tab => {
                return tab.operationId === operation.resource.id;
            });
            if (!tab) continue;
            tab.label = TabManager.getLabel(tab.routeName, operation.resource.identifier);
            tab.operationCategory = operation.resource.category;
            validatedTabs.push(tab);
        }

        this.tabs = validatedTabs;
    }


    private validateTabSpace(activeTab: Tab|undefined = this.activeTab) {

        const usedTabSpaceWidth: number = this.updateTabVisibility(
            activeTab ? this.tabSpaceCalculator.getTabWidth(activeTab) : 0,
            activeTab, true
        );
        this.updateTabVisibility(usedTabSpaceWidth, activeTab, false);
    }


    private updateTabVisibility(usedTabSpaceWidth: number, activeTab: Tab|undefined, shown: boolean): number {

        let tabSpaceWidth: number = this.tabSpaceCalculator.getTabSpaceWidth();

        this.tabs
            .filter(tab => tab !== activeTab && tab.shown === shown)
            .forEach(tab => {
                const newUsedTabSpaceWidth: number
                    = usedTabSpaceWidth + this.tabSpaceCalculator.getTabWidth(tab);
                if (newUsedTabSpaceWidth <= tabSpaceWidth) {
                    tab.shown = true;
                    usedTabSpaceWidth = newUsedTabSpaceWidth;
                } else {
                    tab.shown = false;
                }
            });

        return usedTabSpaceWidth;
    }


    private async navigateToTabRoute(tab: Tab|undefined) {

        if (tab) {
            await this.navigate([tab.routeName, tab.operationId]);
        } else {
            await this.navigate(['resources', 'project']);
        }
    }


    private async openTabForRoute(route: string) {

        const {routeName, operationId} = TabUtil.getTabValuesForRoute(route);

        if (operationId && operationId !== 'project' && operationId !== 'types'
                && !this.getTab(routeName, operationId) && routeName === 'resources') {
            try {
                const document = await this.datastore.get(operationId);
                await this.openTab(
                    routeName, operationId, document.resource.identifier,document.resource.category
                );
            } catch (err) {
                // This error occurs when switching projects while a resources tab in opened. No tab is
                // opened in this case.
            }
        }
    }


    private updateActiveTab(route: string) {

        const {routeName, operationId} = TabUtil.getTabValuesForRoute(route);

        const tab: Tab|undefined = this.tabs.find(tab => {
            return tab.routeName === routeName && tab.operationId === operationId;
        });

        if (tab) {
            this.activeTab = tab;
            this.activeTab.shown = true;
            this.validateTabSpace();
        } else if (route === '/resources/project') {
            this.activeTab = undefined;
            this.validateTabSpace();
        }
    }


    private getTab(routeName: string, operationId: string): Tab|undefined {

        return this.tabs.find(tab => {
            return tab.routeName === routeName && tab.operationId === operationId
        });
    }


    private getTabToTheLeftOfActiveTab(): Tab|undefined {

        if (!this.activeTab) return undefined;

        const index: number = this.tabs
            .filter(tab => tab.shown)
            .indexOf(this.activeTab);

        if (index === 0) {
            return undefined;
        } else {
            return this.tabs[index - 1];
        }
    }


    private static getLabel(routeName: string, operationIdentifier: string): string {

        switch(routeName) {
            case 'resources':
                return operationIdentifier as string;
            default:
                return '';
        }
    }
}
