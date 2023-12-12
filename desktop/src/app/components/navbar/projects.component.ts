import { Component, OnInit } from '@angular/core';
import { Labels } from 'idai-field-core';
import { MenuModalLauncher } from '../../services/menu-modal-launcher';
import { SettingsProvider } from '../../services/settings/settings-provider';


@Component({
    selector: 'projects',
    templateUrl: './projects.html'
})
/**
 * @author Thomas Kleinke
 * @author Daniel de Oliveira
 */
export class ProjectsComponent implements OnInit {

    public selectedProject: string;
    public username: string;


    constructor(private settingsProvider: SettingsProvider,
                private menuModalLauncher: MenuModalLauncher,
                private labels: Labels) {

        this.username = this.settingsProvider.getSettings().username;
        this.settingsProvider.settingsChangesNotifications().subscribe((settings) => {
            this.username = settings.username;
        });
    }


    public openModal = () => this.menuModalLauncher.editProject();

    public openUsernameModal = () => this.menuModalLauncher.openUpdateUsernameModal();


    ngOnInit() {

        this.selectedProject = this.settingsProvider.getSettings().selectedProject;
    }


    public getProjectName(): string {

         return this.labels.getFromI18NString(
            this.settingsProvider.getSettings().projectNames[this.selectedProject]
        ) ?? this.selectedProject;
    } 
}
