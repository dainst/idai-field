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
 * @author Daniel de Oliveira
 */
export class ImageOverviewComponent extends OverviewComponent implements OnInit {

    private data;
    private nrOfColumns = 3;
    private rows=[];

    constructor(@Inject('app.config') private config,
                private router: Router,
                private route: ActivatedRoute,
                datastore: IndexeddbDatastore,
                private mediastore: Mediastore
    ) {
        super(datastore);
    }

    public calcGrid(rowWidth,nrOfRows) {
        var documentsIndex = 0;
        for (var rowIndex = 0; rowIndex < nrOfRows; rowIndex++) {

            var originalRowWidth = 0;
            for (var columnIndex = 0; columnIndex < this.nrOfColumns; columnIndex++) {

                if (this.documents[documentsIndex]) {

                    var resource = this.documents[documentsIndex]['resource']
                    originalRowWidth += parseFloat(resource['width']);
                }
                else console.error("no doc", documentsIndex)

                documentsIndex++;
            }

            var rowWidthRatio = rowWidth / originalRowWidth;
            documentsIndex -= this.nrOfColumns;


            this.rows[rowIndex]=[];
            for (var columnIndex = 0; columnIndex < this.nrOfColumns; columnIndex++) {

                if (this.documents[documentsIndex]['resource']) {
                    this.documents[documentsIndex]['resource']['calculatedWidth'] =
                        this.documents[documentsIndex]['resource']['width'] * rowWidthRatio;

                    this.rows[rowIndex][columnIndex]=this.documents[documentsIndex];
                } else console.error("there should be a resource")

                documentsIndex++;
            }
        }
    }

    public onResize(event) {
        var rowWidth = Math.ceil((event.target.innerWidth-100) / 2);
        var nrOfRows = Math.floor(this.documents.length / this.nrOfColumns);

        this.mediastore.read('logo.png').then(
            data => {
                this.data = data;
                this.calcGrid(rowWidth,nrOfRows)
            },
            err => console.log(err)
        );


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

    /**
     * Populates the document list with all documents from
     * the datastore which match a <code>query</code>
     * @param query
     */
    public fetchDocuments2(query: Query) {

        this.datastore.find(query).then(documents => {
            this.documents = documents;


            this.mediastore.read('logo.png').then(
                data => {
                    this.data = data;
                    var rowWidth = Math.ceil((window.innerWidth-100) / 2);
                    var nrOfRows = Math.floor(this.documents.length / this.nrOfColumns);
                    this.calcGrid(rowWidth,nrOfRows)
                },
                err => console.log(err)
            );


        }).catch(err => console.error(err));
    }

    public ngOnInit() {

        if (this.config.environment == "test") {
            setTimeout(() =>
                this.fetchDocuments2(this.query)
            , 500);
        } else {
            this.fetchDocuments2(this.query);
        }

        this.route.params.subscribe(params => {
            if (params['id']) {
                this.datastore.get(params['id']).then(document => { this.setSelected(document) });
            }
        });
    }
}
