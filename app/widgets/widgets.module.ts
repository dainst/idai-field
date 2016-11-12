import {NgModule} from '@angular/core';
import {BrowserModule} from '@angular/platform-browser';
import {SearchBarComponent} from './search-bar.component';
import {NgbModule} from '@ng-bootstrap/ng-bootstrap';
import {FormsModule} from '@angular/forms';
import {IdaiComponents2Module} from 'idai-components-2/idai-components-2';
import {TypeIconComponent} from './type-icon.component'
import {BasicResourceViewComponent} from './basic-resource-view.component';
import {DocumentViewComponent} from './document-view.component';
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
        BasicResourceViewComponent,
        DocumentViewComponent
    ],
    exports : [
        SearchBarComponent,
        TypeIconComponent,
        DocumentViewComponent
    ]
})

export class WidgetsModule {}