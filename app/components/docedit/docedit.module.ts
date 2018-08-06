import {NgModule} from '@angular/core';
import {BrowserModule} from '@angular/platform-browser';
import {NgbModule} from '@ng-bootstrap/ng-bootstrap';
import {FormsModule} from '@angular/forms';
import {IdaiDocumentsModule} from 'idai-components-2/core';
import {DoceditComponent} from './docedit.component';
import {RouterModule} from '@angular/router';
import {IdaiWidgetsModule} from 'idai-components-2/widgets';
import {IdaiMessagesModule} from 'idai-components-2/core';
import {WidgetsModule} from '../../widgets/widgets.module';
import {DoceditImageTabComponent} from './imagetab/docedit-image-tab.component';
import {DoceditConflictsTabComponent} from './docedit-conflicts-tab.component';
import {ConflictDeletedModalComponent} from './conflict-deleted-modal.component';
import {EditSaveDialogComponent} from './edit-save-dialog.component';
import {TypeSwitcherButtonComponent} from './type-switcher-button.component';
import {ImagePickerComponent} from "./imagetab/image-picker.component";
import {ImageGridModule} from "../imagegrid/image-grid.module";
import {DeleteModalComponent} from './delete-modal.component';
import {DocumentHolder} from './document-holder';

import {NgbDateParserFormatter} from '@ng-bootstrap/ng-bootstrap';

import {EditFormComponent} from './core/edit-form.component';
import {RelationsFormComponent} from './core/relations-form.component';
import {RelationPickerComponent} from './core/relation-picker.component';
import {RelationPickerGroupComponent} from './core/relation-picker-group.component';
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
// import {FieldsViewComponent} from './core/fields-view.component';
// import {RelationsViewComponent} from './core/relations-view.component';
// import {IdaiWidgetsModule} from '../core/idai-widgets.module';
import {BooleanComponent} from './core/forms/boolean.component';
// import {DocumentTeaserComponent} from './document-teaser.component';
import {EditFormFieldComponent} from './core/edit-form-field.component';
import {DropdownRangeComponent} from './core/forms/dropdown-range.component';
import {DocumentEditChangeMonitor} from './core/document-edit-change-monitor';

@NgModule({
    providers: [
        DocumentHolder,
        DocumentEditChangeMonitor,
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