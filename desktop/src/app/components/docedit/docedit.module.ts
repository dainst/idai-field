import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { BrowserModule } from '@angular/platform-browser';
import { RouterModule } from '@angular/router';
import { NgbDateParserFormatter, NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { Datastore, IdGenerator } from 'idai-field-core';
import { ProjectConfiguration, RelationsManager } from 'idai-field-core';
import { DocumentHolder } from '../../components/docedit/document-holder';
import { Validator } from '../../model/validator';
import { ImageGridModule } from '../image/grid/image-grid.module';
import { ImageRowModule } from '../image/row/image-row.module';
import { MessagesModule } from '../messages/messages.module';
import { DeleteModalComponent } from '../resources/actions/delete/delete-modal.component';
import { WidgetsModule } from '../widgets/widgets.module';
import { EditFormFieldComponent } from './core/edit-form-field.component';
import { EditFormGroup } from './core/edit-form-group.component';
import { EditFormComponent } from './core/edit-form.component';
import { BooleanComponent } from './core/forms/boolean.component';
import { CheckboxesComponent } from './core/forms/checkboxes.component';
import { DateComponent } from './core/forms/date/date.component';
import { DatingEntryModalComponent } from './core/forms/array-field/dating-entry-modal.component';
import { MeasurementEntryModalComponent } from './core/forms/array-field/measurement-entry-modal.component';
import { DropdownRangeComponent } from './core/forms/dropdown-range.component';
import { DropdownComponent } from './core/forms/dropdown.component';
import { GeometryComponent } from './core/forms/geometry.component';
import { InputComponent } from './core/forms/input.component';
import { ObjectArrayComponent } from './core/forms/array-field/object-array.component';
import { MultiInputComponent } from './core/forms/multi-input.component';
import { RadioComponent } from './core/forms/radio.component';
import { TypeRelationPickerComponent } from './core/forms/type-relation/type-relation-picker.component';
import { TypeRelationComponent } from './core/forms/type-relation/type-relation.component';
import { TypeRowComponent } from './core/forms/type-relation/type-row.component';
import { EmptyValuelistInfoComponent } from './core/forms/widgets/empty-valuelist-info.component';
import { OutliersComponent } from './core/forms/widgets/outliers.component';
import { ConflictDeletedModalComponent } from './dialog/conflict-deleted-modal.component';
import { DuplicateModalComponent } from './dialog/duplicate-modal.component';
import { DoceditComponent } from './docedit.component';
import { RevisionSelectorComponent } from './tabs/revision-selector.component';
import { DoceditConflictsTabComponent } from './tabs/docedit-conflicts-tab.component';
import { CategorySwitcherButtonComponent } from './widgets/category-switcher-button.component';
import { ImagePickerComponent } from './widgets/image-picker.component';
import { InvalidFieldDataComponent } from './core/forms/widgets/invalid-field-data.component';
import { MultiLanguageTextFieldComponent } from './core/forms/widgets/multi-language-text-field.component';
import { SimpleInputComponent } from './core/forms/simple-input.component';
import { SimpleMultiInputComponent } from './core/forms/simple-multi-input.component';
import { IdentifierComponent } from './core/forms/identifier.component';
import { CompositeComponent } from './core/forms/array-field/composite/composite.component';
import { CompositeEntryModalComponent } from './core/forms/array-field/composite/composite-entry-modal.component';
import { ValuelistMultiInputComponent } from './core/forms/valuelist-multi-input.component';
import { LiteratureEntryModalComponent } from './core/forms/array-field/literature-entry-modal.component';
import { DateValueComponent } from './core/forms/date/date-value.component';
import { TimeInputComponent } from './core/forms/date/time-input.component';
import { DateParserFormatter } from './core/forms/date/date-parser-formatter';


@NgModule({
    providers: [
        {
            provide: DocumentHolder,
            useFactory: (projectConfiguration: ProjectConfiguration, relationsManager: RelationsManager, validator: Validator, datastore: Datastore, idGenerator: IdGenerator) => {
                return new DocumentHolder(projectConfiguration, relationsManager, validator, datastore, idGenerator);
            },
            deps: [ProjectConfiguration, RelationsManager, Validator, Datastore, IdGenerator]
        },
        { provide: NgbDateParserFormatter, useClass: DateParserFormatter },
        DateParserFormatter
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
        EditFormGroup,
        CheckboxesComponent,
        BooleanComponent,
        DropdownComponent,
        InputComponent,
        SimpleInputComponent,
        MultiInputComponent,
        SimpleMultiInputComponent,
        ValuelistMultiInputComponent,
        RadioComponent,
        DatingEntryModalComponent,
        DateComponent,
        DateValueComponent,
        TimeInputComponent,
        TypeRelationComponent,
        TypeRowComponent,
        TypeRelationPickerComponent,
        MeasurementEntryModalComponent,
        DropdownRangeComponent,
        GeometryComponent,
        OutliersComponent,
        EmptyValuelistInfoComponent,
        ObjectArrayComponent,
        LiteratureEntryModalComponent,
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
    ]
})

export class DoceditModule {}
