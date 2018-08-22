import {NgModule} from '@angular/core';
import {BrowserModule} from '@angular/platform-browser';
import {NgbModule} from '@ng-bootstrap/ng-bootstrap';
import {FormsModule} from '@angular/forms';
import {IdaiDocumentsModule} from 'idai-components-2';
import {DoceditComponent} from './docedit.component';
import {RouterModule} from '@angular/router';
import {IdaiWidgetsModule} from 'idai-components-2';
import {IdaiMessagesModule} from 'idai-components-2';
import {WidgetsModule} from '../../widgets/widgets.module';
import {DoceditImageTabComponent} from './tabs/docedit-image-tab.component';
import {DoceditConflictsTabComponent} from './tabs/docedit-conflicts-tab.component';
import {ConflictDeletedModalComponent} from './dialog/conflict-deleted-modal.component';
import {EditSaveDialogComponent} from './dialog/edit-save-dialog.component';
import {TypeSwitcherButtonComponent} from './widgets/type-switcher-button.component';
import {ImagePickerComponent} from "./widgets/image-picker.component";
import {ImageGridModule} from "../imagegrid/image-grid.module";
import {DeleteModalComponent} from './dialog/delete-modal.component';
import {DocumentHolder} from './document-holder';
import {NgbDateParserFormatter} from '@ng-bootstrap/ng-bootstrap';
import {EditFormComponent} from './core/edit-form.component';
import {RelationsFormComponent} from './core/relations-form.component';
import {RelationPickerComponent} from './widgets/relationspick/relation-picker.component';
import {RelationPickerGroupComponent} from './widgets/relationspick/relation-picker-group.component';
import {CheckboxesComponent} from './core/forms/checkboxes.component';
import {DropdownComponent} from './core/forms/dropdown.component';
import {InputComponent} from './core/forms/input.component';
import {DimensionComponent} from './core/forms/dimension.component';
import {InputsComponent} from './core/forms/inputs.component';
import {MultiselectComponent} from './core/forms/multiselect.component';
import {RadioComponent} from './core/forms/radio.component';
import {TextComponent} from './core/forms/text.component';
import {DatingComponent} from './core/forms/dating.component';
import {DateComponent} from './core/forms/date.component';
import {NgbDateDEParserFormatter} from './core/forms/date-formatter.component';
import {BooleanComponent} from './core/forms/boolean.component';
import {EditFormFieldComponent} from './core/edit-form-field.component';
import {DropdownRangeComponent} from './core/forms/dropdown-range.component';


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
        IdaiDocumentsModule,
        RouterModule,
        IdaiMessagesModule,
        WidgetsModule,
        ImageGridModule
    ],
    declarations: [
        ConflictDeletedModalComponent,
        DeleteModalComponent,
        DoceditComponent,
        EditSaveDialogComponent,
        DoceditImageTabComponent,
        DoceditConflictsTabComponent,
        TypeSwitcherButtonComponent,
        ImagePickerComponent,
        EditFormComponent,
        EditFormFieldComponent,
        RelationsFormComponent,
        RelationPickerComponent,
        RelationPickerGroupComponent,
        CheckboxesComponent,
        BooleanComponent,
        DropdownComponent,
        InputComponent,
        InputsComponent,
        MultiselectComponent,
        RadioComponent,
        TextComponent,
        DatingComponent,
        DateComponent,
        DimensionComponent,
        DropdownRangeComponent
    ],
    exports: [
        EditSaveDialogComponent,
        DoceditComponent
    ],
    entryComponents: [
        DoceditComponent,
        ConflictDeletedModalComponent,
        ImagePickerComponent,
        DeleteModalComponent,
        EditSaveDialogComponent
    ]
})

export class DoceditModule {}