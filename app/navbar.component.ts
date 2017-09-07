import {Component, OnInit} from '@angular/core';
import {Router} from '@angular/router';
import {ConfigLoader, ViewDefinition} from 'idai-components-2/configuration';

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

    constructor(private configLoader: ConfigLoader,
                router: Router) {

        router.events.subscribe(() => this.activeRoute = router.url);
    }

    public ngOnInit() {

        this.configLoader.getProjectConfiguration()
            .then(projectConfiguration => this.views = projectConfiguration.getViewsList())
            .catch(() => { this.views = []; });
    }

    public isActiveRoute(route: string) {

        return this.activeRoute.startsWith(route);
    }
}