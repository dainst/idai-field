import {NgModule} from '@angular/core';
import {BrowserModule} from '@angular/platform-browser';
import {SearchBarComponent} from 'idai-components-2/widgets';
import {NgbModule} from '@ng-bootstrap/ng-bootstrap';
import {FormsModule} from '@angular/forms';
import {IdaiDocumentsModule} from 'idai-components-2/documents';
import {TypeIconComponent} from 'idai-components-2/widgets'
import {DocumentViewComponent} from './document-view.component';
import {DocumentEditWrapperComponent} from './document-edit-wrapper.component';
import {EditSaveDialogComponent} from './edit-save-dialog.component';
import {RouterModule} from '@angular/router';
import {DocumentPickerComponent} from './document-picker.component';
import {DocumentTeaserComponent} from './document-teaser.component';
import {ThumbnailViewComponent} from './thumbnail-view.component';
import {DescriptionViewComponent} from './description-view.component';
import {ImagePickerComponent} from './image-picker.component';
import {ConflictResolverComponent} from "./conflict-resolver.component";

@NgModule({
    imports: [
        BrowserModule,
        NgbModule,
        FormsModule,
        IdaiDocumentsModule,
        RouterModule
    ],
    declarations: [
        SearchBarComponent,
        TypeIconComponent,
        DocumentViewComponent,
        DocumentEditWrapperComponent,
        DocumentTeaserComponent,
        EditSaveDialogComponent,
        DocumentPickerComponent,
        ThumbnailViewComponent,
        DescriptionViewComponent,
        ImagePickerComponent,
        ConflictResolverComponent
    ],
    exports : [
        SearchBarComponent,
        TypeIconComponent,
        DocumentViewComponent,
        DocumentEditWrapperComponent,
        DocumentTeaserComponent,
        EditSaveDialogComponent,
        DocumentPickerComponent,
        ThumbnailViewComponent,
        DescriptionViewComponent
    ],
    entryComponents: [
        ImagePickerComponent,
        ConflictResolverComponent
    ]
})

export class WidgetsModule {}