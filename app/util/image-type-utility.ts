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

            return Promise.resolve(type.name == 'image' || (type.parentType && type.parentType.name == 'image'));
        });
    }

    public getProjectImageTypes(): Promise<any> {

        return this.configLoader.getProjectConfiguration().then(projectConfiguration => {

            const projectTypesTree: { [type: string]: IdaiType } = projectConfiguration.getTypesTree();
            let projectImageTypes: any = {};

            if (projectTypesTree['image']) {
                projectImageTypes['image'] = projectTypesTree['image'];

                if (projectTypesTree['image'].children) {
                    for (let i = projectTypesTree['image'].children.length - 1; i >= 0; i--) {
                        projectImageTypes[projectTypesTree['image'].children[i].name]
                            = projectTypesTree['image'].children[i];
                    }
                }
            }

            return Promise.resolve(projectImageTypes);
        });
    }
}