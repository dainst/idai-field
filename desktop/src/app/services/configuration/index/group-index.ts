import { flatten, keysValues, right, set } from 'tsfun';
import { CategoryForm, I18N } from 'idai-field-core';
import { tokenize } from './tokenize';


export interface GroupIndex {

    [term: string]: Array<GroupEntry>;
}


export type GroupEntry = {

    name: string;
    label: I18N.String;
};


/**
 * @author Thomas Kleinke
 */
export namespace GroupIndex {

    export function create(selectedForms: Array<CategoryForm>): GroupIndex {

        return selectedForms.reduce((index, form) => {
            const groupEntries = form.groups
                .filter(group => !['parent', 'child'].includes(group.name)) // TODO Remove this as soon as parent/child groups are gone
                .map(group => { return { name: group.name, label: group.label }});
            for (const groupEntry of groupEntries) {
                const terms: string[] = tokenize(
                    [groupEntry.name].concat(groupEntry.label ? Object.values(groupEntry.label) : [])
                );
                for (const term of terms) {
                    if (!index[term]) index[term] = [];
                    if (!index[term].find(group => group.name === groupEntry.name)) index[term].push(groupEntry);
                }
            }
            return index;
        }, {});
    }


    export function find(index: GroupIndex, searchTerm: string): Array<GroupEntry> {

        return set(flatten(keysValues(index)
            .filter(([indexTerm, _]) => indexTerm.toLocaleLowerCase().startsWith(searchTerm.toLowerCase()))
            .map(right)
        ));
    }
}
