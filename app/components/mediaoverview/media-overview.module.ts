import {NgModule} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {BrowserModule} from '@angular/platform-browser';
import {NgbModule} from '@ng-bootstrap/ng-bootstrap';
import {IdaiDocumentsModule, IdaiWidgetsModule} from 'idai-components-2';
import {mediaRouting} from './media-overview.routing';
import {MediaOverviewComponent} from './media-overview.component';
import {WidgetsModule} from '../../widgets/widgets.module';
import {LinkModalComponent} from './link-modal.component'
import {MediaState} from './view/media-state';
import {ImageGridModule} from '../imagegrid/image-grid.module';
import {RemoveLinkModalComponent} from './remove-link-modal.component';
import {MediaOverviewTaskbarComponent} from './media-overview-taskbar.component';
import {MediaOverviewFacade} from './view/media-overview-facade';
import {MediaDocumentsManager} from './view/media-documents-manager';
import {PersistenceHelper} from './service/persistence-helper';


@NgModule({
    imports: [
        BrowserModule,
        FormsModule,
        NgbModule,
        mediaRouting,
        WidgetsModule,
        IdaiDocumentsModule,
        IdaiWidgetsModule,
        ImageGridModule
    ],
    declarations: [
        MediaOverviewComponent,
        MediaOverviewTaskbarComponent,
        LinkModalComponent,
        RemoveLinkModalComponent
    ],
    entryComponents: [
        LinkModalComponent,
        RemoveLinkModalComponent
    ],
    providers: [
        MediaState,
        MediaOverviewFacade,
        MediaDocumentsManager,
        PersistenceHelper
    ]
})

export class MediaOverviewModule {}