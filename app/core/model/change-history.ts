import {Document, Action} from 'idai-components-2/core';

/**
 * @author Thomas Kleinke
 */
export module ChangeHistory {

    export function isRemoteChange(
        document: Document,
        conflictedRevisions: Array<Document>,
        username: string): boolean {

        let latestAction: Action = Document.getLastModified(document);

        for (let revision of conflictedRevisions) {
            const latestRevisionAction: Action = Document.getLastModified(revision);
            if (latestRevisionAction.date > latestAction.date) {
                latestAction = latestRevisionAction;
            }
        }

        return latestAction && latestAction.user !== username;
    }
}