import {Injectable} from '@angular/core';
import {ProjectConfiguration, IdaiType} from 'idai-components-2/configuration'
import {isNot} from '../util/list/list-util-base';


@Injectable()
/**
 * @author Thomas Kleinke
 * @author F.Z.
 * @author Daniel de Oliveira
 */
export class ImageTypeUtility {


    constructor(private projectConfiguration: ProjectConfiguration) {}


    public isImageType(typeName: string): boolean {

        const type = this.projectConfiguration.getTypesMap()[typeName];
        if (!type) throw 'Unknown type "'+typeName+'"';
        return (type.name == 'Image' || (type.parentType && type.parentType.name && type.parentType.name == 'Image'));
    }


    public getProjectImageTypes(): any {

        const projectTypesTree: { [type: string]: IdaiType } = this.projectConfiguration.getTypesTree();
        let projectImageTypes: any = {};

        if (projectTypesTree['Image']) {
            projectImageTypes['Image'] = projectTypesTree['Image'];

            if (projectTypesTree['Image'].children) {
                for (let i = projectTypesTree['Image'].children.length - 1; i >= 0; i--) {
                    projectImageTypes[projectTypesTree['Image'].children[i].name]
                        = projectTypesTree['Image'].children[i];
                }
            }
        }

        return projectImageTypes;
    }


    public getNonImageTypeNames(): string[] {

        return this.projectConfiguration.getTypesList()
            .map(type => type.name)
            .filter(typeName => !this.isImageType(typeName))
            // TODO Check if this is really the right place to get rid of the project document in search results
            .filter(typeName => !this.isProjectType(typeName))
    }


    public getImageTypeNames(): string[] {

        return Object.keys(this.getProjectImageTypes());
    }


    private isProjectType(typeName: string): boolean {

        return typeName == 'Project';
    }
}