import { Component, OnInit } from '@angular/core';
import { Labels } from 'idai-field-core';
import { ProjectModalLauncher } from '../../services/project-modal-launcher';
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


    constructor(private settingsProvider: SettingsProvider,
                private projectModalLauncher: ProjectModalLauncher,
                private labels: Labels) {}


    public openModal = () => this.projectModalLauncher.editProject();


    ngOnInit() {

        this.selectedProject = this.settingsProvider.getSettings().selectedProject;
    }


    public getProjectName(): string {

        return this.labels.getFromI18NString(
            this.settingsProvider.getSettings().projectNames[this.selectedProject]
        ) ?? this.selectedProject;
    }
}
