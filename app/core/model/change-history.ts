import {Document, Action} from 'idai-components-2/core';

/**
 * @author Thomas Kleinke
 */
export module ChangeHistory {

    /**
     * Merges the change histories of two documents.
     *
     * Only the mainDocument is changed. Its change history merges with the change history (created & modified actions)
     * of the secondDocument.
     */
    export function mergeChangeHistories(mainDocument: Document, secondDocument: Document) {

        const changeHistory: Array<Action> = getCombinedChangeHistory([mainDocument, secondDocument]);
        sortChangeHistory(changeHistory);

        if (changeHistory.length == 0) return;

        mainDocument.created = changeHistory.shift() as Action;
        mainDocument.modified = changeHistory;
    }


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
            if (new Date(latestRevisionAction.date as any) > new Date(latestAction.date as any)) {
                latestAction = latestRevisionAction;
            }
        }

        return latestAction && latestAction.user != username;
    }


    function getCombinedChangeHistory(documents: Array<Document>): Array<Action> {

        return documents.reduce(
            (changeHistory: Array<Action>, document: Document) =>
                (addActionsToChangeHistory(changeHistory, document), changeHistory),
            []);
    }


    function sortChangeHistory(changeHistory: Array<Action>) {

        changeHistory.sort((action1, action2) => {
            const date1 = new Date(action1.date as any);
            const date2 = new Date(action2.date as any);

            if (date1 < date2) return -1;
            if (date2 < date1) return 1;
            return 0;
        });
    }


    function addActionsToChangeHistory(changeHistory: Array<Action>, document: Document) {

        if (document.created && !isInChangeHistory(document.created, changeHistory)) {
            changeHistory.push(document.created);
        }

        if (document.modified) {
            document.modified
                .filter(action => !isInChangeHistory(action, changeHistory))
                .forEach(action => changeHistory.push(action));
        }
    }


    function isInChangeHistory(action: Action, changeHistory: Array<Action>): boolean {

        return changeHistory.find(_ => isSameAction(action, _)) != undefined;
    }


    function isSameAction(action1: Action, action2: Action): boolean {

        return ((action1.date as any).getTime() === (action2.date as any).getTime()
            && action1.user === action2.user);
    }
}