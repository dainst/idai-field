import {Component, Input, Output, EventEmitter} from '@angular/core';


@Component({
    selector: 'paging-buttons',
    templateUrl: './paging-buttons.html'
})
/**
 * @author Daniel de Oliveira
 * @author Sebastian Cuy
 * @author Thomas Kleinke
 */
export class PagingButtonsComponent {

    @Input() currentPage: number;
    @Input() pageCount: number;
    @Input() canTurnPage: boolean;
    @Input() canTurnPageBack: boolean;

    @Output() onTurnPage: EventEmitter<void> = new EventEmitter<void>();
    @Output() onTurnPageBack: EventEmitter<void> = new EventEmitter<void>();
}
