import {VIRTUAL_SCROLL_STRATEGY} from '@angular/cdk/scrolling';
import {Component, Input, Output, EventEmitter} from '@angular/core';
import {FieldDocument} from 'idai-field-core';
import {TypeGridVirtualScrollStrategy} from './type-grid-virtual-scroll-strategy';
import {TypesComponent} from './types.component';


@Component({
    selector: 'type-grid',
    templateUrl: './type-grid.html',
    providers: [{ provide: VIRTUAL_SCROLL_STRATEGY, useClass: TypeGridVirtualScrollStrategy }]
})
/**
 * @author Thomas Kleinke
 * @author Sebastian Cuy
 */
export class TypeGridComponent {

    @Input() documents: Array<FieldDocument>;
    @Input() images: { [resourceId: string]: Array<Blob> } = {};

    @Output() clickDocument = new EventEmitter<FieldDocument>();
    @Output() contextmenuDocument = new EventEmitter<{ mouseEvent: MouseEvent, document: FieldDocument }>();

    constructor(public typesComponent: TypesComponent) {}
}
