import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { ConfigurationComponent } from './configuration.component';
import { WidgetsModule } from '../widgets/widgets.module';
import { ConfigurationFieldComponent } from './configuration-field.component';
import { MultiLanguageInputComponent } from './editor/multi-language-input.component';
import { ConfigurationCategoryComponent } from './configuration-category.component';
import { AddFieldModalComponent } from './add/add-field-modal.component';
import { FieldEditorModalComponent } from './editor/field-editor-modal.component';
import { CategoryEditorModalComponent } from './editor/category-editor-modal.component';
import { CategoryPreviewComponent } from './add/category-preview.component';
import { CategoryListingComponent } from './add/category-listing.component';
import { AddCategoryFormModalComponent } from './add/add-category-form-modal.component';
import { ConfigurationFieldDragElement } from './configuration-field-drag-element.component';
import { AddGroupModalComponent } from './add/add-group-modal.component';
import { GroupEditorModalComponent } from './editor/group-editor-modal.component';
import { ConfigurationContextMenuComponent } from './context-menu/configuration-context-menu.component';
import { DeleteFieldModalComponent } from './delete/delete-field-modal.component';
import { DeleteGroupModalComponent } from './delete/delete-group-modal.component';
import { DeleteCategoryModalComponent } from './delete/delete-category-modal.component';
import { SaveModalComponent } from './save-modal.component';
import { FieldListingComponent } from './add/field-listing.component';
import { FieldPreviewComponent } from './add/field-preview.component';
import { ValuelistViewComponent } from './valuelist-view.component';


@NgModule({
    imports: [
        BrowserModule,
        FormsModule,
        NgbModule,
        WidgetsModule,
        DragDropModule
    ],
    declarations: [
        ConfigurationComponent,
        ConfigurationFieldComponent,
        ConfigurationCategoryComponent,
        MultiLanguageInputComponent,
        AddFieldModalComponent,
        AddGroupModalComponent,
        AddCategoryFormModalComponent,
        CategoryPreviewComponent,
        FieldPreviewComponent,
        CategoryListingComponent,
        FieldListingComponent,
        FieldEditorModalComponent,
        GroupEditorModalComponent,
        CategoryEditorModalComponent,
        ConfigurationFieldDragElement,
        ConfigurationContextMenuComponent,
        DeleteFieldModalComponent,
        DeleteGroupModalComponent,
        DeleteCategoryModalComponent,
        SaveModalComponent,
        ValuelistViewComponent
    ],
    exports: [
        ConfigurationComponent
    ],
    entryComponents: [
        ConfigurationComponent,
        AddFieldModalComponent,
        AddGroupModalComponent,
        FieldEditorModalComponent,
        GroupEditorModalComponent,
        CategoryEditorModalComponent,
        DeleteFieldModalComponent,
        DeleteGroupModalComponent,
        DeleteCategoryModalComponent,
        SaveModalComponent
    ]
})

export class ConfigurationModule {}
