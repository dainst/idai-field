import {NgModule} from '@angular/core';
import {BrowserModule} from '@angular/platform-browser';
import {NgbModule} from '@ng-bootstrap/ng-bootstrap';
import {FormsModule} from '@angular/forms';
import {IdaiDocumentsModule} from 'idai-components-2/documents';
import {DoceditComponent} from './docedit.component';
import {RouterModule} from '@angular/router';
import {IdaiWidgetsModule} from 'idai-components-2/widgets';
import {IdaiMessagesModule} from 'idai-components-2/messages';
import {WidgetsModule} from '../widgets/widgets.module';
import {DoceditImageTabComponent} from './docedit-image-tab.component';
import {DoceditConflictsTabComponent} from './docedit-conflicts-tab.component';
import {ConflictDeletedModalComponent} from './conflict-deleted-modal.component';
import {EditSaveDialogComponent} from './edit-save-dialog.component';
import {TypeSwitcherButtonComponent} from './type-switcher-button.component';
import {ImageWidgetsModule} from "../image-widgets/image-widgets.module";


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
        ImageWidgetsModule
    ],
    declarations: [
        ConflictDeletedModalComponent,
        DoceditComponent,
        EditSaveDialogComponent,
        DoceditImageTabComponent,
        DoceditConflictsTabComponent,
        TypeSwitcherButtonComponent
    ],
    exports: [
        EditSaveDialogComponent,
        DoceditComponent
    ],
    entryComponents: [
        DoceditComponent,
        ConflictDeletedModalComponent
    ]
})

export class DoceditModule {}