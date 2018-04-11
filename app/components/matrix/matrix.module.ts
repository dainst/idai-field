import {NgModule} from '@angular/core';
import {NgbModule} from '@ng-bootstrap/ng-bootstrap';
import {BrowserModule} from '@angular/platform-browser';
import {MatrixViewComponent} from './matrix-view.component';
import {GraphComponent} from './graph.component';
import {RouterModule} from '@angular/router';
import {MatrixState} from './matrix-state';

@NgModule({
    imports: [
        BrowserModule,
        NgbModule,
        RouterModule
    ],
    declarations: [
        MatrixViewComponent,
        GraphComponent
    ],
    providers: [
        MatrixState
    ]
})

export class MatrixModule { }