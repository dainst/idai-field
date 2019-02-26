import {Component} from '@angular/core';
import {Router} from '@angular/router';
import {ViewFacade} from '../resources/view/view-facade';
import {TabManager} from '../tab-manager';


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



    public isActiveRoute(route: string) {

        if (!this.activeRoute) return;
        return this.activeRoute.startsWith(route);
    }


    public isRunningOnMac() {

        return navigator.appVersion.indexOf('Mac') !== -1;
    }


    public async close(tabName: string) {

        if (this.isActiveRoute('/resources/' + tabName)) {
            await this.router.navigate(['resources', 'project']);
        }

        this.viewFacade.deactivateView(tabName);
        this.tabManager.closeTab(tabName);
    }
}