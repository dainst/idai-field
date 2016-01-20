import {Component, OnInit} from 'angular2/core';
import {RouteConfig,RouterLink,RouterOutlet} from 'angular2/router';
import {View} from "angular2/core";
import {OverviewComponent} from './overview.component';
import {HomeComponent} from './home.component';
import {Datastore} from "../services/datastore";

import {OBJECTS} from "../services/sample-objects";

@Component({
    selector: 'idai-field-app',
    templateUrl: 'templates/app.html',
    directives: [RouterOutlet,RouterLink]
})
@RouteConfig([
    { path: "/", name: "Home", component: HomeComponent, useAsDefault: true},
    { path: "/overview", name: "Overview", component: OverviewComponent}
])
export class AppComponent implements OnInit {


    constructor(private datastore: Datastore) {

    }

    ngOnInit() {
        this.datastore.initialize().then(() => {
            this.loadSampleData()
        }).catch(err => console.error(err));
    }

    loadSampleData(): void {

        var promises = [];
        for (var ob of OBJECTS) promises.push(this.datastore.save(ob));
        Promise.all(promises).then(
            () => console.log("Successfully stored sample objects"),
            err => console.error("Problem when storing sample data", err)
        );
    }

}