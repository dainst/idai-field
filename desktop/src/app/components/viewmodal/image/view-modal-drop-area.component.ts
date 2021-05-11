import {Component, EventEmitter, OnChanges, Output, SimpleChanges, ViewChild} from '@angular/core';
import {DropAreaComponent} from '../../image/grid/drop-area.component';
import {ImageUploader} from '../../image/upload/image-uploader';
import {Messages} from '../../messages/messages';


@Component({
    selector: 'view-modal-drop-area',
    templateUrl: './view-modal-drop-area.html'
})
/**
 */
export class ViewModalDropAreaComponent extends DropAreaComponent implements OnChanges {

    @ViewChild('popover', { static: false }) private popover: any;

    @Output() startEditImages = new EventEmitter<any>();

    public constructor(
        imageUploader: ImageUploader,
        messages: Messages
    ) {
        super(imageUploader, messages);
    }

    ngOnChanges(changes: SimpleChanges): void {
        console.log(changes)
    }
}
