import {compose, filter, isDefined, keysAndValues, map, Map, to, values} from 'tsfun';
import {
    TransientFieldDefinition,
    TransientTypeDefinition
} from '../model/transient-type-definition';


export const getDefinedParents =
    compose(
        values,
        map(to('parent')),
        filter(isDefined));


export function iterateOverFieldsOfTypes(types: Map<TransientTypeDefinition>,
                                  f: (typeName: string, type: TransientTypeDefinition,
                                      fieldName: string, field: TransientFieldDefinition) => void) {

    keysAndValues(types).forEach(([typeName, type]) => {
        keysAndValues((type as any).fields).forEach(([fieldName, field]: any) => {
            f(typeName, type as any, fieldName, field);
        })
    });
}