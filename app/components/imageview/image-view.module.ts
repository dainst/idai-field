import {NgModule} from '@angular/core';
import {BrowserModule} from '@angular/platform-browser';
import {NgbModule} from '@ng-bootstrap/ng-bootstrap';
import {IdaiDocumentsModule} from 'idai-components-2/documents';
import {IdaiWidgetsModule} from 'idai-components-2/widgets';
import {ImageViewComponent} from './image-view.component';
import {GeoreferenceViewComponent} from './georeference-view.component';
import {WidgetsModule} from '../../widgets/widgets.module';
import {ImageGridModule} from '../imagegrid/image-grid.module';
import {imageViewRouting} from './image-view.routing';
import {ImageDocumentsManager} from '../imageoverview/view/image-documents-manager';
import {ImageOverviewFacade} from '../imageoverview/view/imageoverview-facade';
import {PersistenceHelper} from '../imageoverview/service/persistence-helper';

@NgModule({
    imports: [
        BrowserModule,
        NgbModule,
        WidgetsModule,
        IdaiDocumentsModule,
        IdaiWidgetsModule,
        ImageGridModule,
        imageViewRouting
    ],
    declarations: [
        ImageViewComponent,
        GeoreferenceViewComponent
    ],
    providers: [
        ImageDocumentsManager,
        ImageOverviewFacade,
        PersistenceHelper
    ]
})

export class ImageViewModule {}