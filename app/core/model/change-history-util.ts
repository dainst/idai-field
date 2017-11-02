import {Document, Action} from 'idai-components-2/core';

/**
 * @author Thomas Kleinke
 */
export class ChangeHistoryUtil {

    /**
     *
     * Merges the change histories of two documents.
     *
     * Only the mainDocument is changed. Its change history merges with the change history (created & modified actions)
     * of the secondDocument.
     */
    public static mergeChangeHistories(mainDocument: Document, secondDocument: Document) {

        // TODO Return cloned instance

        const changeHistory: Array<Action> = ChangeHistoryUtil.getCombinedChangeHistory([mainDocument, secondDocument]);
        ChangeHistoryUtil.sortChangeHistory(changeHistory);

        if (changeHistory.length == 0) return;

        mainDocument.created = changeHistory.shift();
        mainDocument.modified = changeHistory;
    }


    // TODO make sure callers which work with date get a string instead of a date
    // as soon as document model is changed
    public static getLastModified(document: Document): Action {

        if (document.modified && document.modified.length > 0) {
            return document.modified[document.modified.length - 1];
        } else {
            return document.created as any;
        }
    }


    private static getCombinedChangeHistory(documents: Array<Document>): Array<Action> {

        const changeHistory: Array<Action> = [];

        for (let document of documents) {
            ChangeHistoryUtil.addActionsToChangeHistory(changeHistory, document);
        }

        return changeHistory;
    }


    private static sortChangeHistory(changeHistory: Array<Action>) {

        changeHistory.sort((action1, action2) => {
            const date1 = new Date(action1.date as any);
            const date2 = new Date(action2.date as any);

            if (date1 < date2) return -1;
            if (date2 < date1) return 1;
            return 0;
        });
    }


    private static addActionsToChangeHistory(changeHistory: Array<Action>, document: Document) {

        if (document.created && !ChangeHistoryUtil.isInChangeHistory(document.created, changeHistory)) {
            changeHistory.push(document.created);
        }

        if (document.modified) {
            for (let action of document.modified) {
                if (!ChangeHistoryUtil.isInChangeHistory(action, changeHistory)) {
                    changeHistory.push(action);
                }
            }
        }
    }


    private static isInChangeHistory(action: Action, changeHistory: Array<Action>): boolean {

        for (let actionToCompare of changeHistory) {
            if (ChangeHistoryUtil.isSameAction(action, actionToCompare)) return true;
        }

        return false;
    }


    private static isSameAction(action1: Action, action2: Action): boolean {

        return action1.date == action2.date && action1.user == action2.user;
    }
}