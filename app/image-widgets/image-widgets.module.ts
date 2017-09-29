import {NgModule} from '@angular/core';
import {BrowserModule} from '@angular/platform-browser';
import {FormsModule} from '@angular/forms';
import {RouterModule} from '@angular/router';
import {NgbModule} from '@ng-bootstrap/ng-bootstrap';
import {IdaiDocumentsModule} from 'idai-components-2/documents';
import {IdaiWidgetsModule} from 'idai-components-2/widgets';
import {IdaiMessagesModule} from 'idai-components-2/messages';
import {ImagePickerComponent} from './image-picker.component';
import {ThumbnailViewComponent} from "./thumbnail-view.component";
import {ImageGridComponent} from "./image-grid.component";
import {UploadModalComponent} from "./upload-modal.component";
import {DropAreaComponent} from "./drop-area.component";

@NgModule({
    imports: [
        BrowserModule,
        NgbModule,
        FormsModule,
        IdaiWidgetsModule,
        IdaiDocumentsModule,
        RouterModule,
        IdaiMessagesModule
    ],
    declarations: [
        ImagePickerComponent,
        ThumbnailViewComponent,
        ImageGridComponent,
        UploadModalComponent,
        DropAreaComponent
    ],
    providers: [
    ],
    exports: [
        ImagePickerComponent,
        ThumbnailViewComponent,
        ImageGridComponent, // export necessary?
    ],
    entryComponents: [
        ImagePickerComponent,
        UploadModalComponent
    ]
})

export class ImageWidgetsModule { }