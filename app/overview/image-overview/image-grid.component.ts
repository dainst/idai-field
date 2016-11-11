import {Component, OnChanges, OnInit} from "@angular/core";
import {Router} from "@angular/router";
import {IdaiFieldDocument} from "../../model/idai-field-document";
import {IndexeddbDatastore} from "../../datastore/indexeddb-datastore";
import {Query,Filter} from "idai-components-2/idai-components-2";
import {Mediastore} from "../../datastore/mediastore"

@Component({
    selector: 'image-grid',
    moduleId: module.id,
    templateUrl: './image-grid.html'
})

/**
 * Displays images as a grid of tiles.
 *
 * @author Daniel de Oliveira
 */
export class ImageGridComponent implements OnChanges, OnInit {

    private query : Query = { q: '' };
    private documents;
    protected defaultFilters: Array<Filter>;

    private nrOfColumns = 5;
    private rows=[];

    constructor(
        private router: Router,
        private datastore: IndexeddbDatastore,
        private mediastore: Mediastore
    ) {
        this.defaultFilters = [ { field: 'type', value: 'image', invert: false } ];
        this.query = { q: '', filters: this.defaultFilters };
    }

    public onSelectImages(event) {
        var files = event.srcElement.files;
        if (files && files.length > 0) {
            for (var i=0; i < files.length; i++) this.uploadFile(files[i]);
        }
    }

    private uploadFile(file) {
        var reader = new FileReader();
        reader.onloadend = (that => {
            return () => {
                that.mediastore.create(file.name, reader.result).then(() => {
                    console.log("upload finished ", file);
                    return that.createImageDocument(file);
                }).then(() => {
                    console.log("created image document for " + file.name);
                    that.fetchDocuments2(that.query);
                });
            }
        })(this);
        reader.readAsArrayBuffer(file);
    }

    private createImageDocument(file): Promise<any> {
        return new Promise((resolve, reject) => {
            var img = new Image();
            img.src = URL.createObjectURL(file);
            img.onload = () => {
                var doc = {
                    "resource": {
                        "identifier": file.name,
                        "type": "image",
                        "filename": file.name,
                        "width": img.width,
                        "height": img.height
                    }
                };
                this.datastore.create(doc).then(result => resolve(result));
            };
        });
    }
    
    /**
     * Populates the document list with all documents from
     * the datastore which match a <code>query</code>
     * @param query
     */
    public fetchDocuments2(query: Query) {

        this.datastore.find(query).then(documents => {
            this.documents = documents;
            console.log("Fetched documents",this.documents);
            var rowWidth = Math.ceil((window.innerWidth - 100) );
            this.calcGrid(rowWidth)
            
        }).catch(err => console.error(err));
    }
    
    protected setUpDefaultFilters() {
        this.defaultFilters = [ { field: 'type', value: 'image', invert: false } ];
    }

    public ngOnInit() {
        this.fetchDocuments2(this.query);
    }

    public ngOnChanges() {
        this.fetchDocuments2(this.query);
    }

    public queryChanged(query: Query) {

        this.query = query;
        // this.fetchDocuments(query);
    }

    public onResize(event) {
        var rowWidth = Math.ceil((event.target.innerWidth-100) );
        this.calcGrid(rowWidth)
    }
    
    public calcGrid(rowWidth) {
        this.rows=[]

        var nrOfRows = Math.floor(this.documents.length / this.nrOfColumns);


        var documentsIndex = 0;
        var positionWithinColumn = 0;
        for (var rowIndex = 0; rowIndex < nrOfRows; rowIndex++) {


            var scaledRowWidth = 0;

            this.rows[rowIndex]=[];
            for (var columnIndex = 0; columnIndex < this.nrOfColumns; columnIndex++) {
                this.rows[rowIndex][columnIndex] = {};

                var resource = this.documents[documentsIndex]['resource'];
                var scalingYFactor = 1000 / parseFloat(resource['height']);

                this.rows[rowIndex][columnIndex]['scaledWidth'] = parseFloat(resource['width']) * scalingYFactor;
                scaledRowWidth += this.rows[rowIndex][columnIndex]['scaledWidth'];
                // scaledRowWidth = scalingYFactor * resource['height'];

                documentsIndex++;
            }

            var rowWidthRatio = scaledRowWidth / rowWidth;
            var calculatedHeight = 1000 / rowWidthRatio;

            documentsIndex -= this.nrOfColumns;


            var positionWithinRow = 0;
            for (var columnIndex = 0; columnIndex < this.nrOfColumns; columnIndex++) {

                this.rows[rowIndex][columnIndex]['document'] =
                    this.documents[documentsIndex];
                this.rows[rowIndex][columnIndex]['calculatedWidth'] =
                    this.rows[rowIndex][columnIndex]['scaledWidth'] / rowWidthRatio;
                this.rows[rowIndex][columnIndex]['calculatedHeight'] = calculatedHeight;

                this.rows[rowIndex][columnIndex]['positionWithinRow'] = positionWithinRow;
                this.rows[rowIndex][columnIndex]['positionWithinColumn'] = positionWithinColumn;

                positionWithinRow += this.rows[rowIndex][columnIndex]['calculatedWidth']+10;
                documentsIndex++;
            }

            positionWithinColumn += calculatedHeight + 30;
        }
    }

    /**
     * @param documentToSelect the object that should get selected if the preconditions
     *   to change the selection are met.
     */
    public select(documentToSelect: IdaiFieldDocument) {
        this.router.navigate(['images', documentToSelect.resource.id, 'show']);
    }
}
