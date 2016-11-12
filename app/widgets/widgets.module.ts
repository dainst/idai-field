import {NgModule} from '@angular/core';
import {BrowserModule} from '@angular/platform-browser';
import {SearchBarComponent} from './search-bar.component';
import {NgbModule} from '@ng-bootstrap/ng-bootstrap';
import {FormsModule} from '@angular/forms';
import {IdaiComponents2Module} from 'idai-components-2/idai-components-2';
import {TypeIconComponent} from './type-icon.component'
import {RelationsViewComponent} from './relations-view.component';
import {FieldsViewComponent} from './fields-view.component';
import {DocumentViewComponent} from './document-view.component';
import {DocumentEditWrapperComponent} from './document-edit-wrapper.component';
import {RouterModule} from '@angular/router';

@NgModule({
    imports: [
        BrowserModule,
        NgbModule,
        FormsModule,
        IdaiComponents2Module,
        RouterModule
    ],
    declarations: [
        SearchBarComponent,
        TypeIconComponent,
        RelationsViewComponent,
        FieldsViewComponent,
        DocumentViewComponent,
        DocumentEditWrapperComponent
    ],
    exports : [
        SearchBarComponent,
        TypeIconComponent,
        DocumentViewComponent,
        DocumentEditWrapperComponent
    ]
})

export class WidgetsModule {}