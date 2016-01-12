import {Component} from 'angular2/core';
import {RouteConfig,RouterLink,RouterOutlet} from 'angular2/router';
import {View} from "angular2/core";
import {OverviewComponent} from './overview.component';
import {HomeComponent} from './home.component';

@Component({
    selector: 'idai-field-client',
    templateUrl: 'templates/app.html',
    directives: [RouterOutlet,RouterLink]
})
@RouteConfig([
    { path: "/", name: "Home", component: HomeComponent, useAsDefault: true},
    { path: "/overview", name: "Overview", component: OverviewComponent}
])
export class AppComponent {}