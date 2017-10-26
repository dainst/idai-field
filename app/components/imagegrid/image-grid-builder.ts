import {Document} from 'idai-components-2/core';
import {IdaiFieldImageResource} from '../../core/model/idai-field-image-resource';
import {ImageContainer} from '../../core/imagestore/image-container';
import {BlobMaker} from '../../core/imagestore/blob-maker';
import {Imagestore} from '../../core/imagestore/imagestore';

export interface ImageGridBuilderResult {
    rows: any;
    errsWithParams: any;
}

/**
 * @author Daniel de Oliveira
 * @author Sebastian Cuy
 */
export class ImageGridBuilder {


    // nr of pixels between the right end of the screenspace and the grid
    private paddingRight: number = 20;
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
    public calcGrid(documents: Array<Document>, nrOfColumns: number, gridWidth: number): Promise<ImageGridBuilderResult> {

        if (!Number.isInteger(nrOfColumns)) throw ('nrOfColumns must be an integer');

        return new Promise((resolve)=>{
            this.documents = documents;
            if (!this.documents) resolve([]);

            const rowPromises = [];
            for (let i = 0; i < this.nrOfRows(nrOfColumns); i++) {
                rowPromises.push(this.calcRow(i, this.calculatedHeight(i, nrOfColumns, gridWidth), nrOfColumns));
            }
            resolve(ImageGridBuilder.splitCellsAndMessages(rowPromises));
        });
    }


    /**
     * @returns {Promise<any>} cellsWithMessages
     */
    private calcRow(rowIndex: any, calculatedHeight: any, nrOfColumns: any) {

        const promises = [];
        for (let i = 0; i < nrOfColumns; i++) {

            const document = this.documents[rowIndex * nrOfColumns + i];
            if (!document) break;

            promises.push(
                this.getImg(document,
                    ImageGridBuilder.newCell(document, calculatedHeight)
                )
            );
        }
        return Promise.all(promises);
    }


    private static newCell(document: any, calculatedHeight: any): ImageContainer {

        const cell: ImageContainer = {};
        const image = document.resource as IdaiFieldImageResource;
        cell.document = document;
        cell.calculatedWidth = image.width * calculatedHeight / image.height;
        cell.calculatedHeight = calculatedHeight;
        return cell;
    }


    private calculatedHeight(rowIndex: any, nrOfColumns: any, gridWidth: any) {

        const rowWidth = Math.ceil(gridWidth - this.paddingRight);
        return rowWidth / ImageGridBuilder.calcNaturalRowWidth(this.documents, nrOfColumns, rowIndex);
    }


    private nrOfRows(nrOfColumns: any) {

        return Math.ceil(this.documents.length / nrOfColumns);
    }


    /**
     * Generate a row of images scaled to height 1 and sum up widths.
     */
    private static calcNaturalRowWidth(documents: any, nrOfColumns: any, rowIndex: any) {

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


    /**
     * @returns {Promise<any>} cellWithMsg
     */
    private getImg(document: any, cell: any): Promise<any> {

        return new Promise<any>((resolve) => {
            if (document.id == 'droparea') return resolve({cell: cell});

            if (!this.showAllAtOnce) resolve({cell: cell});
            this.imagestore.read(document.resource.id).then(url => {
                if (this.showAllAtOnce) resolve({cell: cell});
                cell.imgSrc = url;
            }).catch(errWithParams => {
                cell.imgSrc = BlobMaker.blackImg;

                if (errWithParams && errWithParams.length == 1) {
                    errWithParams.push(document.resource.id);
                }
                resolve({cell: cell, errWithParams: errWithParams});
            });
        })
    }


    private static splitCellsAndMessages(rowPromises: any) {

        return Promise.all(rowPromises).then(
            rows => {
                const rows_: any[] = [];
                const errsWithParams: any[] = [];
                rows.forEach(row => {
                    const row_: any[] = [];
                    (row as any).forEach((cell: any) => {
                        if (cell.errWithParams) errsWithParams.push(cell.errWithParams);
                        row_.push(cell.cell);
                    });
                    rows_.push(row_);
                });
                return {rows: rows_, errsWithParams: errsWithParams};
            }
        );
    }

}
