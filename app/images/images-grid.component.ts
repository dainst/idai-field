import {Component, OnChanges, OnInit} from "@angular/core";
import {Router} from "@angular/router";
import {IdaiFieldDocument} from "../model/idai-field-document";
import {IndexeddbDatastore} from "../datastore/indexeddb-datastore";
import {Query,Filter} from "idai-components-2/idai-components-2";
import {Mediastore} from "../datastore/mediastore";
import {DomSanitizer} from '@angular/platform-browser';

@Component({
    moduleId: module.id,
    templateUrl: './images-grid.html'
})

/**
 * Displays images as a grid of tiles.
 *
 * @author Daniel de Oliveira
 * @author Sebastian Cuy
 */
export class ImagesGridComponent implements OnChanges, OnInit {

    private query : Query = { q: '' };
    private documents;
    protected defaultFilters: Array<Filter>;

    private nrOfColumns = 4;
    private rows=[];

    constructor(
        private router: Router,
        private datastore: IndexeddbDatastore,
        private mediastore: Mediastore,
        private sanitizer: DomSanitizer
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

                var column = this.rows[rowIndex][columnIndex];

                column['document'] = this.documents[documentsIndex];
                column['calculatedWidth'] = column['scaledWidth'] / rowWidthRatio;
                column['calculatedHeight'] = calculatedHeight;

                column['positionWithinRow'] = positionWithinRow;
                column['positionWithinColumn'] = positionWithinColumn;

                var callback = (column) => {
                    return (url) => column['imgSrc'] = url;
                };
                this.urlForImage(column.document.resource.filename).then(callback(column));

                positionWithinRow += column['calculatedWidth'] + 10;
                documentsIndex++;
            }

            positionWithinColumn += calculatedHeight + 30;
        }
    }

    private urlForImage(filename): Promise<string> {
        return new Promise((resolve, reject) => {
            this.mediastore.read(filename).then(data => {
                var url = URL.createObjectURL(new Blob([data]));
                console.log(url);
                resolve(this.sanitizer.bypassSecurityTrustResourceUrl(url));
            });
        });
    }

    /**
     * @param documentToSelect the object that should get selected if the preconditions
     *   to change the selection are met.
     */
    public select(documentToSelect: IdaiFieldDocument) {
        this.router.navigate(['images', documentToSelect.resource.id, 'show']);
    }
}
