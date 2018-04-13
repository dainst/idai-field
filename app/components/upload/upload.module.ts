import {NgModule} from '@angular/core';
import {BrowserModule} from '@angular/platform-browser';
import {IdaiWidgetsModule} from 'idai-components-2/widgets';
import {ImageUploader} from './image/image-uploader';
import {UploadStatus} from './upload-status';
import {UploadModalComponent} from './upload-modal.component';
import {ImageTypePickerModalComponent} from './image/image-type-picker-modal.component';
import {Model3DUploader} from './model3d/model-3d-uploader';
import {Model3DThumbnailCreatorModalComponent} from './model3d/model-3d-thumbnail-creator-modal.component';
import {Model3DViewerModule} from '../model-3d-viewer/model-3d-viewer';
import {UploadService} from './upload-service';


@NgModule({
    imports: [
        BrowserModule,
        IdaiWidgetsModule,
        Model3DViewerModule
    ],
    declarations: [
        UploadModalComponent,
        ImageTypePickerModalComponent,
        Model3DThumbnailCreatorModalComponent
    ],
    entryComponents: [
        UploadModalComponent,
        ImageTypePickerModalComponent,
        Model3DThumbnailCreatorModalComponent
    ],
    providers: [
        UploadService,
        ImageUploader,
        Model3DUploader,
        UploadStatus
    ]
})

export class UploadModule {}