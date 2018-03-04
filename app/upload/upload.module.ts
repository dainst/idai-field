import {NgModule} from '@angular/core';
import {BrowserModule} from '@angular/platform-browser';
import {IdaiWidgetsModule} from 'idai-components-2/widgets';
import {ImageUploader} from './image/image-uploader';
import {UploadStatus} from './upload-status';
import {UploadModalComponent} from './upload-modal.component';
import {ImageTypePickerModalComponent} from './image/image-type-picker-modal.component';
import {Object3DUploader} from './object3d/object-3d-uploader';
import {Object3DThumbnailCreatorModalComponent} from './object3d/object-3d-thumbnail-creator-modal.component';
import {View3DModule} from '../components/view-3d/view-3d.module';

@NgModule({
    imports: [
        BrowserModule,
        IdaiWidgetsModule,
        View3DModule
    ],
    declarations: [
        UploadModalComponent,
        ImageTypePickerModalComponent,
        Object3DThumbnailCreatorModalComponent
    ],
    entryComponents: [
        UploadModalComponent,
        ImageTypePickerModalComponent,
        Object3DThumbnailCreatorModalComponent
    ],
    providers: [
        ImageUploader,
        Object3DUploader,
        UploadStatus
    ]
})

export class UploadModule {}