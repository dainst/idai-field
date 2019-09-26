import {TypeDefinition} from './type-definition';
import {FieldDefinition} from './field-definition';

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


    constructor(definition: TypeDefinition) {

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
        // TODO This should probably better be done in ConfigLoader.
        this.fields = this.getCombinedFields(parent.fields, this.fields);
    }


    public addChildType(child: IdaiType) {

        if (!this.children) this.children = [];
        child.setParentType(this);
        this.children.push(child)
    }


    private getCombinedFields(parentFields: Array<FieldDefinition>, childFields: Array<FieldDefinition>) {

        const fields: Array<FieldDefinition> = parentFields.slice();

        childFields.forEach(childField => {
            const field: FieldDefinition|undefined
                = fields.find(field => field.name === childField.name);

            if (field) {
                this.mergeFields(childField, field);
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