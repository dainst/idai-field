import {IdaiFieldImageDocument} from "../model/idai-field-image-document";
import {IdaiFieldImageResource} from "../model/idai-field-image-resource";
import {BlobProxy} from "../common/blob-proxy";
import {ImageContainer} from "../common/image-container";
import {Messages} from "idai-components-2/messages";

/**
 * @author Daniel de Oliveira
 * @author Sebastian Cuy
 */
export class ImageGridBuilder {

    private documents: IdaiFieldImageDocument[];

    /**
     * @param blobProxy
     * @param messages
     * @param showAllAtOnce if true, all images are shown at once.
     *   if false, images are shown as soon as they are loaded
     */
    constructor(
        private blobProxy: BlobProxy,
        private messages: Messages,
        private showAllAtOnce:boolean = false
    ) { }

    /**
     * @param documents
     * @param nrOfColumns <code>integer</code> expected. images will be devided into
     *   rows of <code>nrOfColumns</code> images.
     * @param gridWidth
     */
    public calcGrid(documents, nrOfColumns: number, gridWidth: number)
        : Promise<Array<any>> {

        if (!Number.isInteger(nrOfColumns)) throw ('nrOfColumns must be an integer');

        return new Promise((resolve)=>{
            this.documents = documents;
            if (!this.documents) resolve([]);

            var promises = [];
            for (var i = 0; i < this.nrOfRows(nrOfColumns); i++) {
                promises.push(this.calcRow(i,this.calculatedHeight(i,nrOfColumns,gridWidth),nrOfColumns));
            }
            Promise.all(promises).then(rows=> resolve(rows)); 
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
            Promise.all(promises).then(cells=> resolve(cells));
        });
    }

    /**
     * @param identifier
     * @param cell
     * @param showAllAtOnce is applied here
     */
    private getImg(document,cell) {
        return new Promise<any>((resolve)=>{
            if (document.id == 'droparea') return resolve(cell);

            if (!this.showAllAtOnce) resolve(cell);
            this.blobProxy.getBlobUrl(document.resource.identifier).then(url=>{
                if (this.showAllAtOnce) resolve(cell);
                cell.imgSrc = url;
            }).catch(err=> {
                this.messages.addWithParams(err);
            });
        })
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
        var rowWidth = Math.ceil((gridWidth - 57) );
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
}
