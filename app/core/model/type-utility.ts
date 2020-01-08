import {Injectable} from '@angular/core';
import {to} from 'tsfun';
import {ProjectConfiguration} from '../configuration/project-configuration';
import {IdaiType} from '../configuration/model/idai-type';


@Injectable()
/**
 * @author Thomas Kleinke
 * @author F.Z.
 * @author Daniel de Oliveira
 */
export class TypeUtility {

    public static UNKNOWN_TYPE_ERROR = 'TypeUtility.Errors.UnknownType';

    constructor(private projectConfiguration: ProjectConfiguration) {}


    public isSubtype(typeName: string, superTypeName: string): boolean {

        const type = this.projectConfiguration.getTypesMap()[typeName];
        if (!type) throw [TypeUtility.UNKNOWN_TYPE_ERROR, typeName];
        return (type.name === superTypeName)
            || (type.parentType && type.parentType.name && type.parentType.name == superTypeName);
    }


    public getTypeAndSubtypes(superTypeName: string): { [typeName: string]: IdaiType } {

        const projectTypesMap: { [type: string]: IdaiType } = this.projectConfiguration.getTypesMap();
        let subtypes: any = {};

        if (projectTypesMap[superTypeName]) {
            subtypes[superTypeName] = projectTypesMap[superTypeName];

            if (projectTypesMap[superTypeName].children) {
                for (let i = projectTypesMap[superTypeName].children.length - 1; i >= 0; i--) {
                    subtypes[projectTypesMap[superTypeName].children[i].name]
                        = projectTypesMap[superTypeName].children[i];
                }
            }
        }

        return subtypes;
    }


    public getOverviewTopLevelTypes(): Array<IdaiType> {

        return this.projectConfiguration.getTypesList()
            .filter(type => type.name === 'Operation' || type.name === 'Place');
    }


    public getTypeManagementTopLevelTypes(): Array<IdaiType> {

        return this.projectConfiguration.getTypesList()
            .filter(type => type.name === 'TypeCatalog' || type.name === 'Type');
    }


    public getFieldTypes(): Array<IdaiType> {

        return this.projectConfiguration.getTypesList()
            .filter(type => !this.isSubtype(type.name, 'Image'))
            .filter(type => !this.isSubtype(type.name, 'TypeCatalog'))
            .filter(type => !this.isSubtype(type.name, 'Type'))
            .filter(type => !TypeUtility.isProjectType(type.name))
    }


    public getNamesOfTypeAndSubtypes(superTypeName: string): string[] {

        return Object.keys(this.getTypeAndSubtypes(superTypeName));
    }


    public getFieldTypeNames(): string[] {

        return this.getFieldTypes().map(type => type.name);
    }


    public getImageTypeNames(): string[] {

        return Object.keys(this.getTypeAndSubtypes('Image'));
    }


    public getFeatureTypeNames(): string[] {

        return Object.keys(this.getTypeAndSubtypes('Feature'));
    }


    public getOperationTypeNames(): string[] {

        return Object.keys(this.getTypeAndSubtypes('Operation'));
    }


    public getRegularTypeNames(): string[] {

        return this.projectConfiguration
            .getTypesList()
            .map(to('name'))
            .filter(typename => typename !== 'Place')
            .filter(typename => typename !== 'Project')
            .filter(typename => !this.isSubtype(typename, 'Operation'))
            .filter(typename => !this.isSubtype(typename, 'Image'))
            .filter(typename => !this.isSubtype(typename, 'TypeCatalog'))
            .filter(typename => !this.isSubtype(typename, 'Type'));
    }


    public getOverviewTypeNames(): string[] {

        return this.projectConfiguration
            .getTypesList()
            .map(to('name'))
            .filter(typename => this.isSubtype(typename, 'Operation'))
            .concat('Place');
    }


    public getTypesManagementTypeNames(): string[] {

        return ['TypeCatalog', 'Type'];
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


    public isGeometryType(typeName: string): boolean {

        return !this.getImageTypeNames().includes(typeName)
            && !this.isSubtype(typeName, 'Inscription')
            && !this.isSubtype(typeName, 'Type')
            && !this.isSubtype(typeName, 'TypeCatalog')
            && !TypeUtility.isProjectType(typeName);
    }


    private static isProjectType(typeName: string): boolean {

        return typeName === 'Project';
    }
}