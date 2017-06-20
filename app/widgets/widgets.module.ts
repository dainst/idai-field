import {NgModule} from '@angular/core';
import {BrowserModule} from '@angular/platform-browser';
import {NgbModule} from '@ng-bootstrap/ng-bootstrap';
import {FormsModule} from '@angular/forms';
import {IdaiDocumentsModule} from 'idai-components-2/documents';
import {DocumentViewComponent} from 'idai-components-2/documents';
import {RouterModule} from '@angular/router';
import {DocumentPickerComponent} from './document-picker.component';
import {DocumentTeaserComponent} from './document-teaser.component';
import {ThumbnailViewComponent} from './thumbnail-view.component';
import {DescriptionViewComponent} from './description-view.component';
import {ImagePickerComponent} from './image-picker.component';
import {IdaiWidgetsModule} from 'idai-components-2/widgets';
import {IdaiMessagesModule} from 'idai-components-2/messages';

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
        DocumentTeaserComponent,
        DocumentPickerComponent,
        ThumbnailViewComponent,
        DescriptionViewComponent,
        ImagePickerComponent,

    ],
    exports: [
        DocumentViewComponent,
        DocumentTeaserComponent,
        DocumentPickerComponent,
        ThumbnailViewComponent,
        DescriptionViewComponent
    ],
    entryComponents: [
        ImagePickerComponent
    ]
})

export class WidgetsModule {}