import {Document, Action} from 'idai-components-2/core';

/**
 * @author Thomas Kleinke
 */
export module ChangeHistory {


    export function getLastModified(document: Document): Action {

        return (document.modified && document.modified.length > 0)
            ? document.modified[document.modified.length - 1]
            : document.created as Action;
    }


    export function isRemoteChange(
        document: Document,
        conflictedRevisions: Array<Document>,
        username: string): boolean {

        let latestAction: Action = ChangeHistory.getLastModified(document);

        for (let revision of conflictedRevisions) {
            const latestRevisionAction: Action = ChangeHistory.getLastModified(revision);
            if (latestRevisionAction.date > latestAction.date) {
                latestAction = latestRevisionAction;
            }
        }

        return latestAction && latestAction.user !== username;
    }
}