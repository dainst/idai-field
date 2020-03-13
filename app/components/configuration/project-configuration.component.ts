import {Component} from '@angular/core';
import {ProjectConfiguration} from '../../core/configuration/project-configuration';
import {IdaiType} from '../../core/configuration/model/idai-type';

@Component({
    moduleId: module.id,
    templateUrl: './project-configuration.html'
})
/**
 * @author Sebastian Cuy
 */
export class ProjectConfigurationComponent {

    public typesTreeList: Array<IdaiType>;
    public selectedType: IdaiType;

    constructor(public projectConfiguration: ProjectConfiguration) {

        this.typesTreeList = projectConfiguration.getTypesList()
            .filter(type => !type.parentType);
        this.selectedType = this.typesTreeList[0];
    }

    public selectType(type: IdaiType) {
        this.selectedType = type;
    }
}