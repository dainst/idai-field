// TODO

export interface BaseTypeDefinition {

    fields: BaseFieldDefinitions;
}


export type BaseTypeDefinitions = { [typeName: string]: BaseTypeDefinition };


export type BaseFieldDefinitions = { [fieldName: string]: BaseFieldDefinition };


export interface BaseFieldDefinition {

    inputType?: string;
}