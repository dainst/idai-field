import { Document, ImageResource } from 'idai-field-core';
import { ImageUrlMaker } from '../../../services/imagestore/image-url-maker';
import { ImageContainer } from '../../../services/imagestore/image-container';


/**
 * @param documents
 * @param nrOfColumns <code>integer</code> expected. images will be devided into
 *   rows of <code>nrOfColumns</code> images.
 * @param gridWidth
 * @param paddingRight
 * @returns an object with rows containing the rows of the calculated grid
 *   and msgsWithParams containing one or more msgWithParams.
 *
 * @author Daniel de Oliveira
 * @author Sebastian Cuy
 */
export function constructGrid(documents: Array<Document>,
                              nrOfColumns: number,
                              gridWidth: number,
                              paddingRight: number): any {

    if (!Number.isInteger(nrOfColumns)) throw ('nrOfColumns must be an integer');

    if (!documents) return [];

    const rows = [] as any;
    for (let i = 0; i < nrOfRows(documents, nrOfColumns); i++) {
        rows.push(
            calcRow(documents, i, calculatedHeight(documents, i, nrOfColumns, gridWidth, paddingRight)
                , nrOfColumns) as never);
    }

    return rows;
}


/**
 * @returns {Promise<any>} cellsWithMessages
 */
function calcRow(documents: Array<Document>, rowIndex: any, calculatedHeight: any, nrOfColumns: any) {

    const row = [] as any;

    for (let i = 0; i < nrOfColumns; i++) {
        const document = documents[rowIndex * nrOfColumns + i];
        if (!document) break;

        const cell = newCell(document, calculatedHeight);
        if ((document as any)['id'] !== 'droparea') cell.imgSrc = ImageUrlMaker.blackImg;

        row.push(cell as never);
    }

    return row;
}


function calculatedHeight(documents: Array<Document>, rowIndex: any, nrOfColumns: any, gridWidth: any,
                          paddingRight: number) {

    const rowWidth = Math.ceil(gridWidth - paddingRight);
    return rowWidth / calcNaturalRowWidth(documents, nrOfColumns, rowIndex);
}


function nrOfRows(documents: Array<Document>, nrOfColumns: number): number {

    return Math.ceil(documents.length / nrOfColumns);
}


/**
 * Generate a row of images scaled to height 1 and sum up widths.
 */
function calcNaturalRowWidth(documents: any, nrOfColumns: any, rowIndex: any) {

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


function newCell(document: any, calculatedHeight: any): ImageContainer {

    const cell: ImageContainer = {};
    const image = document.resource as ImageResource;
    cell.document = document;
    cell.calculatedWidth = image.width * calculatedHeight / image.height;
    cell.calculatedHeight = calculatedHeight;

    return cell;
}
