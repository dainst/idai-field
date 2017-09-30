import {IdaiFieldImageDocument} from '../model/idai-field-image-document';
import {ViewChild} from "@angular/core";
import {ImageGridComponent} from "./image-grid.component";

/**
 * @author Daniel de Oliveira
 * @author Sebastian Cuy
 * @author Jan G. Wieners
 * @author Thomas Kleinke
 * @author Fabian Z.
 */
export class ImageGridUser {

    @ViewChild('imageGrid') public imageGrid: ImageGridComponent;
    protected documents: IdaiFieldImageDocument[];
}