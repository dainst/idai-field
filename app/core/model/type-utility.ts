import {Injectable} from '@angular/core';
import {to} from 'tsfun';
import {IdaiType, ProjectConfiguration} from 'idai-components-2';


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


    public getSubtypes(superTypeName: string): { [typeName: string]: IdaiType } {

        const projectTypesTree: { [type: string]: IdaiType } = this.projectConfiguration.getTypesTree();
        let subtypes: any = {};

        if (projectTypesTree[superTypeName]) {
            subtypes[superTypeName] = projectTypesTree[superTypeName];

            if (projectTypesTree[superTypeName].children) {
                for (let i = projectTypesTree[superTypeName].children.length - 1; i >= 0; i--) {
                    subtypes[projectTypesTree[superTypeName].children[i].name]
                        = projectTypesTree[superTypeName].children[i];
                }
            }
        }

        return subtypes;
    }


    public getOverviewTopLevelTypes(): Array<IdaiType> {

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


    public getOperationTypeNames(): string[] {

        return Object.keys(this.getSubtypes('Operation'));
    }


    public getRegularTypeNames(): string[] {

        return this.projectConfiguration
            .getTypesList()
            .map(to('name'))
            .filter(typename => typename !== 'Place')
            .filter(typename => typename !== 'Project')
            .filter(typename => !this.isSubtype(typename, 'Operation'))
            .filter(typename => !this.isSubtype(typename, 'Image'));
    }


    public getOverviewTypeNames(): string[] {

        return this.projectConfiguration
            .getTypesList()
            .map(to('name'))
            .filter(typename => this.isSubtype(typename, 'Operation'))
            .concat('Place');
    }


    public getAllowedRelationDomainTypes(relationName: string, rangeTypeName: string): Array<IdaiType> {

        return this.projectConfiguration.getTypesList()
            .filter(type => {
                return this.projectConfiguration.isAllowedRelationDomainType(
                    type.name, rangeTypeName, relationName
                ) && (!type.parentType || !this.projectConfiguration.isAllowedRelationDomainType(
                    type.parentType.name, rangeTypeName, relationName
                ));
            });
    }


    public getAllowedRelationRangeTypes(relationName: string, domainTypeName: string): Array<IdaiType> {

        return this.projectConfiguration.getTypesList()
            .filter(type => {
                return this.projectConfiguration.isAllowedRelationDomainType(
                    domainTypeName, type.name, relationName
                ) && (!type.parentType || !this.projectConfiguration.isAllowedRelationDomainType(
                    domainTypeName, type.parentType.name, relationName
                ));
            });
    }


    private static isProjectType(typeName: string): boolean {

        return typeName === 'Project';
    }
}