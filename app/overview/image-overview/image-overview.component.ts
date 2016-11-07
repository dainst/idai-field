import {Component, OnInit, Inject} from "@angular/core";
import {Router, ActivatedRoute} from "@angular/router";
import {OverviewComponent} from '../overview.component';
import {IdaiFieldDocument} from "../../model/idai-field-document";
import {IndexeddbDatastore} from "../../datastore/indexeddb-datastore";
import {Document, Query} from "idai-components-2/idai-components-2"
import {Observable} from "rxjs/Observable";
import {Mediastore} from '../../datastore/mediastore'

@Component({

    moduleId: module.id,
    templateUrl: './image-overview.html'
})

/**
 * @author Thomas Kleinke
 */
export class ImageOverviewComponent extends OverviewComponent implements OnInit {

    constructor(@Inject('app.config') private config,
                private router: Router,
                private route: ActivatedRoute,
                datastore: IndexeddbDatastore,
                private mediastore: Mediastore
    ) {

        super(datastore);
    }

    protected setUpDefaultFilters() {

        this.defaultFilters = [ { field: 'type', value: 'image', invert: false } ];
    }

    /**
     * @param documentToSelect the object that should get selected if the preconditions
     *   to change the selection are met.
     */
    public select(documentToSelect: IdaiFieldDocument) {

        this.router.navigate(['images', { id: documentToSelect.resource.id }]);
    }

    public ngOnInit() {

        if (this.config.environment == "test") {
            setTimeout(() => this.fetchDocuments(this.query), 500);
        } else {
            this.fetchDocuments(this.query);
        }

        this.route.params.subscribe(params => {
            if (params['id']) {
                this.datastore.get(params['id']).then(document => { this.setSelected(document) });
            }
        });


        // this.mediastore.read('logo.png').then(
        //     data => console.log("ok",data),
        //     err => console.log(err));

    }
}
