import {NgModule} from '@angular/core';
import {BrowserModule} from '@angular/platform-browser';
import {resourceOverviewRouting} from './resource-overview/resource-overview.routing';
import {ResourceOverviewComponent} from './resource-overview/resource-overview.component';
import {DocumentViewComponent} from './document-view/document-view.component';
import {DocumentEditWrapperComponent} from './document-edit-wrapper.component';
import {IdaiComponents2Module} from 'idai-components-2/idai-components-2';
import {MapWrapperComponent} from './resource-overview/map-wrapper.component';
import {NgbModule} from '@ng-bootstrap/ng-bootstrap';
import {MapComponent} from './map/map.component';
import {PlusButtonComponent} from './plus-button.component';
import {MapState} from './map/map-state';
import {WidgetsModule} from '../widgets/widgets.module'

@NgModule({
    imports: [
        resourceOverviewRouting,
        BrowserModule,
        NgbModule,
        IdaiComponents2Module,
        WidgetsModule
    ],
    declarations: [
        ResourceOverviewComponent,
        DocumentViewComponent,
        DocumentEditWrapperComponent,
        MapWrapperComponent,
        MapComponent,
        PlusButtonComponent
    ],
    providers: [
        MapState
    ]
})

export class OverviewModule {}