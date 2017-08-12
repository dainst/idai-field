import {Document} from "idai-components-2/core";
import {IdaiFieldImageResource} from "../model/idai-field-image-resource";
import {ImageContainer} from "../imagestore/image-container";
import {BlobMaker} from "../imagestore/blob-maker";
import {Imagestore} from "../imagestore/imagestore";

/**
 * @author Daniel de Oliveira
 * @author Sebastian Cuy
 */
export class ImageGridBuilder {

    // nr of pixels between the right end of the screenspace and the grid
    private paddingRight: number = 57;
    private documents: Array<Document>;

    /**
     * @param imagestore
     * @param showAllAtOnce if true, all images are shown at once.
     *   if false, images are shown as soon as they are loaded
     */
    constructor(
        private imagestore: Imagestore,
        private showAllAtOnce: boolean = false
    ) { }

    /**
     * @param documents
     * @param nrOfColumns <code>integer</code> expected. images will be devided into
     *   rows of <code>nrOfColumns</code> images.
     * @param gridWidth
     * @returns an object with rows containing the rows of the calculated grid
     *   and msgsWithParams containing one or more msgWithParams.
     */
    public calcGrid(documents: Array<Document>, nrOfColumns: number, gridWidth: number): Promise<any> {

        if (!Number.isInteger(nrOfColumns)) throw ('nrOfColumns must be an integer');

        return new Promise((resolve)=>{
            this.documents = documents;
            if (!this.documents) resolve([]);

            const rowPromises = [];
            for (let i = 0; i < this.nrOfRows(nrOfColumns); i++) {
                rowPromises.push(this.calcRow(i, this.calculatedHeight(i, nrOfColumns, gridWidth), nrOfColumns));
            }
            resolve(this.splitCellsAndMessages(rowPromises));
        });
    }

    private calcRow(rowIndex, calculatedHeight, nrOfColumns) {

        return new Promise<any>((resolve) => {
            const promises = [];
            for (let i = 0; i < nrOfColumns; i++) {

                const document = this.documents[rowIndex * nrOfColumns + i];
                if (!document) break;

                promises.push(
                    this.getImg(
                        document,
                        ImageGridBuilder.newCell(document, calculatedHeight)
                    )
                );
            }
            Promise.all(promises).then(cellsWithMsgs => resolve(cellsWithMsgs));
        });
    }

    private static newCell(document, calculatedHeight): ImageContainer {

        const cell: ImageContainer = {};
        const image = document.resource as IdaiFieldImageResource;
        cell.document = document;
        cell.calculatedWidth = image.width * calculatedHeight / image.height;
        cell.calculatedHeight = calculatedHeight;
        return cell;
    }

    private calculatedHeight(rowIndex, nrOfColumns, gridWidth) {

        const rowWidth = Math.ceil(gridWidth - this.paddingRight);
        return rowWidth / ImageGridBuilder.calcNaturalRowWidth(this.documents, nrOfColumns, rowIndex);
    }

    private nrOfRows(nrOfColumns) {
        return Math.ceil(this.documents.length / nrOfColumns);
    }

    /**
     * Generate a row of images scaled to height 1 and sum up widths.
     */
    private static calcNaturalRowWidth(documents, nrOfColumns, rowIndex) {

        let naturalRowWidth = 0;
        for (let columnIndex = 0; columnIndex < nrOfColumns; columnIndex++) {
            const document = documents[rowIndex * nrOfColumns + columnIndex];
            if (!document) {
                naturalRowWidth += naturalRowWidth * (nrOfColumns - columnIndex) / columnIndex;
                break;
            }
            naturalRowWidth += document.resource.width / parseFloat(document.resource.height);
        }
        return naturalRowWidth;
    }

    private getImg(document, cell): Promise<any> {

        return new Promise<any>((resolve) => {
            if (document.id == 'droparea') return resolve({cell: cell});

            if (!this.showAllAtOnce) resolve({cell: cell});
            this.imagestore.read(document.resource.id).then(url => {
                if (this.showAllAtOnce) resolve({cell: cell});
                cell.imgSrc = url;
            }).catch(msgWithParams => {
                cell.imgSrc = BlobMaker.blackImg;
                resolve({cell: cell, msgWithParams: msgWithParams});
            });
        })
    }

    private splitCellsAndMessages(rowPromises) {

        return new Promise<any>((resolve) => {
            Promise.all(rowPromises).then(
                rows => this.split(rows, resolve)
            );
        })
    }

    private split(rows, resolve) {

        const rows_ = [];
        const msgsWithParams = [];
        rows.forEach(row => {
            const row_ = [];
            row.forEach(cell => {
                if (cell.msgWithParams) msgsWithParams.push(cell.msgWithParams);
                row_.push(cell.cell);
            });
            rows_.push(row_);
        });
        resolve({rows: rows_, msgsWithParams: msgsWithParams});
    }
}
