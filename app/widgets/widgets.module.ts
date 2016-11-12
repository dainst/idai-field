import {NgModule} from '@angular/core';
import {BrowserModule} from '@angular/platform-browser';
import {SearchBarComponent} from './search-bar.component';
import {NgbModule} from '@ng-bootstrap/ng-bootstrap';
import {FormsModule} from '@angular/forms';
import {IdaiComponents2Module} from 'idai-components-2/idai-components-2';
import {TypeIconComponent} from './type-icon.component'

@NgModule({
    imports: [
        BrowserModule,
        NgbModule,
        FormsModule,
        IdaiComponents2Module
    ],
    declarations: [
        SearchBarComponent,
        TypeIconComponent
    ],
    exports : [
        SearchBarComponent,
        TypeIconComponent
    ]
})

export class WidgetsModule {}