import { clone, filter, includedIn, isArray, isNot } from 'tsfun';
import { Document } from '../model/document';
import { FieldDefinition } from '../model/field-definition';
import { Resource } from '../model/resource';
import { ValueDefinition, ValuelistDefinition } from '../model/valuelist-definition';
import { SortUtil } from './sort-util';


const ELECTRON_CONFIG_LANGUAGES: string[] = typeof window !== 'undefined' && window.require
    ? window.require('@electron/remote').getGlobal('config').languages
    : ['de'];


/**
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 */
export module ValuelistUtil {

    export function getValuesNotIncludedInValuelist(resource: Resource|undefined, fieldName: string|undefined,
                                                    valuelist: ValuelistDefinition): string[]|undefined {

        if (!resource || !fieldName || !resource[fieldName] || !valuelist) return undefined;

        const itemsNotIncludedInValueList = isArray(resource[fieldName])
            ? resource[fieldName].filter(isNot(includedIn(Object.keys(valuelist.values))))
            : isNot(includedIn(Object.keys(valuelist.values)))(resource[fieldName])
                ? [resource[fieldName]]
                : [];

        return itemsNotIncludedInValueList.length > 0 ? itemsNotIncludedInValueList : undefined;
    }


    export function getValueLabel(valuelist: ValuelistDefinition, valueId: string, providedLanguages?: string[]): string {

        const languages = providedLanguages || ELECTRON_CONFIG_LANGUAGES;

        const value: ValueDefinition|undefined = valuelist ? valuelist.values[valueId] : undefined;
        if (!value) return valueId;

        const language: string = languages.find(languageCode => {
            return valuelist.values[valueId].labels?.[languageCode] !== undefined;
        });

        return language
            ? valuelist.values[valueId].labels[language]
            : valueId;
    }


    export function getValuelist(field: FieldDefinition, projectDocument: Document,
                                 parentResource?: Resource): ValuelistDefinition {

        const valuelist: ValuelistDefinition|string[] = field.valuelist
            ? field.valuelist
            : getValuelistFromProjectField(field.valuelistFromProjectField as string, projectDocument);

        return field.allowOnlyValuesOfParent && parentResource
                && parentResource.category !== 'Place'
            ? getValuesOfParentField(valuelist, field.name, parentResource)
            : valuelist;
    }


    export function getValuelistFromProjectField(fieldName: string,
                                                 projectDocument: Document): ValuelistDefinition {

        const id = 'project-' + fieldName;
        const field: string[]|undefined = projectDocument.resource[fieldName];

        return field && isArray(field)
            ? {
                values: field.reduce((values: { [fieldId: string]: ValueDefinition }, fieldName: string) => {
                    values[fieldName] = {};
                    return values;
                }, {}), id: id
            }
        : { values: {}, id: id };
    }


    export function getOrderedValues(valuelist: ValuelistDefinition): string[] {

        return Object.keys(valuelist.values).sort(
            valuelist.order
                ? sortByCustomOrder(valuelist.order)
                : sortAlphanumerically(valuelist)
        );
    }


    const sortByCustomOrder = (order: string[]) => (valueA: string, valueB: string): number => {

        return order.indexOf(valueA) - order.indexOf(valueB);
    };


    const sortAlphanumerically = (valuelist: ValuelistDefinition) => (valueA: string, valueB: string): number => {

        return SortUtil.alnumCompare(
            getValueLabel(valuelist, valueA).toLowerCase(),
            getValueLabel(valuelist, valueB).toLowerCase()
        );
    };


    function getValuesOfParentField(valuelist: ValuelistDefinition, fieldName: string,
                                    parentResource: Resource): ValuelistDefinition {

        const parentValues: string[] = parentResource[fieldName] ?? [];

        const result: ValuelistDefinition = clone(valuelist);
        result.values = filter((_, key: string) => {
            return parentValues.includes(key);
        })(valuelist.values) as { [key: string]: ValueDefinition };

        return result;
    }
}
