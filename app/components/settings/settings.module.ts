import {NgModule} from '@angular/core';
import {WidgetsModule} from '../../widgets/widgets.module';
import {BrowserModule} from '@angular/platform-browser';
import {FormsModule} from '@angular/forms';
import {SettingsComponent} from './settings.component';
import {NgbModule} from '@ng-bootstrap/ng-bootstrap';

@NgModule({
    imports: [
        WidgetsModule,
        BrowserModule,
        NgbModule,
        FormsModule
    ],
    declarations: [
        SettingsComponent
    ],
    providers: []
})

/**
 * @author Daniel de Oliveira
 */
export class SettingsModule { }