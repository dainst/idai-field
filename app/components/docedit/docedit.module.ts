import {NgModule} from '@angular/core';
import {BrowserModule} from '@angular/platform-browser';
import {NgbModule, NgbDateParserFormatter} from '@ng-bootstrap/ng-bootstrap';
import {FormsModule} from '@angular/forms';
import {RouterModule} from '@angular/router';
import {IdaiWidgetsModule, IdaiMessagesModule} from 'idai-components-2';
import {DoceditComponent} from './docedit.component';
import {WidgetsModule} from '../../widgets/widgets.module';
import {DoceditImageTabComponent} from './tabs/docedit-image-tab.component';
import {DoceditConflictsTabComponent} from './tabs/docedit-conflicts-tab.component';
import {ConflictDeletedModalComponent} from './dialog/conflict-deleted-modal.component';
import {EditSaveDialogComponent} from './dialog/edit-save-dialog.component';
import {TypeSwitcherButtonComponent} from './widgets/type-switcher-button.component';
import {ImagePickerComponent} from './widgets/image-picker.component';
import {ImageGridModule} from '../imagegrid/image-grid.module';
import {DeleteModalComponent} from '../resources/deletion/delete-modal.component';
import {DocumentHolder} from './document-holder';
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
import {NgbDateDEParserFormatter} from './core/forms/date-formatter.component';
import {BooleanComponent} from './core/forms/boolean.component';
import {EditFormFieldComponent} from './core/edit-form-field.component';
import {DropdownRangeComponent} from './core/forms/dropdown-range.component';
import {DuplicateModalComponent} from './dialog/duplicate-modal.component';
import {GenericFormComponent} from './core/generic-form-component';
import {GeometryComponent} from './core/forms/geometry.component';


@NgModule({
    providers: [
        DocumentHolder,
        { provide: NgbDateParserFormatter, useClass: NgbDateDEParserFormatter }
    ],
    imports: [
        BrowserModule,
        NgbModule,
        FormsModule,
        IdaiWidgetsModule,
        RouterModule,
        IdaiMessagesModule,
        WidgetsModule,
        ImageGridModule
    ],
    declarations: [
        ConflictDeletedModalComponent,
        DuplicateModalComponent,
        DeleteModalComponent,
        DoceditComponent,
        EditSaveDialogComponent,
        DoceditImageTabComponent,
        DoceditConflictsTabComponent,
        TypeSwitcherButtonComponent,
        ImagePickerComponent,
        EditFormComponent,
        EditFormFieldComponent,
        RelationPickerComponent,
        GenericFormComponent,
        RelationPickerGroupComponent,
        CheckboxesComponent,
        BooleanComponent,
        DropdownComponent,
        InputComponent,
        RadioComponent,
        TextComponent,
        DatingComponent,
        DateComponent,
        DimensionComponent,
        DropdownRangeComponent,
        GeometryComponent
    ],
    exports: [
        EditSaveDialogComponent,
        DoceditComponent
    ],
    entryComponents: [
        DoceditComponent,
        ConflictDeletedModalComponent,
        ImagePickerComponent,
        DuplicateModalComponent,
        DeleteModalComponent,
        EditSaveDialogComponent
    ]
})

export class DoceditModule {}