import {Injectable} from '@angular/core';
import {ConfigLoader, IdaiType} from 'idai-components-2/configuration'

@Injectable()
/**
 * @author Thomas Kleinke
 * @author F.Z.
 */
export class ImageTypeUtility {

    constructor(private configLoader: ConfigLoader) {}

    public isImageType(typeName: string): Promise<boolean> {

        return this.configLoader.getProjectConfiguration().then(projectConfiguration => {
            const type = projectConfiguration.getTypesMap()[typeName];

            return Promise.resolve(type.name == 'Image' || (type.parentType && type.parentType.name == 'Image'));
        });
    }

    public getProjectImageTypes(): Promise<any> {

        return this.configLoader.getProjectConfiguration().then(projectConfiguration => {

            const projectTypesTree: { [type: string]: IdaiType } = projectConfiguration.getTypesTree();
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

            return Promise.resolve(projectImageTypes);
        });
    }

    public getProjectImageTypeNames(): Promise<string[]> {

        return this.getProjectImageTypes().then(imageTypes => {
            return Promise.resolve(Object.keys(imageTypes));
        });
    }
}