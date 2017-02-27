import {IdaiType} from  'idai-components-2/configuration';
import {FilterSet, Filter} from 'idai-components-2/datastore';

/**
 * @author Thomas Kleinke
 * @author Daniel de Oliveira
 */
export class FilterUtility {


    public static getNonImageTypesFilterSet(typesMap) {
        let filters: Array<Filter> = [];
        for (let i in typesMap) {
            if (typesMap[i].name!='image' && (!typesMap[i].parentType || typesMap[i].parentType.name!='image')) {
                filters.push({
                    field: 'type',
                    value: typesMap[i].name,
                    invert: false
                });
            }
        }
        return { filters, type: undefined };
    }

    public static getImageTypesFilterSet(typesMap) {
        let filters: Array<Filter> = [];
        for (let i in typesMap) {
            if (typesMap[i].name=='image' || (typesMap[i].parentType && typesMap[i].parentType.name=='image')) {
                filters.push({
                    field: 'type',
                    value: typesMap[i].name,
                    invert: false
                });
            }
        }
        return { filters, type: undefined };
    }
}