import {Document} from "idai-components-2/core";
import {IdaiFieldImageResource} from "../model/idai-field-image-resource";
import {BlobProxy} from "../common/blob-proxy";
import {ImageContainer} from "../common/image-container";

/**
 * @author Daniel de Oliveira
 * @author Sebastian Cuy
 */
export class ImageGridBuilder {

    private blackImg = 'data:image/gif;base64,R0lGODlhAQABAIAAAAUEBAAAACwAAAAAAQABAAACAkQBADs=';

    // nr of pixels between the right end of the screenspace and the grid
    private paddingRight: number = 57;
    private documents: Array<Document>;

    /**
     * @param blobProxy
     * @param showAllAtOnce if true, all images are shown at once.
     *   if false, images are shown as soon as they are loaded
     */
    constructor(
        private blobProxy: BlobProxy,
        private showAllAtOnce:boolean = false
    ) { }

    /**
     * @param documents
     * @param nrOfColumns <code>integer</code> expected. images will be devided into
     *   rows of <code>nrOfColumns</code> images.
     * @param gridWidth
     * @returns an object with rows containing the rows of the calculated grid
     *   and msgsWithParams containing one or more msgWithParams.
     */
    public calcGrid(documents: Array<Document>, nrOfColumns: number, gridWidth: number)
        : Promise<Array<any>> {

        if (!Number.isInteger(nrOfColumns)) throw ('nrOfColumns must be an integer');

        return new Promise((resolve)=>{
            this.documents = documents;
            if (!this.documents) resolve([]);

            var rowPromises = [];
            for (var i = 0; i < this.nrOfRows(nrOfColumns); i++) {
                rowPromises.push(this.calcRow(i,this.calculatedHeight(i,nrOfColumns,gridWidth),nrOfColumns));
            }
            resolve(this.splitCellsAndMessages(rowPromises));
        });
    }

    private calcRow(rowIndex,calculatedHeight,nrOfColumns) {
        return new Promise<any>((resolve)=>{
            var promises = [];
            for (var i = 0; i < nrOfColumns; i++) {

                var document = this.documents[rowIndex * nrOfColumns + i];
                if (!document) break;

                promises.push(
                    this.getImg(
                        document,
                        this.newCell(document,calculatedHeight)
                    )
                );
            }
            Promise.all(promises).then(cellsWithMsgs => resolve(cellsWithMsgs));
        });
    }

    private newCell(document,calculatedHeight) : ImageContainer {
        var cell : ImageContainer = {};
        var image = document.resource as IdaiFieldImageResource;
        cell.document = document;
        cell.calculatedWidth = image.width * calculatedHeight / image.height;
        cell.calculatedHeight = calculatedHeight;
        return cell;
    }

    private calculatedHeight(rowIndex,nrOfColumns,gridWidth) {
        var rowWidth = Math.ceil((gridWidth - this.paddingRight) );
        return rowWidth / this.calcNaturalRowWidth(this.documents,nrOfColumns,rowIndex);
    }

    private nrOfRows(nrOfColumns) {
        return Math.ceil(this.documents.length / nrOfColumns);
    }

    /**
     * Generate a row of images scaled to height 1 and sum up widths.
     */
    private calcNaturalRowWidth(documents,nrOfColumns,rowIndex) {

        var naturalRowWidth = 0;
        for (var columnIndex = 0; columnIndex < nrOfColumns; columnIndex++) {
            var document = documents[rowIndex * nrOfColumns + columnIndex];
            if (!document) {
                naturalRowWidth += naturalRowWidth * (nrOfColumns - columnIndex) / columnIndex;
                break;
            }
            naturalRowWidth += document.resource.width / parseFloat(document.resource.height);
        }
        return naturalRowWidth;
    }

    /**
     * @param identifier
     * @param cell
     * @param showAllAtOnce is applied here
     */
    private getImg(document,cell) : Promise<any> {
        return new Promise<any>((resolve)=>{
            if (document.id == 'droparea') return resolve({cell:cell});

            if (!this.showAllAtOnce) resolve({cell:cell});
            this.blobProxy.getBlobUrl(document.resource.identifier).then(url=>{
                if (this.showAllAtOnce) resolve({cell:cell});
                cell.imgSrc = url;
            }).catch(msgWithParams=> {
                cell.imgSrc = BlobProxy.blackImg;
                resolve({cell:cell,msgWithParams:msgWithParams});
            });
        })
    }

    private splitCellsAndMessages(rowPromises) {
        return new Promise<any>((resolve)=>{
            Promise.all(rowPromises).then(
                rows=> this.split(rows,resolve)
            );
        })
    }

    private split(rows, resolve) {
        var rows_ = [];
        var msgsWithParams = [];
        rows.forEach(row=> {
            var row_ = [];
            row.forEach(cell => {
                if (cell.msgWithParams) msgsWithParams.push(cell.msgWithParams);
                row_.push(cell.cell);
            });
            rows_.push(row_);
        });
        resolve({rows:rows_,msgsWithParams:msgsWithParams});
    }
}
