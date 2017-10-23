import {Injectable} from '@angular/core';
import {ProjectConfiguration, IdaiType} from 'idai-components-2/configuration'


@Injectable()
/**
 * @author Thomas Kleinke
 * @author F.Z.
 */
export class ImageTypeUtility {


    constructor(private projectConfiguration: ProjectConfiguration) {}


    public isImageType(typeName: string): boolean {

        const type = this.projectConfiguration.getTypesMap()[typeName];
        return (type.name == 'Image' || (type.parentType && type.parentType.name == 'Image'));
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


    public getProjectImageTypeNames(): string[] {

        const imageTypes = this.getProjectImageTypes();
        return Object.keys(imageTypes);
    }
}