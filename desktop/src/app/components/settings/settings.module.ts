import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { WidgetsModule } from '../widgets/widgets.module';
import { SettingsComponent } from './settings.component';
import { LanguageSettingsComponent } from './language-settings.component';
import { LanguagePickerModalComponent } from '../widgets/languages/language-picker-modal.component';
import { UpdateUsernameModalComponent } from './update-username-modal.component';



@NgModule({
    imports: [
        WidgetsModule,
        BrowserModule,
        NgbModule,
        FormsModule,
        DragDropModule
    ],
    declarations: [
        SettingsComponent,
        LanguageSettingsComponent,
        LanguagePickerModalComponent,
        UpdateUsernameModalComponent
    ],
    providers: []
})

/**
 * @author Daniel de Oliveira
 */
export class SettingsModule { }
