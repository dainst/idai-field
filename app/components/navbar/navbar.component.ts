import {Component, OnInit} from '@angular/core';
import {Router} from '@angular/router';
import {ViewFacade} from '../resources/view/view-facade';
import {ViewDefinition} from '../resources/view/state/view-definition';
import {to, on, isNot} from 'tsfun';

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

        router.events.subscribe(() => this.activeRoute = router.url);
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


    public goto(arg: any) {

        if (this.views.map(to('name')).includes(arg)) {
            this.selectedView = this.views.find(on('name:')(arg));
            if (this.selectedView) this.router.navigate(['resources', this.selectedView.name])
        }
    }
}