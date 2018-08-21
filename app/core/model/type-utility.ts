import {Injectable} from '@angular/core';
import {IdaiType, ProjectConfiguration} from 'idai-components-2'


@Injectable()
/**
 * @author Thomas Kleinke
 * @author F.Z.
 * @author Daniel de Oliveira
 */
export class TypeUtility {

    constructor(private projectConfiguration: ProjectConfiguration) {}


    public isSubtype(typeName: string, superTypeName: string): boolean {

        const type = this.projectConfiguration.getTypesMap()[typeName];
        if (!type) throw 'Unknown type "' + typeName + '"';
        return (type.name === superTypeName)
            || (type.parentType && type.parentType.name && type.parentType.name == superTypeName);
    }


    public getSubtypes(superTypeName: string): any {

        const projectTypesTree: { [type: string]: IdaiType } = this.projectConfiguration.getTypesTree();
        let projectImageTypes: any = {};

        if (projectTypesTree[superTypeName]) {
            projectImageTypes[superTypeName] = projectTypesTree[superTypeName];

            if (projectTypesTree[superTypeName].children) {
                for (let i = projectTypesTree[superTypeName].children.length - 1; i >= 0; i--) {
                    projectImageTypes[projectTypesTree[superTypeName].children[i].name]
                        = projectTypesTree[superTypeName].children[i];
                }
            }
        }

        return projectImageTypes;
    }


    public getOverviewTypes(): Array<IdaiType> {

        return this.projectConfiguration.getTypesList()
            .filter(type => type.name === 'Operation' || type.name === 'Place');
    }


    public getNonImageTypes(): Array<IdaiType> {

        return this.projectConfiguration.getTypesList()
            .filter(type => !this.isSubtype(type.name, 'Image'))
            .filter(type => !TypeUtility.isProjectType(type.name))
    }


    public getNonImageTypeNames(): string[] {

        return this.getNonImageTypes().map(type => type.name);
    }


    public getImageTypeNames(): string[] {

        return Object.keys(this.getSubtypes('Image'));
    }


    public getFeatureTypeNames(): string[] {

        return Object.keys(this.getSubtypes('Feature'));
    }


    private static isProjectType(typeName: string): boolean {

        return typeName === 'Project';
    }
}