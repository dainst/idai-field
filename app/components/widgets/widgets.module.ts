import {NgModule} from '@angular/core';
import {BrowserModule} from '@angular/platform-browser';
import {FormsModule} from '@angular/forms';
import {RouterModule} from '@angular/router';
import {NgbModule} from '@ng-bootstrap/ng-bootstrap';
import {IdaiMessagesModule} from 'idai-components-2';
import {DocumentPickerComponent} from './document-picker.component';
import {Loading} from './loading';
import {LoadingIconComponent} from './loading-icon.component';
import {SearchBarComponent} from './search-bar.component';
import {TypePickerComponent} from './type-picker.component';
import {ZoomButtonsComponent} from './zoom-buttons.component';
import {FieldsViewComponent} from './documentinfo/fields-view.component';
import {DocumentTeaserComponent} from './document-teaser.component';
import {TypeIconComponent} from './type-icon.component';
import {DocumentInfoComponent} from './documentinfo/document-info.component';
import {GeoreferenceViewComponent} from './documentinfo/georeference-view.component';
import {DepictsRelationsViewComponent} from './documentinfo/depicts-relations-view.component';
import {ThumbnailComponent} from './documentinfo/thumbnail.component';

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
        TypePickerComponent,
        ZoomButtonsComponent,
        TypeIconComponent
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
        TypePickerComponent,
        ZoomButtonsComponent,
        TypeIconComponent
    ],
    entryComponents: []
})

export class WidgetsModule {}