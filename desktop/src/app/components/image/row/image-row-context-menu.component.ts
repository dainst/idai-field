import {Component, EventEmitter, Input, OnChanges, Output} from '@angular/core';
import {Document} from 'idai-field-core';
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

    @Output() onSelectAction: EventEmitter<[ImageRowContextMenuAction, Array<Document>]> =
        new EventEmitter<[ImageRowContextMenuAction, Array<Document>]>();

    public orientation: ContextMenuOrientation = 'top';


    constructor() {}


    ngOnChanges() {

        this.orientation = ContextMenu.computeOrientation(this.contextMenu.position?.y);
    }


    public selectAction(action: ImageRowContextMenuAction) {

        this.onSelectAction.emit([action, this.contextMenu.documents]);
    }


    public getBottomPosition(yPosition: number): number {

        return window.innerHeight - yPosition;
    }


    public areAnyOptionsAvailable(): boolean {

        return true;
    }

}
