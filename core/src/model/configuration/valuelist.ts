import { I18N } from '../../tools/i18n';
import { ValuelistValue } from './valuelist-value';


export type ValuelistId = string;

export type Valuelists = { [fieldName: string]: ValuelistId }


/**
 * @author Daniel de Oliveira
 */
export interface Valuelist {

    id?: string;
    values: { [key: string]: ValuelistValue }

    description?: { [language: string]: string }
    createdBy?: string;
    creationDate?: string;

    // Valuelists are shown in alphabetical order per default.
    // For cases in which another order is required, it can be specified in this property.
    order?: string[];

    source?: Valuelist.SourceTypes;

    extends?: string; // to be implemented
    constraints?: any; // to be implemented
}


export module Valuelist {

    export type SourceTypes = 'library'|'custom';


    export function getValueLabel(valuelist: Valuelist, valueId: string): I18N.String|undefined {

        return valuelist.values[valueId]?.label;
    }


    // TODO review why we return keys instead of labels
    export function orderKeysByLabels(valuelist: Valuelist, 
                                      alternativeComparator: (valuelist: Valuelist) => 
                                                             (a: string, b: string) => number): string[] {

        return Object.keys(valuelist.values).sort(
            valuelist.order
                ? sortByCustomOrder(valuelist.order)
                : alternativeComparator(valuelist));
    }


    const sortByCustomOrder = (order: string[]) => (valueA: string, valueB: string): number => {

        return order.indexOf(valueA) - order.indexOf(valueB);
    };
    

    export function assertIsValid(valuelistDefinition: Valuelist) {

        if (valuelistDefinition.description === undefined) return ['missing', 'description'];
        if (valuelistDefinition.createdBy === undefined) return ['missing', 'createdBy'];
        if (valuelistDefinition.creationDate === undefined) return ['missing', 'creationDate'];
        return undefined;
    }
}
