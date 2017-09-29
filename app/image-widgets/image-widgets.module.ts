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
    ],
    providers: [
    ],
    exports: [
        ImagePickerComponent,
        ThumbnailViewComponent
    ],
    entryComponents: [
        ImagePickerComponent
    ]
})

export class ImageWidgetsModule { }