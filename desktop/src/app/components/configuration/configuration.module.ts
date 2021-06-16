import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { ProjectConfigurationComponent } from './project-configuration.component';
import { WidgetsModule } from '../widgets/widgets.module';
import { ConfigurationFieldComponent } from './configuration-field.component';
import { ConfigurationRelationComponent } from './configuration-relation.component';
import { MultiLanguageInputComponent } from './multi-language-input.component';
import { ConfigurationCategoryComponent } from './configuration-category.component';
import { AddFieldModalComponent } from './add-field-modal.component';
import { FieldEditorModalComponent } from './field-editor-modal.component';
import { CategoryEditorModalComponent } from './category-editor-modal.component';


@NgModule({
    imports: [
        BrowserModule,
        FormsModule,
        NgbModule,
        WidgetsModule
    ],
    declarations: [
        ProjectConfigurationComponent,
        ConfigurationCategoryComponent,
        ConfigurationFieldComponent,
        ConfigurationRelationComponent,
        MultiLanguageInputComponent,
        AddFieldModalComponent,
        FieldEditorModalComponent,
        CategoryEditorModalComponent
    ],
    exports: [
        ProjectConfigurationComponent
    ],
    entryComponents: [
        ProjectConfigurationComponent,
        AddFieldModalComponent,
        FieldEditorModalComponent,
        CategoryEditorModalComponent
    ]
})

export class ConfigurationModule {}