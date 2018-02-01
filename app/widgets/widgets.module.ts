import {NgModule} from '@angular/core';
import {BrowserModule} from '@angular/platform-browser';
import {FormsModule} from '@angular/forms';
import {RouterModule} from '@angular/router';
import {NgbModule} from '@ng-bootstrap/ng-bootstrap';
import {IdaiDocumentsModule} from 'idai-components-2/documents';
import {IdaiWidgetsModule} from 'idai-components-2/widgets';
import {IdaiMessagesModule} from 'idai-components-2/messages';
import {DocumentPickerComponent} from './document-picker.component';
import {DescriptionViewComponent} from './description-view.component';
import {Loading} from './loading';
import {LoadingIconComponent} from './loading-icon.component';
import {SearchBarComponent} from './search-bar.component';

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
        DocumentPickerComponent,
        DescriptionViewComponent,
        LoadingIconComponent,
        SearchBarComponent
    ],
    providers: [
        Loading
    ],
    exports: [
        DocumentPickerComponent,
        DescriptionViewComponent,
        LoadingIconComponent,
        SearchBarComponent
    ],
    entryComponents: [
    ]
})

export class WidgetsModule {}