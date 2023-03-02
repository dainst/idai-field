import { flatten, keysValues, right, set } from 'tsfun';
import { Field, Category } from 'idai-field-core';
import { tokenize } from './tokenize';


type IndexSection = { [term: string]: Array<Field> };

export interface FieldIndex {

    [categoryName: string]: IndexSection;
    commons: IndexSection;
}


/**
 * @author Thomas Kleinke
 */
export namespace FieldIndex {

    export function create(categories: Array<Category>,
                           commonFields: Array<Field>): FieldIndex {

        return categories.reduce((index, category) => {
            index[category.name] = createIndexSection(Object.values(category.fields));
            return index;
        }, { commons: createIndexSection(commonFields) });
    }


    export function find(index: FieldIndex,
                         searchTerm: string,
                         categoryName: string): Array<Field> {

        return set(flatten(keysValues(index[categoryName])
            .filter(([indexTerm, _]) => indexTerm.toLocaleLowerCase().startsWith(searchTerm.toLowerCase()))
            .map(right)
        ));
    }


    function createIndexSection(fields: Array<Field>): IndexSection {

        return fields.filter(field => field.selectable)
            .reduce((section, field) => {
                addToSection(field, section);
                return section;
            }, {});
    }


    function addToSection(field: Field, section: IndexSection) {

        const terms: string[] = tokenize(Object.values(field.defaultLabel).concat([field.name]));
    
        for (const term of terms) {
            if (!section[term]) section[term] = [];
            if (!section[term].includes(field)) section[term].push(field);
        }
    }
}
