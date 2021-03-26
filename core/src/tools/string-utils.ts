/**
 * @author Daniel de Oliveira
 */
export module StringUtils {

    export const toLowerCase = (s: string) => s.toLowerCase();
    
    export const toUpperCase = (s: string) => s.toUpperCase();

    export const append = (insert: string) => (to: string) => to + insert
    
    export const prepend = (insert: string) => (to: string) => insert + to

    export const stringify = (o: any) => JSON.stringify(o);


    export function split(pattern: RegExp|string) {

        return (content: string) => content.split(pattern);
    }
    
    
    export function join(pattern: string) {
    
        return <A>(content: Array<A>): string => content.join(pattern);
    }


    export function toArray(s: string) {

        return Array.from(s);
    }
}
