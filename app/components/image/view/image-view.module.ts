import {NgModule} from '@angular/core';
import {BrowserModule} from '@angular/platform-browser';
import {NgbModule} from '@ng-bootstrap/ng-bootstrap';
import {ImageViewComponent} from './image-view.component';
import {GeoreferenceViewComponent} from './georeference-view.component';
import {WidgetsModule} from '../../../widgets/widgets.module';
import {ImageGridModule} from '../grid/image-grid.module';
import {ImageDocumentsManager} from '../overview/view/image-documents-manager';
import {ImageOverviewFacade} from '../overview/view/imageoverview-facade';
import {PersistenceHelper} from '../overview/service/persistence-helper';
import {DepictsRelationsViewComponent} from './depicts-relations-view.component';

@NgModule({
    imports: [
        BrowserModule,
        NgbModule,
        WidgetsModule,
        ImageGridModule
    ],
    declarations: [
        ImageViewComponent,
        GeoreferenceViewComponent,
        DepictsRelationsViewComponent
    ],
    providers: [
        ImageDocumentsManager,
        ImageOverviewFacade,
        PersistenceHelper
    ],
    entryComponents: [
        ImageViewComponent
    ]
})

export class ImageViewModule {}