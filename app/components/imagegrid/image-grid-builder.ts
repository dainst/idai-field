import {Document} from 'idai-components-2/core';
import {IdaiFieldImageResource} from '../../core/model/idai-field-image-resource';
import {ImageContainer} from '../../core/imagestore/image-container';
import {BlobMaker} from '../../core/imagestore/blob-maker';


/**
 * @author Daniel de Oliveira
 * @author Sebastian Cuy
 */
export class ImageGridBuilder {

    // nr of pixels between the right end of the screenspace and the grid
    private paddingRight: number = 20;
    private documents: Array<Document>;


    /**
     * @param documents
     * @param nrOfColumns <code>integer</code> expected. images will be devided into
     *   rows of <code>nrOfColumns</code> images.
     * @param gridWidth
     * @returns an object with rows containing the rows of the calculated grid
     *   and msgsWithParams containing one or more msgWithParams.
     */
    public calcGrid(documents: Array<Document>, nrOfColumns: number, gridWidth: number): any {

        if (!Number.isInteger(nrOfColumns)) throw ('nrOfColumns must be an integer');

        this.documents = documents;
        if (!this.documents) return [];

        const rows = [];
        for (let i = 0; i < this.nrOfRows(nrOfColumns); i++) {
            rows.push(this.calcRow(i, this.calculatedHeight(i, nrOfColumns, gridWidth), nrOfColumns));
        }

        return rows;
    }


    /**
     * @returns {Promise<any>} cellsWithMessages
     */
    private calcRow(rowIndex: any, calculatedHeight: any, nrOfColumns: any) {

        const row = [];

        for (let i = 0; i < nrOfColumns; i++) {

            const document = this.documents[rowIndex * nrOfColumns + i];
            if (!document) break;

            const cell = ImageGridBuilder.newCell(document, calculatedHeight);
            if ((document as any)['id'] !== 'droparea') cell.imgSrc = BlobMaker.blackImg;

            row.push(cell);
        }

        return row;
    }


    private calculatedHeight(rowIndex: any, nrOfColumns: any, gridWidth: any) {

        const rowWidth = Math.ceil(gridWidth - this.paddingRight);
        return rowWidth / ImageGridBuilder.calcNaturalRowWidth(this.documents, nrOfColumns, rowIndex);
    }


    private nrOfRows(nrOfColumns: number): number {

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


    private static newCell(document: any, calculatedHeight: any): ImageContainer {

        const cell: ImageContainer = {};
        const image = document.resource as IdaiFieldImageResource;
        cell.document = document;
        cell.calculatedWidth = image.width * calculatedHeight / image.height;
        cell.calculatedHeight = calculatedHeight;

        return cell;
    }
}
