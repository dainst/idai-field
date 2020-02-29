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

    export function build(definition: TypeDefinition): IdaiType {

        const idaiType: any = {};

        idaiType.mustLieWithin = definition.mustLieWithin;
        idaiType.name = definition.type;
        idaiType.label = definition.label || idaiType.name;
        idaiType.fields = definition.fields || [];
        idaiType.isAbstract = definition.abstract || false;
        idaiType.color = definition.color;

        return idaiType as IdaiType;
    }


    export function addChildType(type: IdaiType, child: IdaiType): void {

        try {
            setParentType(child, type);
        } catch (e) {
            e.push(type.name);
            e.push(child.name);
            throw [e];
        }
        type.children = (type.children || []).concat(child);
    }


    function setParentType(type: IdaiType, parent: IdaiType): void {

        type.parentType = parent;

        for (let field of type.fields) {
            if (!field['group']) (field as any)['group'] = 'child';
        }

        type.fields = getCombinedFields(parent.fields, type.fields);
    }


    function getCombinedFields(parentFields: Array<FieldDefinition>,
                               childFields: Array<FieldDefinition>) {

        const fields: Array<FieldDefinition> = clone(parentFields);

        childFields.forEach(childField => {
            const field: FieldDefinition|undefined
                = fields.find(field => field.name === childField.name);

            if (field) {
                if (field.name === 'campaign') {
                    mergeFields(childField, field);
                } else {
                    throw ['tried to overwrite field of parent type', field.name];
                }
            } else {
                fields.push(childField);
            }
        });

        return fields;
    }


    function mergeFields(sourceField: any, targetField: any) {

        Object.keys(sourceField).forEach(key => targetField[key] = sourceField[key]);
    }
}