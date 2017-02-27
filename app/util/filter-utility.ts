import {IdaiType} from  'idai-components-2/configuration';
import {FilterSet} from 'idai-components-2/datastore';

/**
 * @author Thomas Kleinke
 * @author Daniel de Oliveira
 */
export class FilterUtility {


    public static getNonImageTypesFilterSet(typesMap) {
        let filters: Array<string> = [];
        for (let i in typesMap) {
            if (typesMap[i].name!='image' && (!typesMap[i].parentType || typesMap[i].parentType.name!='image')) {
                filters.push(
                    typesMap[i].name
                )
            }
        }
        return { filters, type: undefined };
    }

    public static getImageTypesFilterSet(typesMap) {
        let filters: Array<string> = [];
        for (let i in typesMap) {
            if (typesMap[i].name=='image' || (typesMap[i].parentType && typesMap[i].parentType.name=='image')) {
                filters.push(
                    typesMap[i].name
                )
            }
        }
        return { filters, type: undefined };
    }
}