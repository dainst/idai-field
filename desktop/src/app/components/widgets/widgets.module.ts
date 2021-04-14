import {NgModule} from '@angular/core';
import {BrowserModule} from '@angular/platform-browser';
import {FormsModule} from '@angular/forms';
import {RouterModule} from '@angular/router';
import {NgbModule} from '@ng-bootstrap/ng-bootstrap';
import {DocumentPickerComponent} from './document-picker.component';
import {Loading} from './loading';
import {LoadingIconComponent} from './loading-icon.component';
import {SearchBarComponent} from './search-bar.component';
import {CategoryPickerComponent} from './category-picker.component';
import {ZoomButtonsComponent} from './zoom-buttons.component';
import {FieldsViewComponent} from './documentinfo/fields-view.component';
import {DocumentTeaserComponent} from './document-teaser.component';
import {CategoryIconComponent} from './category-icon.component';
import {DocumentInfoComponent} from './documentinfo/document-info.component';
import {GeoreferenceViewComponent} from './documentinfo/georeference-view.component';
import {DepictsRelationsViewComponent} from './documentinfo/depicts-relations-view.component';
import {ThumbnailComponent} from './documentinfo/thumbnail.component';
import {IdaiMessagesModule} from '../messages/idai-messages.module';
import {PagingButtonsComponent} from './paging-buttons.component';
import {SearchConstraintsComponent} from './search-constraints.component';


@NgModule({
    imports: [
        BrowserModule,
        NgbModule,
        FormsModule,
        RouterModule,
        IdaiMessagesModule
    ],
    declarations: [
        DocumentPickerComponent,
        DocumentTeaserComponent,
        DocumentInfoComponent,
        FieldsViewComponent,
        GeoreferenceViewComponent,
        DepictsRelationsViewComponent,
        ThumbnailComponent,
        LoadingIconComponent,
        SearchBarComponent,
        CategoryPickerComponent,
        ZoomButtonsComponent,
        CategoryIconComponent,
        PagingButtonsComponent,
        SearchConstraintsComponent as any // any became necessary after an angular update because class is abstract, which has always been like this and I also saw it being recommended; npm run i18n now works due to this change here
    ],
    providers: [
        Loading
    ],
    exports: [
        DocumentPickerComponent,
        DocumentTeaserComponent,
        DocumentInfoComponent,
        FieldsViewComponent,
        ThumbnailComponent,
        LoadingIconComponent,
        SearchBarComponent,
        CategoryPickerComponent,
        ZoomButtonsComponent,
        CategoryIconComponent,
        PagingButtonsComponent
    ],
    entryComponents: []
})

export class WidgetsModule {}
