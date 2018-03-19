import {Component, Output, EventEmitter} from '@angular/core';


@Component({
    moduleId: module.id,
    selector: 'zoom-buttons',
    templateUrl: './zoom-buttons.html'
})
/**
 * @author Thomas Kleinke
 */
export class ZoomButtonsComponent {

    @Output() onZoomInClicked: EventEmitter<void> = new EventEmitter<void>();
    @Output() onZoomOutClicked: EventEmitter<void> = new EventEmitter<void>();


    public clickZoomIn() {

        this.onZoomInClicked.emit();
    }


    public clickZoomOut() {

        this.onZoomOutClicked.emit();
    }
}