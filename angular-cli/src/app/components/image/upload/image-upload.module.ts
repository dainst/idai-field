import {NgModule} from '@angular/core';
import {BrowserModule} from '@angular/platform-browser';
import {ImageUploader} from './image-uploader';
import {UploadStatus} from './upload-status';
import {UploadModalComponent} from './upload-modal.component';
import {ImageCategoryPickerModalComponent} from './image-category-picker-modal.component';
import {WidgetsModule} from '../../widgets/widgets.module';

@NgModule({
    imports: [
        BrowserModule,
        WidgetsModule
    ],
    declarations: [
        UploadModalComponent,
        ImageCategoryPickerModalComponent
    ],
    entryComponents: [
        UploadModalComponent,
        ImageCategoryPickerModalComponent
    ],
    providers: [
        ImageUploader,
        UploadStatus
    ]
})

export class ImageUploadModule {}