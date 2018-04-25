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

        mainDocument.created = changeHistory.shift();
        mainDocument.modified = changeHistory;
    }


    // TODO make sure callers which work with date get a string instead of a date
    // as soon as document model is changed
    export function getLastModified(document: Document): Action {

        return (document.modified && document.modified.length > 0)
            ? document.modified[document.modified.length - 1]
            : document.created as Action;
    }


    export function isRemoteChange(document: Document, conflictedRevisions: Array<Document>,
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

        const changeHistory: Array<Action> = [];

        for (let document of documents) {
            addActionsToChangeHistory(changeHistory, document);
        }

        return changeHistory;
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
            for (let action of document.modified) {
                if (!isInChangeHistory(action, changeHistory)) {
                    changeHistory.push(action);
                }
            }
        }
    }


    function isInChangeHistory(action: Action, changeHistory: Array<Action>): boolean {

        for (let actionToCompare of changeHistory) {
            if (isSameAction(action, actionToCompare)) return true;
        }

        return false;
    }


    function isSameAction(action1: Action, action2: Action): boolean {

        // TODO Datastore should make sure every date is an instance of Date
        const date1: Date = action1.date instanceof Date ? action1.date : new Date((action1 as any).date);
        const date2: Date = action2.date instanceof Date ? action2.date : new Date((action2 as any).date);

        return date1.getTime() == date2.getTime() && action1.user == action2.user;
    }
}