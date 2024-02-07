import { VIRTUAL_SCROLL_STRATEGY } from '@angular/cdk/scrolling';
import { Component, Input, Output, EventEmitter } from '@angular/core';
import { FieldDocument } from 'idai-field-core';
import { GridListVirtualScrollStrategy } from './grid-list-virtual-scroll-strategy';
import { GridListComponent } from './grid-list.component';


@Component({
    selector: 'grid',
    templateUrl: './grid.html',
    providers: [{ provide: VIRTUAL_SCROLL_STRATEGY, useClass: GridListVirtualScrollStrategy }]
})
/**
 * @author Thomas Kleinke
 * @author Sebastian Cuy
 */
export class GridComponent {

    @Input() documents: Array<FieldDocument>;
    @Input() images: { [resourceId: string]: Array<Blob> } = {};

    @Output() clickDocument = new EventEmitter<FieldDocument>();
    @Output() contextmenuDocument = new EventEmitter<{ mouseEvent: MouseEvent, document: FieldDocument }>();

    constructor(public gridListComponent: GridListComponent) {}
}
