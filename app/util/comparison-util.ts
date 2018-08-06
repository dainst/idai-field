import {arrayEquivalent, arrayEquivalentBy, jsonEqual, isNot} from 'tsfun';

/**
 * @author Thomas Kleinke
 * @author Daniel de Oliveira
 */
export module ComparisonUtil {


    // TODO make use includedIn,
    export function findDifferingFieldsInResource(resource1: Object, resource2: Object,
                                                  fieldsToIgnore?: string[]): string[] {

        return Object.keys(resource1)
            .filter(key => fieldsToIgnore && fieldsToIgnore.indexOf(key) > -1)
            .reduce(
                concatIf(
                    key =>
                        !ComparisonUtil.compare(
                            (resource1 as any)[key],
                            (resource2 as any)[key])),
                [] as string[]);
    }


    export function findDifferingFieldsInRelations(relations1: Object, relations2: Object) {

        return Object.keys(relations1)
            .reduce(
                concatIf(
                    key =>
                    !arrayEquivalent
                        ((relations1 as any)[key])
                        ((relations2 as any)[key])),
                [] as string[]);
    }

    // TODO possibly put to tsfun
    export const concatIf = (f: (_: string) => boolean) => (acc: string[], val: string) =>
        f(val) ? acc.concat([val as string]) : acc;


    export function compare(value1: any, value2: any): boolean {

        if (!value1 && !value2) return true;
        if ((value1 && !value2) || (!value1 && value2)) return false;

        const type1: string = getType(value1);
        const type2: string = getType(value2);

        if (type1 !== type2) return false;

        if (type1 === 'array' && type2 === 'array') {
            return arrayEquivalentBy(jsonEqual)(value1)(value2)
        }

        return jsonEqual(value1)(value2);
    }


    function getType(value: any): string {

        return typeof value == 'object'
            ? value instanceof Array
                ? 'array'
                : 'object'
            : 'flat';
    }
}
