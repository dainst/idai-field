import {Component, EventEmitter, Input, Output} from '@angular/core';
import {IdaiFieldImageDocument} from '../model/idai-field-image-document';

@Component({
    selector: 'image-grid',
    moduleId: module.id,
    templateUrl: './image-grid.html'
})
/**
 * @author Daniel de Oliveira
 * @author Sebastian Cuy
 * @author Thomas Kleinke
 */
export class ImageGridComponent  {

    @Input() rows = [];
    @Input() resourceIdentifiers: string[] = [];
    @Input() selected: IdaiFieldImageDocument[] = [];
    @Input() showLinkBadges: boolean = true;

    @Output() onClick: EventEmitter<any> = new EventEmitter<any>();
    @Output() onDoubleClick: EventEmitter<any> = new EventEmitter<any>();
    @Output() onImagesUploaded: EventEmitter<any> = new EventEmitter<any>();
    @Output() onUploadError: EventEmitter<any> = new EventEmitter<any>();

    public getIdentifier(id: string): string {

        if (!this.resourceIdentifiers || (this.resourceIdentifiers.length < 1)) return undefined;
        return this.resourceIdentifiers[id];
    }
}
