import { clone, Map } from 'tsfun';
import { Valuelist } from '../../model/configuration/valuelist';


/**
 * @author Thomas Kleinke 
 */
export function mergeValuelists(libraryValuelists: Map<Valuelist>, customValuelists: Map<Valuelist>): Map<Valuelist> {

    const valuelists: Map<Valuelist> = Object.keys(libraryValuelists).reduce((result, valuelistId) => {
        result[valuelistId] = clone(libraryValuelists[valuelistId]);
        result[valuelistId].id = valuelistId;
        result[valuelistId].source = 'library';
        return result;
    }, {});

    return Object.keys(customValuelists).reduce((result, valuelistId) => {
        if (!result[valuelistId]) {
            result[valuelistId] = clone(customValuelists[valuelistId]);
            result[valuelistId].id = valuelistId;
            result[valuelistId].source = 'custom';
        }
        return result;
    }, valuelists);
}
