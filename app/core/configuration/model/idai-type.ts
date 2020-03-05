import {TypeDefinition} from './type-definition';
import {FieldDefinition} from './field-definition';
import {clone} from '../../util/object-util';


export interface IdaiType {

    children: Array<IdaiType>;
    parentType: IdaiType|undefined; //  = undefined;
    isAbstract: boolean;
    name: string;
    label: string;
    color: string|undefined;
    fields: Array<FieldDefinition>;
    mustLieWithin: boolean|undefined; // = undefined;
}


/**
 * @author F.Z.
 * @author Thomas Kleinke
 * @author Daniel de Oliveira
 */
export module IdaiType {

    export const COLOR = 'color';
    export const PARENTTYPE = 'parentType';


    export function build(definition: TypeDefinition): IdaiType {

        const idaiType: any = {};
        idaiType.mustLieWithin = definition.mustLieWithin;
        idaiType.name = definition.type;
        idaiType.label = definition.label || idaiType.name;
        idaiType.fields = definition.fields || [];
        idaiType.isAbstract = definition.abstract || false;
        idaiType.color = definition.color ?? generateColorForType(definition.type);
        idaiType.children = [];
        return idaiType as IdaiType;
    }


    export function makeChildFields(type: IdaiType, child: IdaiType): Array<FieldDefinition> {

        try {
            const childFields = getCombinedFields(type.fields, child.fields);
            for (let field of childFields) {
                if (!field['group']) (field as any)['group'] = 'child';
            }
            return childFields;
        } catch (e) {
            e.push(type.name);
            e.push(child.name);
            throw [e];
        }
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


    export function isBrightColor(color: string): boolean {

        color = color.substring(1); // strip #
        let rgb = parseInt(color, 16);   // convert rrggbb to decimal
        let r = (rgb >> 16) & 0xff;  // extract red
        let g = (rgb >>  8) & 0xff;  // extract green
        let b = (rgb >>  0) & 0xff;  // extract blue
        let luma = 0.2126 * r + 0.7152 * g + 0.0722 * b; // per ITU-R BT.709

        return luma > 200;
    }


    function getCombinedFields(parentFields: Array<FieldDefinition>,
                               childFields: Array<FieldDefinition>) {

        const fields: Array<FieldDefinition> = clone(parentFields);

        childFields.forEach(childField => {
            const field: FieldDefinition|undefined
                = fields.find(field => field.name === childField.name);

            if (field) {
                if (field.name !== 'campaign') {
                    throw ['tried to overwrite field of parent type', field.name];
                }
            } else {
                fields.push(childField);
            }
        });

        return fields;
    }


    function generateColorForType(typeName: string): string {

        const hash = hashCode(typeName);
        const r = (hash & 0xFF0000) >> 16;
        const g = (hash & 0x00FF00) >> 8;
        const b = hash & 0x0000FF;
        return '#' + ('0' + r.toString(16)).substr(-2)
            + ('0' + g.toString(16)).substr(-2) + ('0' + b.toString(16)).substr(-2);
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