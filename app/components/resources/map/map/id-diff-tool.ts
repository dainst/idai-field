export interface IdDiffResult {

    added: Array<string>,
    removed: Array<string>
}

/**
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 */
export class IdDiffTool {

    /**
     * @returns
     *  removed: all items of original which are included in target
     *  added: all items of target which are not included in original
     */
    public static transduce(original: string[], target: string[]): IdDiffResult {

        return {
            removed: original.filter(item => target.indexOf(item) == -1),
            added: target.filter(item => original.indexOf(item) == -1),
        };
    }
}