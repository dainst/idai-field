export interface LanguageConfiguration {

    categories?: { [categoryName: string]: CategoryLanguageDefinition };
    relations?: { [relationName: string]: RelationLanguageDefinition };
    groups?: { [groupName: string]: string };
    commons?: { [fieldName: string]: FieldLanguageDefinition };
    fields?: { [fieldName: string]: FieldLanguageDefinition };
    other?: { [fieldName: string]: string };
}


export interface CategoryLanguageDefinition {

    label?: string;
    fields?: { [fieldName: string]: FieldLanguageDefinition };
}


export interface FieldLanguageDefinition {

    label?: string;
    description?: string;
}

export interface RelationLanguageDefinition {

    label?: string;
}
