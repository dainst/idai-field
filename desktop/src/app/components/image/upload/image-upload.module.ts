import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { ImageUploader } from './image-uploader';
import { UploadStatus } from './upload-status';
import { UploadModalComponent } from './upload-modal.component';
import { ImageUploadMetadataModalComponent } from './image-upload-metadata-modal.component';
import { WidgetsModule } from '../../widgets/widgets.module';


@NgModule({
    imports: [
        BrowserModule,
        WidgetsModule
    ],
    declarations: [
        UploadModalComponent,
        ImageUploadMetadataModalComponent
    ],
    entryComponents: [
        UploadModalComponent,
        ImageUploadMetadataModalComponent
    ],
    providers: [
        ImageUploader,
        UploadStatus
    ]
})

export class ImageUploadModule {}
