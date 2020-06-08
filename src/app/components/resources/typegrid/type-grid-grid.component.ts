
import {VIRTUAL_SCROLL_STRATEGY} from '@angular/cdk/scrolling';
import {Component, Input, Output, EventEmitter} from '@angular/core';
import {TypeGridVirtualScrollStrategy} from './type-grid-virtual-scroll-strategy';
import { FieldDocument } from 'idai-components-2';
import { TypeGridComponent } from './type-grid.component';

@Component({
    selector: 'type-grid-grid',
    templateUrl: './type-grid-grid.html',
    providers: [{provide: VIRTUAL_SCROLL_STRATEGY, useClass: TypeGridVirtualScrollStrategy}]
})
/**
 * @author Thomas Kleinke
 * @author Sebastian Cuy
 */
export class TypeGridGridComponent {

    @Input() documents: Array<FieldDocument>;

    @Output() clickDocument = new EventEmitter<FieldDocument>();
    @Output() contextmenuDocument = new EventEmitter<{mouseEvent: MouseEvent, document: FieldDocument}>();

    constructor(public typeGridComponent: TypeGridComponent) {}

}
