import {Component, OnInit, Inject} from "@angular/core";
import {Router} from "@angular/router";
import {OverviewComponent} from './overview.component';
import {IdaiFieldDocument} from "../model/idai-field-document";
import {IndexeddbDatastore} from "../datastore/indexeddb-datastore";
import {Document, Query} from "idai-components-2/idai-components-2"
import {Observable} from "rxjs/Observable";

@Component({

    moduleId: module.id,
    templateUrl: './resource-overview.html'
})

/**
 * @author Sebastian Cuy
 * @author Daniel de Oliveira
 * @author Jan G. Wieners
 * @author Thomas Kleinke
 */
export class ResourceOverviewComponent extends OverviewComponent implements OnInit {

    constructor(@Inject('app.config') private config,
                private router: Router,
                datastore: IndexeddbDatastore) {

        super(datastore);
    }

    /**
     * @param documentToSelect the object that should get selected if the preconditions
     *   to change the selection are met.
     */
    public select(documentToSelect: IdaiFieldDocument) {

        this.router.navigate(['resources', { id: documentToSelect.resource.id }]);
    }

    public ngOnInit() {

        if (this.config.environment == "test") {
            setTimeout(() => this.fetchDocuments(this.query), 500);
        } else {
            this.fetchDocuments(this.query);
        }
    }
}
