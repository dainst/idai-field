import {NgModule} from '@angular/core';
import {BrowserModule} from '@angular/platform-browser';
import {NgbModule} from '@ng-bootstrap/ng-bootstrap';
import {IdaiDocumentsModule} from 'idai-components-2/documents';
import {IdaiWidgetsModule} from 'idai-components-2/widgets'
import {imagesRouting} from './images.routing';
import {ImagesComponent} from './images.component';
import {ImageOverviewComponent} from './image-overview.component';
import {ImageViewComponent} from './image-view.component';
import {GeoreferenceViewComponent} from './georeference-view.component';
import {WidgetsModule} from '../widgets/widgets.module';
import {LinkModalComponent} from './link-modal.component'
import {DropAreaComponent} from '../image-widgets/drop-area.component';
import {ImageTypePickerModalComponent} from './image-type-picker-modal.component';
import {UploadModalComponent} from '../image-widgets/upload-modal.component';
import {UploadStatus} from '../image-widgets/upload-status';
import {ImagesState} from './images-state';
import {ImageWidgetsModule} from "../image-widgets/image-widgets.module";

@NgModule({
    imports: [
        BrowserModule,
        NgbModule,
        imagesRouting,
        WidgetsModule,
        IdaiDocumentsModule,
        IdaiWidgetsModule,
        ImageWidgetsModule
    ],
    declarations: [
        ImagesComponent,
        ImageOverviewComponent,
        ImageViewComponent,
        GeoreferenceViewComponent,
        LinkModalComponent,
        ImageTypePickerModalComponent
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