import { Component, OnInit } from '@angular/core';
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
    public initials: string;

    constructor(
        private settingsProvider: SettingsProvider,
        private appComponent: AppComponent
    ) {
        this.currentEditor = this.settingsProvider.getSettings().username;
        this.settingsProvider
            .settingsChangesNotifications()
            .subscribe((settings) => (this.currentEditor = settings.username));
    }
    public openModal = () => this.appComponent.promptEditorName();

    ngOnInit() {
        this.currentEditor = this.settingsProvider.getSettings().username;
    }

    public getInitials(): string {
        let initials: string = '';

        if(this.currentEditor === 'anonymous') return '';

        let splitted: string[] = this.currentEditor.split(' ');
        for (let i = 0; i < splitted.length; i++) {
            const word = splitted[i].trim();
            if (word !== '') {
                initials += word.charAt(0) + '.';
            }
        }
        return initials;
    }
}
