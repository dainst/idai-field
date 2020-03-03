export interface BaseTypeDefinition {

    fields: BaseFieldDefinitions;
}


export type BaseFieldDefinitions = { [fieldName: string]: BaseFieldDefinition };


export interface BaseFieldDefinition {

    inputType?: string;
    constraintIndexed?: true
}