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
            removed: IdDiffTool.reduceLayers(original.slice(0), target),
            added: IdDiffTool.nonIncluded(original.slice(0), target),
        };
    }


    private static nonIncluded(original: string[], compared: string[]): Array<string> {

        return compared.filter(item => original.indexOf(item) == -1);
    }

    /**
     * Removes items from original which are not part of target
     * @returns the removed items
     */
    private static reduceLayers(original: string[], target: string[]): Array<string> {

        const removedItems: string[] = [];

        for (let item of original) {
            if (target.indexOf(item) > -1) continue;
            removedItems.push(item);
        }

        for (let layerToRemove of removedItems) {
            original.splice(original.indexOf(layerToRemove), 1);
        }

        return removedItems;
    }
}