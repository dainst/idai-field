import {Document} from 'idai-components-2/core';

/**
 * @author Thomas Kleinke
 * @author Daniel de Oliveira
 */
export class RevisionHelper {


    public static getPreviousRevisionId(history: any, revision: Document) {

        const previousRevisionNumber: number = RevisionHelper.getRevisionNumber(revision) - 1;

        if (previousRevisionNumber < 1) return undefined;

        const prefix = previousRevisionNumber.toString() + '-';
        let previousRevisionId: string = '';

        for (let historyElement of history) {
            if (historyElement.rev.startsWith(prefix) && historyElement.status == 'available') {
                previousRevisionId = historyElement.rev;
                break;
            }
        }

        return previousRevisionId;
    }


    private static getRevisionNumber(revision: Document): number {

        const revisionId = (revision as any)['_rev'];
        const index = revisionId.indexOf('-');
        const revisionNumber = revisionId.substring(0, index);

        return parseInt(revisionNumber);
    }
}