import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { ColorPickerModule } from 'ngx-color-picker';
import { ProjectConfigurationComponent } from './project-configuration.component';
import { WidgetsModule } from '../widgets/widgets.module';
import { ConfigurationFieldComponent } from './configuration-field.component';
import { ConfigurationRelationComponent } from './configuration-relation.component';
import { MultiLanguageInputComponent } from './editor/multi-language-input.component';
import { ConfigurationCategoryComponent } from './configuration-category.component';
import { AddFieldModalComponent } from './add-field-modal.component';
import { FieldEditorModalComponent } from './editor/field-editor-modal.component';
import { CategoryEditorModalComponent } from './editor/category-editor-modal.component';
import { AddCategoryModalComponent } from './add-category-modal.component';
import { ConfigurationFieldDragElement } from './configuration-field-drag-element.component';


@NgModule({
    imports: [
        BrowserModule,
        FormsModule,
        NgbModule,
        WidgetsModule,
        ColorPickerModule,
        DragDropModule
    ],
    declarations: [
        ProjectConfigurationComponent,
        ConfigurationFieldComponent,
        ConfigurationCategoryComponent,
        ConfigurationRelationComponent,
        MultiLanguageInputComponent,
        AddFieldModalComponent,
        AddCategoryModalComponent,
        FieldEditorModalComponent,
        CategoryEditorModalComponent,
        ConfigurationFieldDragElement
    ],
    exports: [
        ProjectConfigurationComponent
    ],
    entryComponents: [
        ProjectConfigurationComponent,
        AddFieldModalComponent,
        AddCategoryModalComponent,
        FieldEditorModalComponent,
        CategoryEditorModalComponent
    ]
})

export class ConfigurationModule {}