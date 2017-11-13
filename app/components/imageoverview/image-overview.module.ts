import {NgModule} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {BrowserModule} from '@angular/platform-browser';
import {NgbModule} from '@ng-bootstrap/ng-bootstrap';
import {IdaiDocumentsModule} from 'idai-components-2/documents';
import {IdaiWidgetsModule} from 'idai-components-2/widgets'
import {imagesRouting} from './image-overview.routing';
import {ImageOverviewComponent} from './image-overview.component';
import {WidgetsModule} from '../../widgets/widgets.module';
import {LinkModalComponent} from './link-modal.component'
import {ImagesState} from './view/images-state';
import {ImageGridModule} from '../imagegrid/image-grid.module';
import {RemoveLinkModalComponent} from './remove-link-modal.component';
import {ImageOverviewTaskbarComponent} from "./image-overview-taskbar.component";

@NgModule({
    imports: [
        BrowserModule,
        FormsModule,
        NgbModule,
        imagesRouting,
        WidgetsModule,
        IdaiDocumentsModule,
        IdaiWidgetsModule,
        ImageGridModule
    ],
    declarations: [
        ImageOverviewComponent,
        ImageOverviewTaskbarComponent,
        LinkModalComponent,
        RemoveLinkModalComponent
    ],
    entryComponents: [
        LinkModalComponent,
        RemoveLinkModalComponent
    ],
    providers: [
        ImagesState
    ]
})

export class ImageOverviewModule {}