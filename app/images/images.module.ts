import {NgModule} from '@angular/core';
import {BrowserModule} from '@angular/platform-browser';
import {NgbModule} from '@ng-bootstrap/ng-bootstrap';
import {IdaiDocumentsModule} from 'idai-components-2/documents';
import {IdaiWidgetsModule} from 'idai-components-2/widgets'
import {imagesRouting} from './images.routing';
import {ImagesComponent} from './images.component';
import {ImageGridComponent} from './image-grid.component';
import {ImageViewComponent} from './image-view.component';
import {GeoreferenceViewComponent} from './georeference-view.component';
import {WidgetsModule} from '../widgets/widgets.module';
import {LinkModalComponent} from './link-modal.component'
import {DropAreaComponent} from './drop-area.component';
import {ImageTypePickerModalComponent} from './image-type-picker-modal.component';
import {UploadModalComponent} from './upload-modal.component';
import {UploadStatus} from './upload-status';
import {ImagesState} from './images-state';


@NgModule({
    imports: [
        BrowserModule,
        NgbModule,
        imagesRouting,
        WidgetsModule,
        IdaiDocumentsModule,
        IdaiWidgetsModule
    ],
    declarations: [
        ImagesComponent,
        ImageGridComponent,
        ImageViewComponent,
        GeoreferenceViewComponent,
        LinkModalComponent,
        DropAreaComponent,
        ImageTypePickerModalComponent,
        UploadModalComponent,
    ],
    entryComponents: [
        LinkModalComponent,
        ImageTypePickerModalComponent,
        UploadModalComponent
    ],
    providers: [
        UploadStatus,
        ImagesState
    ]
})

export class ImagesModule {}