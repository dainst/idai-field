import { Component, EventEmitter, Output } from '@angular/core';
import { DropAreaComponent } from '../../image/grid/drop-area.component';
import { ImageUploader } from '../../image/upload/image-uploader';
import { Messages } from '../../messages/messages';
import { AppState } from '../../../services/app-state';


@Component({
    selector: 'view-modal-drop-area',
    templateUrl: './view-modal-drop-area.html'
})
export class ViewModalDropAreaComponent extends DropAreaComponent {

    @Output() startEditImages = new EventEmitter<any>();


    public constructor(imageUploader: ImageUploader,
                       messages: Messages,
                       appState: AppState) {

        super(imageUploader, messages, appState);
    }
}
