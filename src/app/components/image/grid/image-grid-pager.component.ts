import {Component, Input, Output, EventEmitter} from '@angular/core';

@Component({
    selector: 'image-grid-pager',
    templateUrl: './image-grid-pager.html'
})
/**
 * @author Daniel de Oliveira
 * @author Sebastian Cuy
 * @author Thomas Kleinke
 */
export class ImageGridPagerComponent {

    @Input() currentPage: number;
    @Input() pageCount: number;
    @Input() canTurnPage: boolean;
    @Input() canTurnPageBack: boolean;

    @Output() turnPage = new EventEmitter<void>();
    @Output() turnPageBack = new EventEmitter<void>();

}
