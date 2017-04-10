import {Component} from "@angular/core";
import {ConfigLoader} from 'idai-components-2/configuration';

@Component({
    moduleId: module.id,
    templateUrl: './settings.html'
})
/**
 * @author Daniel de Oliveira
 */
export class SettingsComponent {

    public selectedProject;

    constructor(
        private configLoader: ConfigLoader
    ) {

        this.configLoader.getProjectConfiguration().then(conf => {
            console.log("conf",conf.getProjectIdentifier())
            this.selectedProject = conf.getProjectIdentifier();
        })
    }
}