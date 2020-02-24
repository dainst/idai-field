import {TypeDefinition} from './type-definition';
import {FieldDefinition} from './field-definition';
import {clone} from '../../util/object-util';

/**
 * @author F.Z.
 * @author Thomas Kleinke
 */
export class IdaiType {

    public children: Array<IdaiType>;
    public parentType: IdaiType|undefined = undefined;
    public isAbstract: boolean;
    public name: string;
    public label: string;
    public color: string|undefined;
    public fields: Array<FieldDefinition>;

    /**
     * @see BuiltinTypeDefinition
     */
    public mustLieWithin: boolean|undefined = undefined;


    constructor(definition: TypeDefinition) {

        this.mustLieWithin = definition.mustLieWithin;
        this.name = definition.type;
        this.label = definition.label || this.name;
        this.fields = definition.fields || [];
        this.isAbstract = definition.abstract || false;
        this.color = definition.color;
    }


    private setParentType(parent: IdaiType) {

        this.parentType = parent;

        for (let field of this.fields) {
            if (!field['group']) (field as any)['group'] = 'child';
        }

        this.fields = this.getCombinedFields(parent.fields, this.fields);
    }


    public addChildType(child: IdaiType) {

        if (!this.children) this.children = [];
        try {
            child.setParentType(this);
        } catch (e) {
            e.push(this.name);
            e.push(child.name);
            throw [e];
        }
        this.children.push(child)
    }


    private getCombinedFields(parentFields: Array<FieldDefinition>, childFields: Array<FieldDefinition>) {

        const fields: Array<FieldDefinition> = clone(parentFields);

        childFields.forEach(childField => {
            const field: FieldDefinition|undefined
                = fields.find(field => field.name === childField.name);

            if (field) {
                if (field.name === 'campaign') {
                    this.mergeFields(childField, field);
                } else {
                    throw ['tried to overwrite field of parent type', field.name];
                }
            } else {
                fields.push(childField);
            }
        });

        return fields;
    }


    private mergeFields(sourceField: any, targetField: any) {

        Object.keys(sourceField).forEach(key => targetField[key] = sourceField[key]);
    }
}