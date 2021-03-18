import {NgModule} from '@angular/core';
import {BrowserModule} from '@angular/platform-browser';
import {NgbModule, NgbDateParserFormatter} from '@ng-bootstrap/ng-bootstrap';
import {FormsModule} from '@angular/forms';
import {RouterModule} from '@angular/router';
import {DoceditComponent} from './docedit.component';
import {WidgetsModule} from '../widgets/widgets.module';
import {DoceditImageTabComponent} from './tabs/docedit-image-tab.component';
import {DoceditConflictsTabComponent} from './tabs/docedit-conflicts-tab.component';
import {ConflictDeletedModalComponent} from './dialog/conflict-deleted-modal.component';
import {EditSaveDialogComponent} from './dialog/edit-save-dialog.component';
import {CategorySwitcherButtonComponent} from './widgets/category-switcher-button.component';
import {ImagePickerComponent} from './widgets/image-picker.component';
import {ImageGridModule} from '../image/grid/image-grid.module';
import {DeleteModalComponent} from '../resources/deletion/delete-modal.component';
import {EditFormComponent} from './core/edit-form.component';
import {RelationPickerComponent} from './widgets/relationpicker/relation-picker.component';
import {RelationPickerGroupComponent} from './widgets/relationpicker/relation-picker-group.component';
import {CheckboxesComponent} from './core/forms/checkboxes.component';
import {DropdownComponent} from './core/forms/dropdown.component';
import {InputComponent} from './core/forms/input.component';
import {DimensionComponent} from './core/forms/dimension.component';
import {RadioComponent} from './core/forms/radio.component';
import {TextComponent} from './core/forms/text.component';
import {DatingComponent} from './core/forms/dating.component';
import {DateComponent} from './core/forms/date.component';
import {NgbDateDEParserFormatter} from './core/forms/widgets/date-formatter.component';
import {BooleanComponent} from './core/forms/boolean.component';
import {EditFormFieldComponent} from './core/edit-form-field.component';
import {DropdownRangeComponent} from './core/forms/dropdown-range.component';
import {DuplicateModalComponent} from './dialog/duplicate-modal.component';
import {EditFormGroup} from './core/edit-form-group.component';
import {GeometryComponent} from './core/forms/geometry.component';
import {MultiInputComponent} from './core/forms/multi-input.component';
import {OutliersComponent} from './core/forms/widgets/outliers.component';
import {EmptyValuelistInfoComponent} from './core/forms/widgets/empty-valuelist-info.component';
import {DocumentHolder} from '../../core/docedit/document-holder';
import {ProjectConfiguration} from '../../core/configuration/project-configuration';
import {RelationsManager} from '../../core/model/relations-manager';
import {Validator} from '../../core/model/validator';
import {DocumentDatastore} from '../../core/datastore/document-datastore';
import {ImageRowModule} from '../image/row/image-row.module';
import {TypeRelationComponent} from './core/forms/type-relation/type-relation.component';
import {TypeRowComponent} from './core/forms/type-relation/type-row.component';
import {TypeRelationPickerComponent} from './core/forms/type-relation/type-relation-picker.component';
import {LiteratureComponent} from './core/forms/literature.component';
import {IdaiMessagesModule} from '../messages/idai-messages.module';
import {SettingsProvider} from '../../core/settings/settings-provider';


@NgModule({
    providers: [
        {
            provide: DocumentHolder,
            useFactory: (projectConfiguration: ProjectConfiguration,
                         relationsManager: RelationsManager,
                         validator: Validator,
                         settingsProvider: SettingsProvider,
                         datastore: DocumentDatastore) => {

                return new DocumentHolder(projectConfiguration, relationsManager,
                    validator, datastore);
            },
            deps: [ProjectConfiguration, RelationsManager, Validator,
                SettingsProvider, DocumentDatastore]
        },
        { provide: NgbDateParserFormatter, useClass: NgbDateDEParserFormatter }
    ],
    imports: [
        BrowserModule,
        NgbModule,
        FormsModule,
        RouterModule,
        IdaiMessagesModule,
        WidgetsModule,
        ImageGridModule,
        ImageRowModule
    ],
    declarations: [
        ConflictDeletedModalComponent,
        DuplicateModalComponent,
        DeleteModalComponent,
        DoceditComponent,
        EditSaveDialogComponent,
        DoceditImageTabComponent,
        DoceditConflictsTabComponent,
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
        MultiInputComponent,
        RadioComponent,
        TextComponent,
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
        LiteratureComponent
    ],
    exports: [
        EditSaveDialogComponent,
        DoceditComponent
    ],
    entryComponents: [
        DoceditComponent,
        ConflictDeletedModalComponent,
        TypeRelationPickerComponent,
        ImagePickerComponent,
        DuplicateModalComponent,
        DeleteModalComponent,
        EditSaveDialogComponent
    ]
})

export class DoceditModule {}
