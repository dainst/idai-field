import { I18N } from 'idai-field-core';
import { tokenize } from '../../../services/configuration/index/tokenize';

/**
 * @author Thomas Kleinke
 */
export function getSearchResultLabel(item: I18N.LabeledValue, searchTerm: string,
                                     getLabel: (value: I18N.LabeledValue) => string): string|undefined {

    if (searchTerm === ''
            || containsSearchTerm(getLabel(item), searchTerm)
            || containsSearchTerm(item.name, searchTerm)) {
        return undefined;
    }

    return Object.values(item.label).find(translation => {
        return containsSearchTerm(translation, searchTerm);
    });
}


export function containsSearchTerm(term: string, searchTerm: string): boolean {

    return tokenize([term.toLocaleLowerCase()])
        .find(token => token.startsWith(searchTerm.toLocaleLowerCase())) !== undefined;
}
