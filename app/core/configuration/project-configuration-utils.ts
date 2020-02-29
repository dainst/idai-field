import {TypeDefinition} from './model/type-definition';
import {map, on, separate, defined, isNot} from 'tsfun';
import {IdaiType} from './model/idai-type';
import {makeLookup} from '../util/utils';
import {RelationDefinition} from './model/relation-definition';
import {ConfigurationDefinition} from './boot/configuration-definition';
import {MDInternal} from 'idai-components-2';

export const NAME = 'name';
export const PARENT = 'parent';

/**
 * @author Thomas Kleinke
 * @author Daniel de Oliveira
 * @author Sebastian Cuy
 */
export module ProjectConfigurationUtils {

    export function getTypeAndSubtypes(projectTypesMap: { [type: string]: IdaiType },
                                       superTypeName: string): { [typeName: string]: IdaiType } {

        const subtypes: any = {};

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


    export function getRelationDefinitions(relationFields: Array<RelationDefinition>,
                                           typeName: string,
                                           isRangeType: boolean = false,
                                           property?: string) {

        const availableRelationFields: Array<RelationDefinition> = [];
        for (let relationField of relationFields) {

            const types: string[] = isRangeType ? relationField.range : relationField.domain;
            if (types.indexOf(typeName) > -1) {
                if (!property ||
                    (relationField as any)[property] == undefined ||
                    (relationField as any)[property] == true) {
                    availableRelationFields.push(relationField);
                }
            }
        }
        return availableRelationFields;
    }


    export function makeTypesMap(configuration: ConfigurationDefinition): { [typeName: string]: IdaiType } {

        const [parentDefs, childDefs] = separate(on(PARENT, isNot(defined)))(configuration.types);
        const parentTypes = makeLookup(NAME)(map(IdaiType.build)(parentDefs));

        return childDefs.reduce(addChildType, parentTypes) as { [typeName: string]: IdaiType };
    }


    function addChildType(typesMap: { [typeName: string]: IdaiType }, childDef: TypeDefinition) {

        const parentType = typesMap[childDef.parent as string];
        if (parentType === undefined) throw MDInternal.PROJECT_CONFIGURATION_ERROR_GENERIC;

        const childType = IdaiType.build(childDef);
        childType.fields = IdaiType.makeChildFields(parentType, childType);
        childType.parentType = parentType;
        typesMap[childDef.type] = childType;
        parentType.children.push(childType);

        return typesMap;
    }
}