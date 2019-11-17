import {NgModule} from '@angular/core';
import {BrowserModule} from '@angular/platform-browser';
import {NgbModule} from '@ng-bootstrap/ng-bootstrap';
import {ImageViewComponent} from './image-view.component';
import {GeoreferenceViewComponent} from './georeference-view.component';
import {WidgetsModule} from '../../widgets/widgets.module';
import {ImageGridModule} from '../imagegrid/image-grid.module';
import {MediaDocumentsManager} from '../mediaoverview/view/media-documents-manager';
import {MediaOverviewFacade} from '../mediaoverview/view/media-overview-facade';
import {PersistenceHelper} from '../mediaoverview/service/persistence-helper';
import {DepictsRelationsViewComponent} from './depicts-relations-view.component';
import {Model3DViewerModule} from '../model-3d-viewer/model-3d-viewer.module';

@NgModule({
    imports: [
        BrowserModule,
        NgbModule,
        WidgetsModule,
        ImageGridModule,
        Model3DViewerModule
    ],
    declarations: [
        ImageViewComponent,
        GeoreferenceViewComponent,
        DepictsRelationsViewComponent,
    ],
    providers: [
        MediaDocumentsManager,
        MediaOverviewFacade,
        PersistenceHelper
    ],
    entryComponents: [
        ImageViewComponent
    ]
})

export class ImageViewModule {}