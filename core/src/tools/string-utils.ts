const parseInteger = parseInt;

/**
 * @author Daniel de Oliveira
 */
export module StringUtils {

    export const toLowerCase = (s: string) => s.toLowerCase();
    
    export const toUpperCase = (s: string) => s.toUpperCase();

    export const append = (insert: string) => (to: string) => to + insert;
    
    export const prepend = (insert: string) => (to: string) => insert + to;

    export const stringify = (o: any) => JSON.stringify(o);

    export const startsWith = (what: string) => (source: string) => source.startsWith(what);
    
    export const endsWith = (what: string) => (source: string) => source.endsWith(what);

    export const size = (s: string) => s.length;

    export const split = (pattern: RegExp|string) => (content: string) => content.split(pattern);
    
    export const join = (pattern: string) => <A>(content: Array<A>): string => content.join(pattern);

    export const toArray = (s: string) => Array.from(s);

    // this function wraps parseInt to avoid cases where '0' was parsed to NaN, when passed directly to a higher order function
    // while doing this, we then also hand handle isNaN
    export function parseInt(s: string): number|undefined {

        const result = parseInteger(s);
        return isNaN(result)
            ? undefined
            : result;
    }
}
