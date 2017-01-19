import {IdaiType} from  'idai-components-2/configuration';
import {FilterSet, Filter} from 'idai-components-2/datastore';

/**
 * @author Thomas Kleinke
 */
export class FilterUtility {

    public static addChildTypesToFilterSet(filterSet: FilterSet, typesMap: { [type: string]: IdaiType }): FilterSet {

        var filters: Array<Filter> = [];

        for (let i in filterSet.filters) {
            filters.push(filterSet.filters[i]);
            if (filterSet.filters[i].field == "type") {
                let type = typesMap[filterSet.filters[i].value];
                if (type.children) {
                    for (let j in type.children) {
                        filters.push({
                            field: 'type',
                            value: type.children[j].name,
                            invert: filterSet.filters[i].invert
                        });
                    }
                }
            }
        }

        return {filters: filters, type: filterSet.type};
    }
}