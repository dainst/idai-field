import {map, on, separate, defined, isNot, update, flatten, flow, reduce,
    assoc, append, Map, values, to, lookup, cond, throws, forEach} from 'tsfun';
import {TypeDefinition} from './model/type-definition';
import {FieldsGroup, IdaiType} from './model/idai-type';
import {makeLookup} from '../util/utils';
import {RelationDefinition} from './model/relation-definition';
import {ConfigurationDefinition} from './boot/configuration-definition';
import {MDInternal} from 'idai-components-2';
import {isUndefined} from 'tsfun/src/predicate';
import {FieldDefinition} from './model/field-definition';
import {Group} from './group-util';
import {clone} from '../util/object-util';


/**
 * @author Thomas Kleinke
 * @author Daniel de Oliveira
 * @author Sebastian Cuy
 */
export module ProjectConfigurationUtils {

    // TODO reimplement; test
    export function getTypeAndSubtypes(projectTypesMap: Map<IdaiType>,
                                       superTypeName: string): Map<IdaiType> {

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


    export function makeTypesMap(configuration: ConfigurationDefinition): Map<IdaiType> {

        const [parentDefs, childDefs] =
            separate(on(TypeDefinition.PARENT, isNot(defined)))(configuration.types);

        const parentTypes =
            flow(
                parentDefs,
                map(IdaiType.build),
                map(update(IdaiType.FIELDS, IdaiType.ifUndefinedSetGroupTo(Group.PARENT))),
                makeLookup(IdaiType.NAME));

        return flow(
            childDefs,
            reduce(addChildType, parentTypes),
            flattenTypesTreeMapToTypesMap,
            fillGroups);
    }


    // TODO make pure
    function fillGroups(typesMap: Map<IdaiType>): Map<IdaiType> {

        return map((type: IdaiType) => {
            const groups: Map<FieldsGroup> = {};

            for (let field of type.fields) {
                if (!groups[field.group]) groups[field.group] = { fields: [] };
                groups[field.group].fields = groups[field.group].fields.concat(field);
            }
            type.groups = groups;
            return type;
        })(typesMap);
    }


    function flattenTypesTreeMapToTypesMap(typesMap: Map<IdaiType>): Map<IdaiType> {

        const topLevelTypes: Array<IdaiType> = values(typesMap);
        const children: Array<IdaiType> = flatten(topLevelTypes.map(to(IdaiType.CHILDREN)));
        return makeLookup(IdaiType.NAME)(topLevelTypes.concat(children))
    }


    function addChildType(typesMap: Map<IdaiType>,
                          childDef: TypeDefinition): Map<IdaiType> {

        return flow(childDef.parent,
            lookup(typesMap),
            cond(isUndefined,
                throws(MDInternal.PROJECT_CONFIGURATION_ERROR_GENERIC)),
                addChildTypeToParent(typesMap, childDef));
    }


    function addChildTypeToParent(typesMap: Map<IdaiType>, childDef: TypeDefinition) {

        return (parentType: IdaiType): Map<IdaiType> => {

            const childType = IdaiType.build(childDef);
            childType.fields = IdaiType.makeChildFields(parentType, childType);

            const newParentType: any = update(IdaiType.CHILDREN, append(childType))(parentType as any);
            childType.parentType = newParentType;

            return assoc(parentType.name, newParentType)(typesMap);
        }
    }
}