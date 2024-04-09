import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { NavbarComponent } from './navbar.component';
import { TaskbarComponent } from './taskbar.component';
import { TaskbarWarningsComponent } from './warnings/taskbar-warnings.component';
import { WarningsModalComponent } from './warnings/warnings-modal.component';
import { DeleteFieldDataModalComponent } from './warnings/modals/delete-field-data-modal.component';
import { TaskbarSyncStatusComponent } from './taskbar-sync-status.component';
import { TaskbarUpdateComponent } from './taskbar-update.component';
import { ProjectsComponent } from './projects.component';
import { WidgetsModule } from '../widgets/widgets.module';
import { CleanUpRelationModalComponent } from './warnings/modals/clean-up-relation-modal.component';
import { DeleteResourceModalComponent } from './warnings/modals/delete-resource-modal.component';
import { FixOutliersModalComponent } from './warnings/modals/fix-outliers-modal.component';
import { FixingDataInProgressModalComponent } from './warnings/modals/fixing-data-in-progress-modal.component';
import { DeleteOutliersModalComponent } from './warnings/modals/delete-outliers-modal.component';
import { ConvertFieldDataModalComponent } from './warnings/modals/convert-field-data-modal.component';
import { SelectNewFieldModalComponent } from './warnings/modals/select-new-field-modal.component';


@NgModule({
    imports: [
        BrowserModule,
        FormsModule,
        NgbModule,
        WidgetsModule
    ],
    declarations: [
        NavbarComponent,
        TaskbarComponent,
        TaskbarWarningsComponent,
        WarningsModalComponent,
        DeleteResourceModalComponent,
        ConvertFieldDataModalComponent,
        DeleteFieldDataModalComponent,
        CleanUpRelationModalComponent,
        FixOutliersModalComponent,
        FixingDataInProgressModalComponent,
        DeleteOutliersModalComponent,
        SelectNewFieldModalComponent,
        TaskbarSyncStatusComponent,
        TaskbarUpdateComponent,
        ProjectsComponent
    ],
    exports: [
        NavbarComponent
    ]
})
export class NavbarModule {}
