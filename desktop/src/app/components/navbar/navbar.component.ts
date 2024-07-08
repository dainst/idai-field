import { Component, DoCheck, ElementRef, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { TabManager } from '../../services/tabs/tab-manager';
import { Tab } from '../../services/tabs/tab';
import { TabUtil } from '../../services/tabs/tab-util';
import { ViewFacade } from '../../components/resources/view/view-facade';
import { MenuModalLauncher } from '../../services/menu-modal-launcher';


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
                private menuModalLauncher: MenuModalLauncher) {

        this.router.events.subscribe(() => this.activeRoute = this.router.url);
        this.menuModalLauncher.projectPropertiesNotifications().subscribe(() => this.onResize());
    }


    public getShownTabs = () => this.tabManager.getShownTabs();

    public getHiddenTabs = () => this.tabManager.getHiddenTabs();

    public isActiveRoute = (route: string) => this.activeRoute && this.activeRoute.startsWith(route);

    public openActiveTab = () => this.tabManager.openActiveTab();

    public getTabId = (tab: Tab) => TabUtil.getTabId(tab);

    public getTabRoute = (tab: Tab) => TabUtil.getTabRoute(tab);

    public getTabRouteArray = (tab: Tab) => TabUtil.getTabRouteArray(tab);

    public isInDefaultResourcesView = () => this.isActiveRoute('/resources')
        && !this.isActiveRoute('/resources/types') && !this.isActiveRoute('/resources/inventory');


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
            return $localize `:@@navbar.tabs.images:Bilder`;
        } else if (this.activeRoute.startsWith('/resources/types')) {
            return $localize `:@@navbar.tabs.types:Typenverwaltung`;
        } else if (this.activeRoute.startsWith('/resources/inventory')) {
            return $localize `:@@navbar.tabs.inventory:Inventarisierung`;
        } else if (this.activeRoute.startsWith('/matrix')) {
            return 'Matrix';
        } else if (this.activeRoute.startsWith('/downloadProject')) {
            return $localize `:@@navbar.tabs.downloadProject:Projekt herunterladen`;
        } else if (this.activeRoute.startsWith('/import')) {
            return $localize `:@@navbar.tabs.import:Import`;
        } else if (this.activeRoute.startsWith('/export')) {
            return $localize `:@@navbar.tabs.export:Export`;
        } else if (this.activeRoute.startsWith('/backup-creation')) {
            return $localize `:@@navbar.tabs.backupCreation:Backup erstellen`;
        } else if (this.activeRoute.startsWith('/backup-loading')) {
            return $localize `:@@navbar.tabs.backupLoading:Backup einlesen`;
        } else if (this.activeRoute.startsWith('/help')) {
            return $localize `:@@navbar.tabs.help:Hilfe`;
        } else if (this.activeRoute.startsWith('/settings')) {
            return $localize `:@@navbar.tabs.settings:Einstellungen`;
        } else if (this.activeRoute.startsWith('/configuration')) {
            return $localize `:@@navbar.tabs.configuration:Projektkonfiguration`;
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
                ((globalThis.getComputedStyle(this.tabSpaceElement.nativeElement).marginRight as string)
                    .replace('px', ''))
            );
    }
}
