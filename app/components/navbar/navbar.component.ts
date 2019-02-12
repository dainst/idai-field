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
    public operationViews: Array<{ id: string, label: string }> = [];


    constructor(private viewFacade: ViewFacade,
                router: Router) {

        router.events.subscribe(() => this.activeRoute = router.url);
        this.viewFacade.navigationPathNotifications().subscribe(() => {
            this.operationViews = this.viewFacade.getOperationViews();
        });
    }


    public isActiveRoute(route: string) {

        if (!this.activeRoute) return;
        return this.activeRoute.startsWith(route);
    }


    public isRunningOnMac() {

        return navigator.appVersion.indexOf('Mac') !== -1;
    }
}