import { Injectable } from '@angular/core';
import { SettingsProvider } from './settings/settings-provider';
import { Labels } from 'idai-field-core';


@Injectable()
/**
 * @author Thomas Kleinke
 */
export class ProjectLabelProvider {

    constructor(private settingsProvider: SettingsProvider,
                private labels: Labels) {}


    public getProjectLabel(): string {

        const selectedProject: string = this.settingsProvider.getSettings().selectedProject;

        return this.labels.getFromI18NString(
           this.settingsProvider.getSettings().projectNames[selectedProject]
       ) ?? selectedProject;
   }
}
