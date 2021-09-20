import {Component, OnInit} from '@angular/core';
import {SettingsProvider} from '../../services/settings/settings-provider';
import { MenuNavigator } from '../menu-navigator';


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
                private menuNavigator: MenuNavigator) {}


    public openModal = () => this.menuNavigator.editProject();


    ngOnInit() {

        this.selectedProject = this.settingsProvider.getSettings().selectedProject;
    }
}
