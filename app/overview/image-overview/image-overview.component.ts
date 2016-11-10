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
        var positionWithinColumn = 0;
        for (var rowIndex = 0; rowIndex < nrOfRows; rowIndex++) {

            var originalRowWidth = 0;
            for (var columnIndex = 0; columnIndex < this.nrOfColumns; columnIndex++) {

                var resource = this.documents[documentsIndex]['resource'];
                originalRowWidth += parseFloat(resource['width']);

                documentsIndex++;
            }

            var rowWidthRatio = rowWidth / originalRowWidth;
            documentsIndex -= this.nrOfColumns;
            
            this.rows[rowIndex]=[];
            var positionWithinRow = 0;
            for (var columnIndex = 0; columnIndex < this.nrOfColumns; columnIndex++) {

                this.rows[rowIndex][columnIndex] = {};
                this.rows[rowIndex][columnIndex]['document'] =
                    this.documents[documentsIndex];
                this.rows[rowIndex][columnIndex]['calculatedWidth'] =
                    this.documents[documentsIndex]['resource']['width'] * rowWidthRatio;
                this.rows[rowIndex][columnIndex]['positionWithinRow'] = positionWithinRow;
                this.rows[rowIndex][columnIndex]['positionWithinColumn'] = positionWithinColumn;

                positionWithinRow += this.rows[rowIndex][columnIndex]['calculatedWidth']+10;
                documentsIndex++;
            }

            positionWithinColumn += 120;
        }
    }

    public onResize(event) {
        var rowWidth = Math.ceil((event.target.innerWidth-100) / 2);
        var nrOfRows = Math.floor(this.documents.length / this.nrOfColumns);

        this.calcGrid(rowWidth,nrOfRows)
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

            var rowWidth = Math.ceil((window.innerWidth - 100) / 2);
            var nrOfRows = Math.floor(this.documents.length / this.nrOfColumns);
            this.calcGrid(rowWidth, nrOfRows)

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
