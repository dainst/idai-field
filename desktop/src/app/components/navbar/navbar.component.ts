import { Component, DoCheck, ElementRef, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { I18n } from '@ngx-translate/i18n-polyfill';
import { TabManager } from '../../services/tabs/tab-manager';
import { Tab } from '../../services/tabs/tab';
import { TabUtil } from '../../services/tabs/tab-util';
import { ViewFacade } from '../../components/resources/view/view-facade';
import { ProjectModalLauncher } from '../../services/project-modal-launcher';


@Component({
    selector: 'navbar',
    templateUrl: './navbar.html',
    host: {
        '(window:keydown)': 'onKeyDown($event)',
        '(window:resize)': 'onResize()'
    }
})
/**
 * @author Sebastian Cuy
 * @author Thomas Kleinke
 * @author Daniel de Oliveira
 */
export class NavbarComponent implements DoCheck {

    @ViewChild('tabSpace', { static: false }) tabSpaceElement: ElementRef;

    public activeRoute: string;


    constructor(public router: Router,
                private viewFacade: ViewFacade,
                private tabManager: TabManager,
                private projectModalLauncher: ProjectModalLauncher,
                private i18n: I18n) {

        this.router.events.subscribe(() => this.activeRoute = this.router.url);
        this.projectModalLauncher.projectPropertiesNotifications().subscribe(() => this.onResize());
    }


    public getShownTabs = () => this.tabManager.getShownTabs();

    public getHiddenTabs = () => this.tabManager.getHiddenTabs();

    public isActiveRoute = (route: string) => this.activeRoute && this.activeRoute.startsWith(route);

    public openActiveTab = () => this.tabManager.openActiveTab();

    public getTabId = (tab: Tab) => TabUtil.getTabId(tab);

    public getTabRoute = (tab: Tab) => TabUtil.getTabRoute(tab);

    public getTabRouteArray = (tab: Tab) => TabUtil.getTabRouteArray(tab);


    ngDoCheck() {

        if (this.tabSpaceElement && !this.tabManager.getTabSpaceWidth()) this.onResize();
    }


    public async onKeyDown(event: KeyboardEvent) {

        if ((event.ctrlKey || event.metaKey) && event.key === 'w') {
            await this.closeCurrentTab();
        }
    }


    public onResize() {

        if (this.tabSpaceElement) this.tabManager.setTabSpaceWidth(this.computeTabSpaceWidth());
    }


    public isRunningOnMac() {

        return navigator.appVersion.indexOf('Mac') !== -1;
    }


    public async close(tab: Tab) {

        if (this.isActiveRoute(TabUtil.getTabRoute(tab))) {
            await this.tabManager.openTabToTheLeftOfActiveTab();
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
        } else if (this.activeRoute.startsWith('/resources/types')) {
            return this.i18n({ id: 'navbar.tabs.types', value: 'Typenverwaltung' });
        } else if (this.activeRoute.startsWith('/matrix')) {
            return 'Matrix';
        } else if (this.activeRoute.startsWith('/downloadProject')) {
            return this.i18n({ id: 'navbar.tabs.downloadProject', value: 'Projekt herunterladen' });
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
        } else if (this.activeRoute.startsWith('/configuration')) {
            return this.i18n({ id: 'navbar.tabs.configuration', value: 'Projektkonfiguration' });
        } else {
            return '';
        }
    }


    public getCurrentTab(): Tab|undefined {

        return this.tabManager.getShownTabs().find(tab => {
            return this.activeRoute === '/' + tab.routeName + '/' + tab.operationId;
        });
    }


    private computeTabSpaceWidth(): number {

        return this.tabSpaceElement.nativeElement.offsetWidth
            + parseInt(
                ((window.getComputedStyle(this.tabSpaceElement.nativeElement).marginRight as string)
                    .replace('px', ''))
            );
    }
}
