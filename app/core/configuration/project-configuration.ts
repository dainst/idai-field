import {flow, map, values, to, on, isNot, empty, filter, is, isDefined, remove} from 'tsfun';
import {IdaiType} from './model/idai-type';
import {FieldDefinition} from './model/field-definition';
import {RelationDefinition} from './model/relation-definition';
import {NAME, ProjectConfigurationUtils} from './project-configuration-utils';

const COLOR = 'color';
const MANDATORY = 'mandatory';
const VISIBLE = 'visible';

/**
 * ProjectConfiguration maintains the current projects properties.
 * Amongst them is the set of types for the current project,
 * which ProjectConfiguration provides to its clients.
 *
 * Within a project, objects of the available types can get created,
 * where every type is a configuration of different fields.
 *
 * @author Thomas Kleinke
 * @author Daniel de Oliveira
 * @author Sebastian Cuy
 */
export class ProjectConfiguration {

    private typesMap: { [typeName: string]: IdaiType } = {};

    private relations: Array<RelationDefinition> = [];


    constructor(configuration: any) {

        this.typesMap = ProjectConfigurationUtils.initTypes(configuration);
        this.relations = configuration.relations || [];
    }


    public getAllRelationDefinitions() {

        return this.relations as Array<RelationDefinition>;
    }


    /**
     * @returns {Array<IdaiType>} All types in flat array, ignoring hierarchy
     */
    public getTypesList(): Array<IdaiType> {

        return values(this.typesMap);
    }


    public getTypesMap(): any {

        return this.typesMap;
    }


    public getTypesTree() : any {

        return remove(on('parent', isDefined))(this.typesMap);
    }

    /**
     * Gets the relation definitions available.
     *
     * @param typeName the name of the type to get the relation definitions for.
     * @param isRangeType If true, get relation definitions where the given type is part of the relation's range
     *                    (instead of domain)
     * @param property to give only the definitions with a certain boolean property not set or set to true
     * @returns {Array<RelationDefinition>} the definitions for the type.
     */
    public getRelationDefinitions(typeName: string,
                                  isRangeType: boolean = false,
                                  property?: string): Array<RelationDefinition> {

        return ProjectConfigurationUtils.getRelationDefinitions(
            this.relations, typeName, isRangeType, property);
    }

    /**
     * @returns {boolean} True if the given domain type is a valid domain type for a relation definition which has the
     * given range type & name
     */
    public isAllowedRelationDomainType(domainTypeName: string, rangeTypeName: string, relationName: string): boolean {

        const relationDefinitions = this.getRelationDefinitions(rangeTypeName, true);

        for (let relationDefinition of relationDefinitions) {
            if (relationName == relationDefinition.name
                && relationDefinition.domain.indexOf(domainTypeName) > -1) return true;
        }

        return false;
    }


    /**
     * @param typeName
     * @returns {any[]} the fields definitions for the type.
     */
    public getFieldDefinitions(typeName: string): FieldDefinition[] {

        if (!this.typesMap[typeName]) return [];
        return this.typesMap[typeName].fields;
    }


    public getLabelForType(typeName: string): string {

        if (!this.typesMap[typeName]) return '';
        return this.typesMap[typeName].label;
    }


    public getColorForType(typeName: string): string {

        return this.getTypeColors()[typeName];
    }


    public getTextColorForType(typeName: string): string {

        return ProjectConfigurationUtils.isBrightColor(this.getColorForType(typeName)) ? '#000000' : '#ffffff';
    }


    public getTypeColors() {

        return map(to(COLOR))(this.typesMap) as { [typeName: string]: string };
    }


    public isMandatory(typeName: string, fieldName: string): boolean {

        return this.hasProperty(typeName, fieldName, MANDATORY);
    }


    public isVisible(typeName: string, fieldName: string): boolean {

        return this.hasProperty(typeName, fieldName, VISIBLE);
    }


    /**
     * Should be used only from within components.
     * 
     * @param relationName
     * @returns {string}
     */
    public getRelationDefinitionLabel(relationName: string): string {

        return ProjectConfigurationUtils.getLabel(relationName, this.relations);
    }


    /**
     * Gets the label for the field if it is defined.
     * Otherwise it returns the fields definitions name.
     *
     * @param typeName
     * @param fieldName
     * @returns {string}
     * @throws {string} with an error description in case the type is not defined.
     */
    public getFieldDefinitionLabel(typeName: string, fieldName: string): string {

        const fieldDefinitions = this.getFieldDefinitions(typeName);
        if (fieldDefinitions.length == 0)
            throw 'No type definition found for type \'' + typeName + '\'';

        return ProjectConfigurationUtils.getLabel(fieldName, fieldDefinitions);
    }


    private hasProperty(typeName: string, fieldName: string, propertyName: string) {

        if (!this.typesMap[typeName]) return false;

        return flow(
            this.typesMap[typeName].fields,
            filter(on(NAME, is(fieldName))),
            filter(on(propertyName, is(true))),
            isNot(empty));
    }
}
