import {NgModule} from '@angular/core';
import {BrowserModule} from '@angular/platform-browser';
import {FormsModule} from '@angular/forms';
import {RouterModule} from '@angular/router';
import {NgbModule} from '@ng-bootstrap/ng-bootstrap';
import {IdaiDocumentsModule, IdaiWidgetsModule, IdaiMessagesModule} from 'idai-components-2';
import {DocumentPickerComponent} from './document-picker.component';
import {Loading} from './loading';
import {LoadingIconComponent} from './loading-icon.component';
import {SearchBarComponent} from './search-bar.component';
import {TypePickerComponent} from './type-picker.component';
import {ZoomButtonsComponent} from './zoom-buttons.component';
import {FieldsViewComponent} from './fields-view.component';

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
        FieldsViewComponent,
        LoadingIconComponent,
        SearchBarComponent,
        TypePickerComponent,
        ZoomButtonsComponent
    ],
    providers: [
        Loading
    ],
    exports: [
        DocumentPickerComponent,
        FieldsViewComponent,
        LoadingIconComponent,
        SearchBarComponent,
        TypePickerComponent,
        ZoomButtonsComponent
    ],
    entryComponents: [
    ]
})

export class WidgetsModule {}