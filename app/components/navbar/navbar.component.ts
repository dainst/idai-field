import {Component} from '@angular/core';
import {Router} from '@angular/router';
import {ViewFacade} from '../resources/view/view-facade';
import {Tab, TabManager} from '../tab-manager';


@Component({
    moduleId: module.id,
    selector: 'navbar',
    templateUrl: './navbar.html'
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
                private tabManager: TabManager) {

        this.router.events.subscribe(() => this.activeRoute = this.router.url);
    }


    public getTabs = () => this.tabManager.getTabs();

    public getTabId = (tab: Tab) => 'navbar-' + tab.routeName + (tab.operationId ? '-' + tab.operationId : '');

    public getTabRoute = (tab: Tab) => '/' + tab.routeName + (tab.operationId ? '/' + tab.operationId : '');

    public getTabRouteArray = (tab: Tab) => tab.operationId
        ? [tab.routeName, tab.operationId]
        : [tab.routeName];

    public isActiveRoute = (route: string) => this.activeRoute && this.activeRoute.startsWith(route);


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
}