import {Messages} from 'idai-components-2/messages';
import {ImageGridBuilder} from './image-grid-builder';
import {M} from '../m';
import {IdaiFieldImageDocument} from '../model/idai-field-image-document';
/**
 * @author Daniel de Oliveira
 * @author Sebastian Cuy
 * @author Jan G. Wieners
 * @author Thomas Kleinke
 * @author Fabian Z.
 */
export class ImageGridComponentBase {

    protected documents: IdaiFieldImageDocument[];

    public rows = [];

    private nrOfColumns: number;

    // parallel running calls to calcGrid are painfully slow, so we use this to prevent it
    private calcGridOnResizeRunning = false;
    // to be able to reset the timeout on multiple onResize calls
    private calcGridOnResizeTimeoutRef = undefined;

    constructor(
        private imageGridBuilder: ImageGridBuilder,
        protected messages: Messages,
        nrOfColumns: number) {

        this.nrOfColumns = nrOfColumns;
    }

    protected _onResize(width) {

        clearTimeout(this.calcGridOnResizeTimeoutRef);
        this.calcGridOnResizeTimeoutRef = setTimeout(() => {
            // we just jump out and do not store the recalc request. this could possibly be improved
            if (this.calcGridOnResizeRunning) return;

            this.calcGridOnResizeRunning = true;
            this.calcGrid(width).then(() => this.calcGridOnResizeRunning = false);
        }, 500);
    }

    protected calcGrid(clientWidth) {

        this.rows = [];

        return this.imageGridBuilder.calcGrid(
            this.documents, this.nrOfColumns,
            // this.el.nativeElement.children[0].
            clientWidth).then(result => {

            this.rows = result['rows'];
            for (let msgWithParams of result.errsWithParams) {
                // do not display a msg to the user via messages because there may be two much messages
                // the user will get black image which allows to identify which thumbs are missing
                console.error("error from calcGrid:", msgWithParams);
            }
            if (result.errsWithParams &&
                result.errsWithParams.length &&
                result.errsWithParams.length > 0) {

                // TODO enable as soon as there is a way to prevent multiple messages, for example as it would happen on resize
                // this.messages.add([M.IMAGES_N_NOT_FOUND]);
            }
        });
    }
}