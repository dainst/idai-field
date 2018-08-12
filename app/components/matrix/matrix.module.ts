import {NgModule} from '@angular/core';
import {RouterModule} from '@angular/router';
import {BrowserModule} from '@angular/platform-browser';
import {FormsModule} from '@angular/forms';
import {NgbModule} from '@ng-bootstrap/ng-bootstrap';
import {MatrixViewComponent} from './matrix-view.component';
import {GraphComponent} from './graph.component';
import {MatrixState} from './matrix-state';
import {WidgetsModule} from '../../widgets/widgets.module';
import {MatrixOptionsMenuComponent} from './matrix-options-menu.component';
import {ZoomButtonsComponent} from './zoom-buttons.component';

@NgModule({
    imports: [
        BrowserModule,
        NgbModule,
        FormsModule,
        RouterModule,
        WidgetsModule
    ],
    declarations: [
        MatrixViewComponent,
        GraphComponent,
        MatrixOptionsMenuComponent,
        ZoomButtonsComponent
    ],
    providers: [
        MatrixState
    ]
})

export class MatrixModule { }