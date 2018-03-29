import {NgModule} from '@angular/core';
import {NgbModule} from '@ng-bootstrap/ng-bootstrap';
import {BrowserModule} from '@angular/platform-browser';
import {MatrixViewComponent} from './matrix-view.component';
import {GraphComponent} from './graph.component';
import {DotBuilder} from './dot-builder';
import {RouterModule} from '@angular/router';

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
        DotBuilder
    ]
})

export class MatrixModule { }