import {NgModule} from '@angular/core';
import {BrowserModule} from '@angular/platform-browser';
import {NgbModule} from '@ng-bootstrap/ng-bootstrap';
import {FormsModule} from '@angular/forms';
import {IdaiDocumentsModule} from 'idai-components-2/documents';
import {DoceditWrapperComponent} from './docedit-wrapper.component';
import {RouterModule} from '@angular/router';
import {IdaiWidgetsModule} from 'idai-components-2/widgets';
import {IdaiMessagesModule} from 'idai-components-2/messages';
import {WidgetsModule} from "../widgets/widgets.module";
import {EditModalComponent} from "./edit-modal.component";
import {DoceditImageTabComponent} from "./docedit-image-tab.component";
import {ConflictResolverComponent} from "./conflict-resolver.component";
import {ConflictModalComponent} from "./conflict-modal.component";
import {ConflictDeletedModalComponent} from "./conflict-deleted-modal.component";
import {EditSaveDialogComponent} from "./edit-save-dialog.component";


@NgModule({
    imports: [
        BrowserModule,
        NgbModule,
        FormsModule,
        IdaiWidgetsModule,
        IdaiDocumentsModule,
        RouterModule,
        IdaiMessagesModule,
        WidgetsModule,
    ],
    declarations: [
        ConflictModalComponent,
        ConflictDeletedModalComponent,
        DoceditWrapperComponent,
        EditSaveDialogComponent,
        DoceditImageTabComponent,
        EditModalComponent,
        ConflictResolverComponent
    ],
    exports: [
        EditSaveDialogComponent,
        DoceditWrapperComponent
    ],
    entryComponents: [
        EditModalComponent,
        ConflictModalComponent,
        ConflictDeletedModalComponent
    ]
})

export class DoceditModule {}