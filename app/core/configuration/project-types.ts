import {Injectable} from '@angular/core';
import {to, isnt} from 'tsfun';
import {ProjectConfiguration} from './project-configuration';
import {IdaiType} from './model/idai-type';

const NAME = 'name';



@Injectable()
/**
 * @author Thomas Kleinke
 * @author F.Z.
 * @author Daniel de Oliveira
 */
export class ProjectTypes {

    public static UNKNOWN_TYPE_ERROR = 'projectTypes.Errors.UnknownType';

    constructor(private projectConfiguration: ProjectConfiguration) {}


    public getOverviewTopLevelTypes(): Array<IdaiType> {

        return this.projectConfiguration.getTypesList()
            .filter(type => type.name === 'Operation' || type.name === 'Place');
    }


    public getFieldTypes(): Array<IdaiType> {

        return this.projectConfiguration.getTypesList()
            .filter(type => !this.projectConfiguration.isSubtype(type.name, 'Image'))
            .filter(type => !ProjectTypes.isProjectType(type.name));
    }


    public getConcreteFieldTypes(): Array<IdaiType> {

        return this.projectConfiguration.getTypesList()
            .filter(type => !this.projectConfiguration.isSubtype(type.name, 'Image'))
            .filter(type => !this.projectConfiguration.isSubtype(type.name, 'TypeCatalog'))
            .filter(type => !this.projectConfiguration.isSubtype(type.name, 'Type'))
            .filter(type => !ProjectTypes.isProjectType(type.name));
    }


    public getAbstractFieldTypes(): Array<IdaiType> {

        return this.projectConfiguration.getTypesList()
            .filter(type => type.name === 'TypeCatalog' || type.name === 'Type');
    }


    public getNamesOfTypeAndSubtypes(superTypeName: string): string[] {

        return Object.keys(this.projectConfiguration.getTypeAndSubtypes(superTypeName));
    }


    public getFieldTypeNames(): string[] {

        return this.getFieldTypes().map(to(NAME));
    }


    public getConcreteFieldTypeNames(): string[] {

        return this.getConcreteFieldTypes().map(to(NAME));
    }


    public getAbstractFieldTypeNames(): string[] {

        return this.getAbstractFieldTypes().map(to(NAME));
    }


    public getImageTypeNames(): string[] {

        return Object.keys(this.projectConfiguration.getTypeAndSubtypes('Image'));
    }


    public getFeatureTypeNames(): string[] {

        return Object.keys(this.projectConfiguration.getTypeAndSubtypes('Feature'));
    }


    public getOperationTypeNames(): string[] {

        return Object.keys(this.projectConfiguration.getTypeAndSubtypes('Operation'));
    }


    public getRegularTypeNames(): string[] {

        return this.projectConfiguration
            .getTypesList()
            .map(to(NAME))
            .filter(isnt('Place'))
            .filter(isnt('Project'))
            .filter(typename => !this.projectConfiguration.isSubtype(typename, 'Operation'))
            .filter(typename => !this.projectConfiguration.isSubtype(typename, 'Image'))
            .filter(typename => !this.projectConfiguration.isSubtype(typename, 'TypeCatalog'))
            .filter(typename => !this.projectConfiguration.isSubtype(typename, 'Type'));
    }


    public getOverviewTypeNames(): string[] {

        return this.projectConfiguration
            .getTypesList()
            .map(to(NAME))
            .filter(typename => this.projectConfiguration.isSubtype(typename, 'Operation'))
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


    public getHierarchyParentTypes(typeName: string): Array<IdaiType> {

        return this.getAllowedRelationRangeTypes('isRecordedIn', typeName)
            .concat(this.getAllowedRelationRangeTypes('liesWithin', typeName));
    }


    public isGeometryType(typeName: string): boolean {

        return !this.getImageTypeNames().includes(typeName)
            && !this.projectConfiguration.isSubtype(typeName, 'Inscription')
            && !this.projectConfiguration.isSubtype(typeName, 'Type')
            && !this.projectConfiguration.isSubtype(typeName, 'TypeCatalog')
            && !ProjectTypes.isProjectType(typeName);
    }


    public getOverviewTypes(): string[] {

        return Object.keys(this.projectConfiguration.getTypeAndSubtypes('Operation'))
            .concat(['Place'])
            .filter(el => el !== 'Operation');
    }


    public getTypeManagementTypes(): string[] {

        return Object.keys(this.projectConfiguration.getTypeAndSubtypes('TypeCatalog'))
            .concat(Object.keys(this.projectConfiguration.getTypeAndSubtypes('Type')));
    }


    private static isProjectType(typeName: string): boolean {

        return typeName === 'Project';
    }
}