import { Component, OnInit } from '@angular/core';
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
                private projectModalLauncher: ProjectModalLauncher) {}


    public openModal = () => this.projectModalLauncher.editProject();


    ngOnInit() {

        this.selectedProject = this.settingsProvider.getSettings().selectedProject;
    }
}
