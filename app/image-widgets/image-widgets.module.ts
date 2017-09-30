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
import {ImageGridBuilder} from "./image-grid-builder";
import {Imagestore} from "../imagestore/imagestore";
import {ImageTypePickerModalComponent} from "./image-type-picker-modal.component";

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
        DropAreaComponent,
        ImageTypePickerModalComponent
    ],
    providers: [
        {
            provide: ImageGridBuilder,
            useFactory: (imageStore: Imagestore) => {
                return new ImageGridBuilder(imageStore, true);
            },
            deps: [Imagestore]
        },
    ],
    exports: [
        ImagePickerComponent,
        ThumbnailViewComponent,
        ImageGridComponent, // export necessary?
    ],
    entryComponents: [
        ImagePickerComponent,
        UploadModalComponent,
        ImageTypePickerModalComponent
    ]
})

export class ImageWidgetsModule { }