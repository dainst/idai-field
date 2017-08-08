import {NgModule} from '@angular/core';
import {BrowserModule} from '@angular/platform-browser';
import {FormsModule} from '@angular/forms';
import {RouterModule} from '@angular/router';
import {NgbModule} from '@ng-bootstrap/ng-bootstrap';
import {IdaiDocumentsModule} from 'idai-components-2/documents';
import {DocumentViewComponent} from 'idai-components-2/documents';
import {IdaiWidgetsModule} from 'idai-components-2/widgets';
import {IdaiMessagesModule} from 'idai-components-2/messages';
import {DocumentPickerComponent} from './document-picker.component';
import {DocumentTeaserComponent} from './document-teaser.component';
import {ThumbnailViewComponent} from './thumbnail-view.component';
import {DescriptionViewComponent} from './description-view.component';
import {ImagePickerComponent} from './image-picker.component';
import {Loading} from './loading';
import {LoadingIconComponent} from './loading-icon.component';

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
        LoadingIconComponent
    ],
    providers: [
        Loading
    ],
    exports: [
        DocumentViewComponent,
        DocumentTeaserComponent,
        DocumentPickerComponent,
        ThumbnailViewComponent,
        DescriptionViewComponent,
        LoadingIconComponent
    ],
    entryComponents: [
        ImagePickerComponent
    ]
})

export class WidgetsModule {}