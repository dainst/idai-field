import { Valuelist } from 'idai-field-core';
import { ConfigurationIndex } from '../../../../services/configuration/index/configuration-index';


export interface ValuelistSearchQuery {

    queryString: string;
    onlyCustom: boolean;
    onlyInUse: boolean;
}


/**
 * @author Thomas Kleinke
 */
export module ValuelistSearchQuery {

    export function buildDefaultQuery(): ValuelistSearchQuery {

        return {
            queryString: '',
            onlyCustom: false,
            onlyInUse: false
        };
    }


    export function applyFilters(query: ValuelistSearchQuery, valuelists: Array<Valuelist>,
                                 configurationIndex: ConfigurationIndex): Array<Valuelist> {
        
        return valuelists.filter(valuelist => {
            return !valuelist.deprecated
                && (!query.onlyCustom || valuelist.source === 'custom')
                && (!query.onlyInUse
                    || configurationIndex.getValuelistUsage(valuelist.id).length > 0);
        });
    }
}
