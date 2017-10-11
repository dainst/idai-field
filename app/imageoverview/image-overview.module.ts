import {NgModule} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {BrowserModule} from '@angular/platform-browser';
import {NgbModule} from '@ng-bootstrap/ng-bootstrap';
import {IdaiDocumentsModule} from 'idai-components-2/documents';
import {IdaiWidgetsModule} from 'idai-components-2/widgets'
import {imagesRouting} from './image-overview.routing';
import {ImageOverviewComponent} from './image-overview.component';
import {WidgetsModule} from '../widgets/widgets.module';
import {LinkModalComponent} from './link-modal.component'
import {UploadStatus} from '../imagegrid/upload-status';
import {ImagesState} from './images-state';
import {ImageGridModule} from '../imagegrid/image-grid.module';
import {RemoveLinkModalComponent} from './remove-link-modal.component';

@NgModule({
    imports: [
        BrowserModule,
        FormsModule,
        NgbModule,
        imagesRouting,
        WidgetsModule,
        IdaiDocumentsModule,
        IdaiWidgetsModule,
        ImageGridModule,
    ],
    declarations: [
        ImageOverviewComponent,
        LinkModalComponent,
        RemoveLinkModalComponent
    ],
    entryComponents: [
        LinkModalComponent,
        RemoveLinkModalComponent
    ],
    providers: [
        UploadStatus,
        ImagesState
    ]
})

export class ImageOverviewModule {}