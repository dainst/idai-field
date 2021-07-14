import { clone, filter, includedIn, isArray, isNot } from 'tsfun';
import { Document } from '../model/document';
import { FieldDefinition } from '../model/field-definition';
import { Resource } from '../model/resource';
import { ValueDefinition, ValuelistDefinition } from '../model/valuelist-definition';
import { I18N } from './i18n';
import { SortUtil } from './sort-util';


/**
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 */
export module ValuelistUtil {

    export function getValuesNotIncludedInValuelist(resource: Resource|undefined,
                                                    fieldName: string|undefined,
                                                    valuelist: ValuelistDefinition): string[]|undefined {

        if (!resource || !fieldName || !resource[fieldName] || !valuelist) return undefined;

        const itemsNotIncludedInValueList = isArray(resource[fieldName])
            ? resource[fieldName].filter(isNot(includedIn(Object.keys(valuelist.values))))
            : isNot(includedIn(Object.keys(valuelist.values)))(resource[fieldName])
                ? [resource[fieldName]]
                : [];

        return itemsNotIncludedInValueList.length > 0 ? itemsNotIncludedInValueList : undefined;
    }


    export function getValueLabel(valuelist: ValuelistDefinition, valueId: string, languages: string[]): string {

        const label: string|undefined = I18N.getTranslation(valuelist.values[valueId]?.labels, languages);
        return label ?? valueId;
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


    export function getOrderedValues(valuelist: ValuelistDefinition, languages: string[]): string[] {

        return Object.keys(valuelist.values).sort(
            valuelist.order
                ? sortByCustomOrder(valuelist.order)
                : sortAlphanumerically(valuelist, languages)
        );
    }


    const sortByCustomOrder = (order: string[]) => (valueA: string, valueB: string): number => {

        return order.indexOf(valueA) - order.indexOf(valueB);
    };


    const sortAlphanumerically = (valuelist: ValuelistDefinition, languages: string[]) => (valueA: string, valueB: string): number => {

        return SortUtil.alnumCompare(
            getValueLabel(valuelist, valueA, languages).toLowerCase(),
            getValueLabel(valuelist, valueB, languages).toLowerCase()
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
