import {IdaiFieldResource} from 'idai-components-2/field';
import {unique, arrayEquivalent, arrayEquivalentBy, jsonEqual, isNot} from 'tsfun';

/**
 * @author Thomas Kleinke
 */
export class IdaiFieldDiffUtility {

    // TODO unit test
    public static findDifferingFields(resource1: IdaiFieldResource, resource2: IdaiFieldResource): string[] {

        const fieldsToIgnore: string[] = ['relations'];

        const differingFieldsNames: string[]
            = IdaiFieldDiffUtility.findDifferingFieldsInResource(resource1, resource2, fieldsToIgnore)
                .concat(IdaiFieldDiffUtility.findDifferingFieldsInResource(resource2, resource1, fieldsToIgnore));

        return unique(differingFieldsNames);
    }


    // TODO unit test
    public static findDifferingRelations(resource1: IdaiFieldResource, resource2: IdaiFieldResource): string[] {

        const differingRelationNames: string[]
            = IdaiFieldDiffUtility.findDifferingFieldsInRelations(resource1.relations, resource2.relations)
                .concat(IdaiFieldDiffUtility.findDifferingFieldsInRelations(resource2.relations, resource1.relations));

        return unique(differingRelationNames);
    }


    // TODO make use includedIn,
    private static findDifferingFieldsInResource(resource1: Object, resource2: Object,
                                                  fieldsToIgnore?: string[]): string[] {

        return Object.keys(resource1)
            .filter(key => fieldsToIgnore && fieldsToIgnore.indexOf(key) > -1)
            .reduce(
                IdaiFieldDiffUtility.concatIf(IdaiFieldDiffUtility.notCompareInBoth(resource1, resource2)),
                [] as string[]);
    }


    private static findDifferingFieldsInRelations(relations1: Object, relations2: Object) {

        return Object.keys(relations1)
            .reduce(
                IdaiFieldDiffUtility.concatIf(IdaiFieldDiffUtility.notArrayEquivalentInBoth(relations1, relations2)),
                [] as string[]);
    }


    private static notCompareInBoth = (l: any, r: any) => (key: string) =>
        !IdaiFieldDiffUtility.compare((l)[key], (r)[key]);


    private static notArrayEquivalentInBoth = (l: any, r: any) => (key: string) =>
        !arrayEquivalent(l[key])(r[key]);

    // TODO possibly put to tsfun
    private static concatIf = (f: (_: string) => boolean) => (acc: string[], val: string) =>
        f(val) ? acc.concat([val as string]) : acc;


    public static compare(value1: any, value2: any): boolean {

        if (!value1 && !value2) return true;
        if ((value1 && !value2) || (!value1 && value2)) return false;

        const type1: string = IdaiFieldDiffUtility.getType(value1);
        const type2: string = IdaiFieldDiffUtility.getType(value2);

        if (type1 !== type2) return false;

        if (type1 === 'array' && type2 === 'array') {
            return arrayEquivalentBy(jsonEqual)(value1)(value2)
        }

        return jsonEqual(value1)(value2);
    }


    private static getType(value: any): string {

        return typeof value == 'object'
            ? value instanceof Array
                ? 'array'
                : 'object'
            : 'flat';
    }
}
