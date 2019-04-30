import {Component, EventEmitter, Input, OnChanges, Output} from '@angular/core';
import {ViewFacade} from '../view/view-facade';
import {ResourcesComponent} from '../resources.component';
import {ResourcesMapComponent} from './resources-map.component';


export type ContextMenuAction = 'edit'|'move'|'delete'|'create-polygon'|'create-line-string'|'create-point'|'edit-geometry';

type ContextMenuOrientation = 'top'|'bottom';


@Component({
    selector: 'context-menu',
    moduleId: module.id,
    templateUrl: './context-menu.html'
})
/**
 * @author Thomas Kleinke
 */
export class ContextMenuComponent implements OnChanges {

    @Input() position: { x: number, y: number };

    @Output() onSelectAction: EventEmitter<ContextMenuAction> = new EventEmitter<ContextMenuAction>();

    public orientation: ContextMenuOrientation = 'top';


    constructor(
        public resourcesMapComponent: ResourcesMapComponent,
        public resourcesComponent: ResourcesComponent,
        public viewFacade: ViewFacade) {}


    ngOnChanges() {

        this.orientation = ContextMenuComponent.computeOrientation(this.position.y);
    }


    public selectAction(action: ContextMenuAction) {

        this.onSelectAction.emit(action);
    }


    public getBottomPosition(yPosition: number): number {

        return window.innerHeight - yPosition;
    }


    private static computeOrientation(yPosition: number): ContextMenuOrientation {

        return yPosition <= window.innerHeight * 0.6
            ? 'top'
            : 'bottom';
    }
}