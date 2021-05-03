import {Component, EventEmitter, Input, OnChanges, Output} from '@angular/core';
import {ContextMenu, ContextMenuOrientation} from '../../resources/widgets/context-menu';


export type ImageRowContextMenuAction = 'something'|'somethingElse';


@Component({
    selector: 'image-row-context-menu',
    templateUrl: './image-row-context-menu.html'
})
/**
 * @author Thomas Kleinke
 */
export class ImageRowContextMenuComponent implements OnChanges {

    @Input() contextMenu: ContextMenu;
    @Input() showViewOption: boolean = false;

    @Output() onSelectAction: EventEmitter<ImageRowContextMenuAction> = new EventEmitter<ImageRowContextMenuAction>();

    public orientation: ContextMenuOrientation = 'top';


    constructor() {}


    ngOnChanges() {

        this.orientation = ContextMenu.computeOrientation(this.contextMenu.position?.y);
    }


    public selectAction(action: ImageRowContextMenuAction) {

        this.onSelectAction.emit(action);
    }


    public getBottomPosition(yPosition: number): number {

        return window.innerHeight - yPosition;
    }


    public areAnyOptionsAvailable(): boolean {

        return true;
    }

}
