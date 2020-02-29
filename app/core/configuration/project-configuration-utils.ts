import {TypeDefinition} from './model/type-definition';
import {flow, map} from 'tsfun';
import {IdaiType} from './model/idai-type';
import {makeLookup, objectReduce} from '../util/utils';
import {RelationDefinition} from './model/relation-definition';
import {ConfigurationDefinition} from './boot/configuration-definition';
import {MDInternal} from 'idai-components-2';

export const NAME = 'name';

/**
 * @author Thomas Kleinke
 * @author Daniel de Oliveira
 * @author Sebastian Cuy
 */
export module ProjectConfigurationUtils {


    export function getTypeAndSubtypes(projectTypesMap: { [type: string]: IdaiType },
                                       superTypeName: string): { [typeName: string]: IdaiType } {

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


    export function initTypes(configuration: ConfigurationDefinition) {

        for (let type of configuration.types) {
            if (!type.color) type.color = ProjectConfigurationUtils.generateColorForType(type.type);
        }
        return objectReduce(
            addParentType,
            makeTypesMap(configuration.types))
        (configuration.types);
    }


    function addParentType(typesMap: { [typeName: string]: IdaiType }, type: TypeDefinition) {

        if (!type.parent) return;

        const parentType = typesMap[type.parent];
        if (parentType === undefined) throw MDInternal.PROJECT_CONFIGURATION_ERROR_GENERIC;
        IdaiType.addChildType(parentType, typesMap[type.type]);
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


    export function getLabel(fieldName: string, fields: Array<any>): string {

        for (let field of fields) {
            if (field.name === fieldName) {
                return field.label
                    ? field.label
                    : fieldName;
            }
        }
        return fieldName;
    }


    export function generateColorForType(typeName: string): string {

        const hash = hashCode(typeName);
        const r = (hash & 0xFF0000) >> 16;
        const g = (hash & 0x00FF00) >> 8;
        const b = hash & 0x0000FF;
        return '#' + ('0' + r.toString(16)).substr(-2)
            + ('0' + g.toString(16)).substr(-2) + ('0' + b.toString(16)).substr(-2);
    }


    export function isBrightColor(color: string): boolean {

        color = color.substring(1); // strip #
        let rgb = parseInt(color, 16);   // convert rrggbb to decimal
        let r = (rgb >> 16) & 0xff;  // extract red
        let g = (rgb >>  8) & 0xff;  // extract green
        let b = (rgb >>  0) & 0xff;  // extract blue
        let luma = 0.2126 * r + 0.7152 * g + 0.0722 * b; // per ITU-R BT.709

        return luma > 200;
    }


    function makeTypesMap(types: Array<TypeDefinition>): { [typeName: string]: IdaiType } {

        return flow(
            types,
            map(IdaiType.build),
            makeLookup(NAME));
    }


    function hashCode(string: any): number {

        let hash = 0, i, chr;
        if (string.length === 0) return hash;
        for (i = 0; i < string.length; i++) {
            chr   = string.charCodeAt(i);
            hash  = ((hash << 5) - hash) + chr;
            hash |= 0; // Convert to 32bit integer
        }
        return hash;
    }
}