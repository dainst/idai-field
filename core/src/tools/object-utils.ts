/**
 * @author Thomas Kleinke
 * @author Daniel de Oliveira
 */
export module ObjectUtils {

    export function jsonClone(x: any) { return JSON.parse(JSON.stringify(x)); }
}
