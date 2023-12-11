import { Component, OnInit } from '@angular/core';
import { Labels } from 'idai-field-core';
import { ProjectModalLauncher } from '../../services/project-modal-launcher';
import { SettingsProvider } from '../../services/settings/settings-provider';
import { AppComponent } from '../app.component';


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
                private projectModalLauncher: ProjectModalLauncher,
                private appComponent: AppComponent,
                private labels: Labels) {

        this.username = this.settingsProvider.getSettings().username;
        this.settingsProvider.settingsChangesNotifications().subscribe((settings) => {
            this.username = settings.username;
        });
    }


    public openModal = () => this.projectModalLauncher.editProject();

    public openUsernameModal = () => this.appComponent.openUpdateUsernameModal();


    ngOnInit() {

        this.selectedProject = this.settingsProvider.getSettings().selectedProject;
    }


    public getProjectName(): string {

         return this.labels.getFromI18NString(
            this.settingsProvider.getSettings().projectNames[this.selectedProject]
        ) ?? this.selectedProject;
    } 
}
