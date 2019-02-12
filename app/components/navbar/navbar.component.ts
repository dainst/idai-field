import {Component} from '@angular/core';
import {Router} from '@angular/router';
import {ViewFacade} from '../resources/view/view-facade';


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
    public operationViews: {[id: string]: string} = {};


    constructor(private viewFacade: ViewFacade,
                private router: Router) {

        this.router.events.subscribe(() => this.activeRoute = this.router.url);
        this.viewFacade.navigationPathNotifications().subscribe(() => {
            this.operationViews = this.viewFacade.getOperationViews();
        });
    }


    public operationViewKeys = () => Object.keys(this.operationViews);


    public isActiveRoute(route: string) {

        if (!this.activeRoute) return;
        return this.activeRoute.startsWith(route);
    }


    public isRunningOnMac() {

        return navigator.appVersion.indexOf('Mac') !== -1;
    }


    public async close(viewName: string) {

        if (this.isActiveRoute('/resources/' + viewName)) {
            await this.router.navigate(['resources', 'project']);
        }

        this.viewFacade.deactivate(viewName);
    }
}