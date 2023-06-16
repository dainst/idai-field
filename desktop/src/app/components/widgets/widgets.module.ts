import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { DocumentPickerComponent } from './document-picker.component';
import { Loading } from './loading';
import { LoadingIconComponent } from './loading-icon.component';
import { SearchBarComponent } from './search-bar.component';
import { CategoryPickerComponent } from './category-picker.component';
import { ZoomButtonsComponent } from './zoom-buttons.component';
import { FieldsViewComponent } from './document-info/fields-view/fields-view.component';
import { DocumentTeaserComponent } from './document-teaser.component';
import { CategoryIconComponent } from './category-icon.component';
import { DocumentInfoComponent } from './document-info/document-info.component';
import { GeoreferenceViewComponent } from './document-info/georeference-view.component';
import { DepictsRelationsViewComponent } from './document-info/depicts-relations-view.component';
import { ThumbnailComponent } from './document-info/thumbnail.component';
import { IdaiMessagesModule } from '../messages/idai-messages.module';
import { PagingButtonsComponent } from './paging-buttons.component';
import { SearchConstraintsComponent } from './search-constraints.component';
import { EditSaveDialogComponent } from './edit-save-dialog.component';
import { FieldViewComponent } from './document-info/fields-view/field-view.component';
import { LanguagesListComponent } from './languages/languages-list.component';
import { DefaultFieldViewComponent } from './document-info/fields-view/default-field-view.component';
import { UrlFieldViewComponent } from './document-info/fields-view/url-field-view.component';


@NgModule({
    imports: [
        BrowserModule,
        NgbModule,
        FormsModule,
        RouterModule,
        IdaiMessagesModule,
        DragDropModule
    ],
    declarations: [
        DocumentPickerComponent,
        DocumentTeaserComponent,
        DocumentInfoComponent,
        FieldsViewComponent,
        FieldViewComponent,
        DefaultFieldViewComponent,
        UrlFieldViewComponent,
        GeoreferenceViewComponent,
        DepictsRelationsViewComponent,
        ThumbnailComponent,
        LoadingIconComponent,
        SearchBarComponent,
        CategoryPickerComponent,
        ZoomButtonsComponent,
        CategoryIconComponent,
        PagingButtonsComponent,
        EditSaveDialogComponent,
        LanguagesListComponent,
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
        FieldViewComponent,
        ThumbnailComponent,
        LoadingIconComponent,
        SearchBarComponent,
        CategoryPickerComponent,
        ZoomButtonsComponent,
        CategoryIconComponent,
        PagingButtonsComponent,
        EditSaveDialogComponent,
        LanguagesListComponent
    ],
    entryComponents: []
})

export class WidgetsModule {}
