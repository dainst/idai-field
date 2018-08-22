import {Component, OnInit} from '@angular/core';
import {Router} from '@angular/router';
import {ViewFacade} from '../resources/view/view-facade';
import {ViewDefinition} from '../resources/view/state/view-definition';
import {to, on, isNot, empty} from 'tsfun';

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
export class NavbarComponent implements OnInit {

    public views: Array<ViewDefinition>;
    public activeRoute: string;

    public selectedView: ViewDefinition|undefined;


    constructor(private viewFacade: ViewFacade,
                private router: Router) {

        router.events.subscribe(() => {
            this.activeRoute = router.url;

            const viewName = this.activeRoute.substr(this.activeRoute.lastIndexOf('/') + 1);
            if (isNot(empty)(viewName)) this.goto(viewName, true);
        });
    }


    public ngOnInit() {

        this.views = this.viewFacade.getOperationSubtypeViews();
        this.selectedView = this.views[0];
    }


    public isActiveRoute(route: string) {

        if (!this.activeRoute) return;
        return this.activeRoute.startsWith(route);
    }


    public selectableViews() {

        return this.views
            ? this.views.filter(isNot(on('name')(this.selectedView)))
            : [];
    }


    public goto(viewName: string, dontJump = false) {

        if (this.views.map(to('name')).includes(viewName)) {
            this.selectedView = this.views.find(on('name:')(viewName));
            if (this.selectedView && !dontJump) this.router.navigate(['resources', this.selectedView.name])
        }
    }
}