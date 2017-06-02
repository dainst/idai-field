import {NgModule} from '@angular/core';
import {BrowserModule} from '@angular/platform-browser';
import {NgbModule} from '@ng-bootstrap/ng-bootstrap';
import {FormsModule} from '@angular/forms';
import {IdaiDocumentsModule} from 'idai-components-2/documents';
import {DocumentViewComponent} from 'idai-components-2/documents';
import {DocumentEditWrapperComponent} from './document-edit-wrapper.component';
import {EditSaveDialogComponent} from './edit-save-dialog.component';
import {RouterModule} from '@angular/router';
import {DocumentPickerComponent} from './document-picker.component';
import {DocumentTeaserComponent} from './document-teaser.component';
import {ThumbnailViewComponent} from './thumbnail-view.component';
import {DescriptionViewComponent} from './description-view.component';
import {ImagePickerComponent} from './image-picker.component';
import {ConflictModalComponent} from './conflict-modal.component';
import {ConflictResolverComponent} from './conflict-resolver.component';
import {IdaiWidgetsModule} from 'idai-components-2/widgets';
import {EditModalComponent} from './edit-modal.component';
import {ListComponent} from './list.component';
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
        DocumentEditWrapperComponent,
        DocumentTeaserComponent,
        EditSaveDialogComponent,
        DocumentPickerComponent,
        ThumbnailViewComponent,
        DescriptionViewComponent,
        ImagePickerComponent,
        ConflictModalComponent,
        ConflictResolverComponent,
        EditModalComponent,
        ListComponent
    ],
    exports: [
        DocumentViewComponent,
        DocumentEditWrapperComponent,
        DocumentTeaserComponent,
        EditSaveDialogComponent,
        DocumentPickerComponent,
        ThumbnailViewComponent,
        DescriptionViewComponent,
        ListComponent
    ],
    entryComponents: [
        ImagePickerComponent,
        ConflictModalComponent,
        EditModalComponent
    ]
})

export class WidgetsModule {}