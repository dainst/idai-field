import {Component, OnInit, Inject, Input} from "@angular/core";
import {Router, ActivatedRoute} from "@angular/router";
import {OverviewComponent} from '../overview.component';
import {IdaiFieldDocument} from "../../model/idai-field-document";
import {IndexeddbDatastore} from "../../datastore/indexeddb-datastore";
import {Mediastore} from '../../datastore/mediastore'
import {Query} from "idai-components-2/idai-components-2"

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
     * Populates the document list with all documents from
     * the datastore which match a <code>query</code>
     * @param query
     */
    public fetchDocuments2(query: Query) {
        
        this.datastore.find(query).then(documents => {
            this.documents = documents;
            console.log("set documents",this.documents)
        }).catch(err => console.error(err));
    }

    public ngOnInit() {

        this.fetchDocuments2(this.query);

        this.route.params.subscribe(params => {
            if (params['id']) {
                this.datastore.get(params['id']).then(document => { this.setSelected(document) });
            }
        });
    }

    /**
     * @param documentToSelect the object that should get selected if the preconditions
     *   to change the selection are met.
     */
    public select(documentToSelect: IdaiFieldDocument) {

        this.router.navigate(['images', { id: documentToSelect.resource.id }]);
    }
}
