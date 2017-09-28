import {Messages} from 'idai-components-2/messages';
import {ImageGridBuilder, ImageGridBuilderResult} from './image-grid-builder';
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

    public rows = [];

    protected documents: IdaiFieldImageDocument[];

    private nrOfColumns: number;

    // parallel running calls to calcGrid are painfully slow, so we use this to prevent it
    private calcGridOnResizeRunning = false;
    // to be able to reset the timeout on multiple onResize calls
    private calcGridOnResizeTimeoutRef = undefined;

    // it should be avoided that while being in an image overview and thumbs are missing,
    // that the missing images messages is shown more than once, as it would happen
    // on a recalculation of the grid on resize.
    // only if the user leaves the component and comes back again,
    // the message would be displayed again.
    private imagesNotFoundMessageDisplayed = false;

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
            for (let errWithParams of result.errsWithParams) {
                // do not display a msg to the user via messages because there may be two much messages
                // the user will get black image which allows to identify which thumbs are missing
                console.error("error from calcGrid:", errWithParams);
            }
            this.showImagesNotFoundMessage(result);
        });
    }

    private showImagesNotFoundMessage(result: ImageGridBuilderResult) {

        if (result.errsWithParams &&
            result.errsWithParams.length &&
            result.errsWithParams.length > 0 &&
            !this.imagesNotFoundMessageDisplayed) {

            this.messages.add([M.IMAGES_N_NOT_FOUND]);
            this.imagesNotFoundMessageDisplayed = true;
        }
    }
}