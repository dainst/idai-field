import {Messages} from 'idai-components-2/messages';
import {ImageGridBuilder, ImageGridBuilderResult} from './image-grid-builder';
import {M} from '../m';
import {IdaiFieldImageDocument} from '../model/idai-field-image-document';
import {TemplateRef, ViewChild} from "@angular/core";
import {ImageGridComponent} from "./image-grid.component";
/**
 * @author Daniel de Oliveira
 * @author Sebastian Cuy
 * @author Jan G. Wieners
 * @author Thomas Kleinke
 * @author Fabian Z.
 */
export class ImageGridComponentBase {

    @ViewChild('imageGrid') public imageGrid: ImageGridComponent;

    protected documents: IdaiFieldImageDocument[];
}