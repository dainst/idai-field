import {Component, OnChanges, OnInit, Input} from "@angular/core";
import {Router, ActivatedRoute} from "@angular/router";
import {IdaiFieldDocument} from "../../model/idai-field-document";
import {IndexeddbDatastore} from "../../datastore/indexeddb-datastore";

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

    @Input() documents;

    private nrOfColumns = 4;
    private rows=[];

    constructor(private router: Router
    ) { }

    public ngOnInit() { 
        console.log("call ngOnInit")
        if (this.documents) {
            var rowWidth = Math.ceil((window.innerWidth - 100) / 4 * 3);
            var nrOfRows = Math.floor(this.documents.length / this.nrOfColumns);
            this.calcGrid(rowWidth, nrOfRows)
        }
    }

    public ngOnChanges() {
        console.log("call ngOnChanges")
        if (this.documents) {
            var rowWidth = Math.ceil((window.innerWidth - 100) / 4 * 3);
            var nrOfRows = Math.floor(this.documents.length / this.nrOfColumns);
            this.calcGrid(rowWidth, nrOfRows)
        }
    }

    public onResize(event) {
        var rowWidth = Math.ceil((event.target.innerWidth-100) / 4 * 3);
        var nrOfRows = Math.floor(this.documents.length / this.nrOfColumns);

        this.calcGrid(rowWidth,nrOfRows)
    }
    
    public calcGrid(rowWidth,nrOfRows) {



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

        this.router.navigate(['images', { id: documentToSelect.resource.id }]);
    }
}
