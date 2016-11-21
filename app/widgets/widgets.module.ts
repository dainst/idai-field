import {NgModule} from '@angular/core';
import {BrowserModule} from '@angular/platform-browser';
import {SearchBarComponent} from './search-bar.component';
import {NgbModule} from '@ng-bootstrap/ng-bootstrap';
import {FormsModule} from '@angular/forms';
import {IdaiDocumentsModule} from 'idai-components-2/documents';
import {TypeIconComponent} from './type-icon.component'
import {DocumentViewComponent} from './document-view.component';
import {DocumentEditWrapperComponent} from './document-edit-wrapper.component';
import {EditSaveDialogComponent} from './edit-save-dialog.component';
import {RouterModule} from '@angular/router';
import {DropAreaComponent} from './drop-area.component';

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
        EditSaveDialogComponent,
        DropAreaComponent
    ],
    exports : [
        SearchBarComponent,
        TypeIconComponent,
        DocumentViewComponent,
        DocumentEditWrapperComponent,
        EditSaveDialogComponent,
        DropAreaComponent
    ]
})

export class WidgetsModule {}