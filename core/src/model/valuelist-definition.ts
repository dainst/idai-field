import { I18N } from '../tools/i18n';


export type ValuelistId = string;

export type Valuelists = { [fieldName: string]: ValuelistId }


/**
 * @author Daniel de Oliveira
 */
export interface ValuelistDefinition {

    id: string;
    values: { [key: string]: ValueDefinition }

    description?: { [language: string]: string }
    createdBy?: string;
    creationDate?: string;

    // Valuelists are shown in alphabetical order per default.
    // For cases in which another order is required, it can be specified in this property.
    order?: string[];

    extends?: string; // to be implemented
    constraints?: any; // to be implemented
}


export module ValuelistDefinition {

    export function getValueLabel(valuelist: ValuelistDefinition, valueId: string): I18N.String|undefined {

        return valuelist.values[valueId]?.label;
    }


    // TODO review why we return keys instead of labels
    export function orderKeysByLabels(valuelist: ValuelistDefinition, 
                                      alternativeComparator: (valuelist: ValuelistDefinition) => 
                                                             (a: string, b: string) => number): string[] {

        return Object.keys(valuelist.values).sort(
            valuelist.order
                ? sortByCustomOrder(valuelist.order)
                : alternativeComparator(valuelist));
    }


    const sortByCustomOrder = (order: string[]) => (valueA: string, valueB: string): number => {

        return order.indexOf(valueA) - order.indexOf(valueB);
    };
    

    export function assertIsValid(valuelistDefinition: ValuelistDefinition) {

        if (valuelistDefinition.description === undefined) return ['missing', 'description'];
        if (valuelistDefinition.createdBy === undefined) return ['missing', 'createdBy'];
        if (valuelistDefinition.creationDate === undefined) return ['missing', 'creationDate'];
        return undefined;
    }
}


export interface ValueDefinition extends I18N.Labeled {

    references?: { [referenceKey: string]: string },
}
