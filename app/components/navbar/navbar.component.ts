import {Component} from '@angular/core';
import {Router} from '@angular/router';
import {I18n} from '@ngx-translate/i18n-polyfill';
import {ViewFacade} from '../resources/view/view-facade';
import {Tab, TabManager} from '../tab-manager';


@Component({
    moduleId: module.id,
    selector: 'navbar',
    templateUrl: './navbar.html',
    host: {
        '(window:keydown)': 'onKeyDown($event)'
    }
})
/**
 * @author Sebastian Cuy
 * @author Thomas Kleinke
 * @author Daniel de Oliveira
 */
export class NavbarComponent {

    public activeRoute: string;


    constructor(public router: Router,
                private viewFacade: ViewFacade,
                private tabManager: TabManager,
                private i18n: I18n) {

        this.router.events.subscribe(() => this.activeRoute = this.router.url);
    }


    public getTabs = () => this.tabManager.getTabs();

    public getTabId = (tab: Tab) => 'navbar-' + tab.routeName + (tab.operationId ? '-' + tab.operationId : '');

    public getTabRoute = (tab: Tab) => '/' + tab.routeName + (tab.operationId ? '/' + tab.operationId : '');

    public getTabRouteArray = (tab: Tab) => tab.operationId
        ? [tab.routeName, tab.operationId]
        : [tab.routeName];

    public isActiveRoute = (route: string) => this.activeRoute && this.activeRoute.startsWith(route);

    public returnToLastResourcesRoute = () => this.tabManager.returnToLastResourcesRoute();


    public async onKeyDown(event: KeyboardEvent) {

        if ((event.ctrlKey || event.metaKey) && event.key === 'w') {
            await this.closeCurrentTab();
        }
    }


    public isRunningOnMac() {

        return navigator.appVersion.indexOf('Mac') !== -1;
    }


    public async close(tab: Tab) {

        if (this.isActiveRoute(this.getTabRoute(tab))) {
            await this.router.navigate(['resources', 'project']);
        }

        if (tab.routeName === 'resources') this.viewFacade.deactivateView(tab.operationId as string);

        await this.tabManager.closeTab(tab.routeName, tab.operationId);
    }


    public async closeCurrentTab() {

        const currentTab: Tab|undefined = this.getCurrentTab();
        if (currentTab) await this.close(currentTab);
    }


    public getActiveRouteLabel(): string {

        if (!this.activeRoute) return '';

        if (this.activeRoute.startsWith('/images')) {
            return this.i18n({ id: 'navbar.tabs.images', value: 'Bilder' });
        } else if (this.activeRoute.startsWith('/import')) {
            return this.i18n({ id: 'navbar.tabs.import', value: 'Import' });
        } else if (this.activeRoute.startsWith('/export')) {
            return this.i18n({ id: 'navbar.tabs.export', value: 'Export' });
        } else if (this.activeRoute.startsWith('/backup-creation')) {
            return this.i18n({ id: 'navbar.tabs.backupCreation', value: 'Backup erstellen' });
        } else if (this.activeRoute.startsWith('/backup-loading')) {
            return this.i18n({ id: 'navbar.tabs.backupLoading', value: 'Backup einlesen' });
        } else if (this.activeRoute.startsWith('/help')) {
            return this.i18n({ id: 'navbar.tabs.help', value: 'Hilfe' });
        } else if (this.activeRoute.startsWith('/settings')) {
            return this.i18n({ id: 'navbar.tabs.settings', value: 'Einstellungen' });
        } else {
            return '';
        }
    }


    public getCurrentTab(): Tab|undefined {

        return this.tabManager.getTabs().find(tab => {
            return this.activeRoute === '/' + tab.routeName + '/' + tab.operationId;
        });
    }
}