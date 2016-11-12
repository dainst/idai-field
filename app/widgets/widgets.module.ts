import {NgModule} from '@angular/core';
import {BrowserModule} from '@angular/platform-browser';
import {SearchBarComponent} from './search-bar.component';
import {NgbModule} from '@ng-bootstrap/ng-bootstrap';
import {FormsModule} from '@angular/forms';
import {IdaiComponents2Module} from 'idai-components-2/idai-components-2';
import {TypeIconComponent} from './type-icon.component'
import {BasicResourceViewComponent} from './basic-resource-view.component'

@NgModule({
    imports: [
        BrowserModule,
        NgbModule,
        FormsModule,
        IdaiComponents2Module
    ],
    declarations: [
        SearchBarComponent,
        TypeIconComponent,
        BasicResourceViewComponent
    ],
    exports : [
        SearchBarComponent,
        TypeIconComponent,
        BasicResourceViewComponent
    ]
})

export class WidgetsModule {}