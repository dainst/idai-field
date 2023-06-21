import { Component, OnInit } from '@angular/core';;
import { SettingsProvider } from '../../services/settings/settings-provider';
import { AppComponent } from '../app.component';

@Component({
    selector: 'taskbar-editor',
    templateUrl: './taskbar-editor.html'
})
/**
 * @author Danilo Guzzo
 */

export class TaskbarEditorComponent implements OnInit {
    public currentEditor: string;

    constructor(
        private settingsProvider: SettingsProvider,
        private appComponent: AppComponent
    ) {
        this.currentEditor = this.settingsProvider.getSettings().username;
        this.settingsProvider.settingsChangesNotifications().subscribe(settings => this.currentEditor = settings.username);
    }
    public openModal = () => this.appComponent.promptEditorName();

    ngOnInit() {

        this.currentEditor = this.settingsProvider.getSettings().username;
    }

    public getEditorName() {
        return this.currentEditor;
    }
}