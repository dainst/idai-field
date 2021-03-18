import {Component, Output, EventEmitter, Input} from '@angular/core';


@Component({
    selector: 'zoom-buttons',
    templateUrl: './zoom-buttons.html'
})
/**
 * @author Thomas Kleinke
 */
export class ZoomButtonsComponent {

    @Input() zoomInEnabled: boolean = true;
    @Input() zoomOutEnabled: boolean = true;

    @Output() onZoomInClicked: EventEmitter<void> = new EventEmitter<void>();
    @Output() onZoomOutClicked: EventEmitter<void> = new EventEmitter<void>();


    public clickZoomIn() {

        if (this.zoomInEnabled) this.onZoomInClicked.emit();
    }


    public clickZoomOut() {

        if (this.zoomOutEnabled) this.onZoomOutClicked.emit();
    }
}
