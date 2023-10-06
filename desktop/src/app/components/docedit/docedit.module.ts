import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { BrowserModule } from '@angular/platform-browser';
import { RouterModule } from '@angular/router';
import { NgbDateParserFormatter, NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { Datastore } from 'idai-field-core';
import { ProjectConfiguration, RelationsManager } from 'idai-field-core';
import { DocumentHolder } from '../../components/docedit/document-holder';
import { Validator } from '../../model/validator';
import { SettingsProvider } from '../../services/settings/settings-provider';
import { ImageGridModule } from '../image/grid/image-grid.module';
import { ImageRowModule } from '../image/row/image-row.module';
import { MessagesModule } from '../messages/messages.module';
import { DeleteModalComponent } from '../resources/deletion/delete-modal.component';
import { WidgetsModule } from '../widgets/widgets.module';
import { EditFormFieldComponent } from './core/edit-form-field.component';
import { EditFormGroup } from './core/edit-form-group.component';
import { EditFormComponent } from './core/edit-form.component';
import { BooleanComponent } from './core/forms/boolean.component';
import { CheckboxesComponent } from './core/forms/checkboxes.component';
import { DateComponent } from './core/forms/date.component';
import { DatingComponent } from './core/forms/dating.component';
import { DimensionComponent } from './core/forms/dimension.component';
import { DropdownRangeComponent } from './core/forms/dropdown-range.component';
import { DropdownComponent } from './core/forms/dropdown.component';
import { GeometryComponent } from './core/forms/geometry.component';
import { InputComponent } from './core/forms/input.component';
import { LiteratureComponent } from './core/forms/literature.component';
import { MultiInputComponent } from './core/forms/multi-input.component';
import { RadioComponent } from './core/forms/radio.component';
import { TypeRelationPickerComponent } from './core/forms/type-relation/type-relation-picker.component';
import { TypeRelationComponent } from './core/forms/type-relation/type-relation.component';
import { TypeRowComponent } from './core/forms/type-relation/type-row.component';
import { NgbDateDEParserFormatter } from './core/forms/widgets/date-formatter.component';
import { EmptyValuelistInfoComponent } from './core/forms/widgets/empty-valuelist-info.component';
import { OutliersComponent } from './core/forms/widgets/outliers.component';
import { ConflictDeletedModalComponent } from './dialog/conflict-deleted-modal.component';
import { DuplicateModalComponent } from './dialog/duplicate-modal.component';
import { DoceditComponent } from './docedit.component';
import { RevisionSelectorComponent } from './tabs/revision-selector.component';
import { DoceditConflictsTabComponent } from './tabs/docedit-conflicts-tab.component';
import { CategorySwitcherButtonComponent } from './widgets/category-switcher-button.component';
import { ImagePickerComponent } from './widgets/image-picker.component';
import { RelationPickerGroupComponent } from './widgets/relationpicker/relation-picker-group.component';
import { RelationPickerComponent } from './widgets/relationpicker/relation-picker.component';
import { InvalidFieldDataComponent } from './core/forms/widgets/invalid-field-data.component';
import { MultiLanguageTextFieldComponent } from './core/forms/widgets/multi-language-text-field.component';
import { SimpleInputComponent } from './core/forms/simple-input.component';
import { SimpleMultiInputComponent } from './core/forms/simple-multi-input.component';
import { IdentifierComponent } from './core/forms/identifier.component';
import { CompositeComponent } from './core/forms/composite/composite.component';
import { CompositeEntryModalComponent } from './core/forms/composite/composite-entry-modal.component';


@NgModule({
    providers: [
        {
            provide: DocumentHolder,
            useFactory: (projectConfiguration: ProjectConfiguration,
                         relationsManager: RelationsManager,
                         validator: Validator,
                         settingsProvider: SettingsProvider,
                         datastore: Datastore) => {

                return new DocumentHolder(projectConfiguration, relationsManager,
                    validator, datastore);
            },
            deps: [ProjectConfiguration, RelationsManager, Validator,
                SettingsProvider, Datastore]
        },
        { provide: NgbDateParserFormatter, useClass: NgbDateDEParserFormatter }
    ],
    imports: [
        BrowserModule,
        NgbModule,
        FormsModule,
        RouterModule,
        MessagesModule,
        WidgetsModule,
        ImageGridModule,
        ImageRowModule
    ],
    declarations: [
        ConflictDeletedModalComponent,
        DuplicateModalComponent,
        DeleteModalComponent,
        DoceditComponent,
        DoceditConflictsTabComponent,
        RevisionSelectorComponent,
        CategorySwitcherButtonComponent,
        ImagePickerComponent,
        EditFormComponent,
        EditFormFieldComponent,
        RelationPickerComponent,
        EditFormGroup,
        RelationPickerGroupComponent,
        CheckboxesComponent,
        BooleanComponent,
        DropdownComponent,
        InputComponent,
        SimpleInputComponent,
        MultiInputComponent,
        SimpleMultiInputComponent,
        RadioComponent,
        DatingComponent,
        DateComponent,
        TypeRelationComponent,
        TypeRowComponent,
        TypeRelationPickerComponent,
        DimensionComponent,
        DropdownRangeComponent,
        GeometryComponent,
        OutliersComponent,
        EmptyValuelistInfoComponent,
        LiteratureComponent,
        IdentifierComponent,
        InvalidFieldDataComponent,
        MultiLanguageTextFieldComponent,
        CompositeComponent,
        CompositeEntryModalComponent
    ],
    exports: [
        DoceditComponent,
        RevisionSelectorComponent,
        MultiLanguageTextFieldComponent
    ],
    entryComponents: [
        DoceditComponent,
        ConflictDeletedModalComponent,
        TypeRelationPickerComponent,
        ImagePickerComponent,
        DuplicateModalComponent,
        DeleteModalComponent,
        CompositeEntryModalComponent
    ]
})

export class DoceditModule {}
