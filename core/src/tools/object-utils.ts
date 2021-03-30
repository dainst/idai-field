import {isAssociative, isPrimitive, map} from 'tsfun';


/**
 * @author Thomas Kleinke
 * @author Daniel de Oliveira
 */
export module ObjectUtils {

    export function jsonClone(x: any) { return JSON.parse(JSON.stringify(x)); }

    
    export function clone<T>(struct: T): T {
    
        if (isAssociative(struct)) return map(struct, clone) as any;
        if (isPrimitive(struct)) return struct;
        
        return (struct as any) instanceof Date
            ? new Date(struct)
            : jsonClone(struct);
    }
}
