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

        let changeHistory: Array<Action> = ChangeHistoryUtil.getCombinedChangeHistory([mainDocument, secondDocument]);
        ChangeHistoryUtil.sortChangeHistory(changeHistory);

        if (changeHistory.length == 0) return;

        mainDocument.created = changeHistory.shift();
        mainDocument.modified = changeHistory;
    }

    private static getCombinedChangeHistory(documents: Array<Document>) {

        let changeHistory: Array<Action> = [];

        for (let document of documents) {
            ChangeHistoryUtil.addActionsToChangeHistory(changeHistory, document);
        }

        return changeHistory;
    }

    private static sortChangeHistory(changeHistory: Array<Action>) {

        changeHistory.sort((action1, action2) => {
            let date1 = new Date(action1.date);
            let date2 = new Date(action2.date);

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

        return changeHistory;
    }

    private static isInChangeHistory(action: Action, changeHistory: Array<Action>) {

        for (let actionToCompare of changeHistory) {
            if (ChangeHistoryUtil.isSameAction(action, actionToCompare)) return true;
        }

        return false;
    }

    private static isSameAction(action1: Action, action2: Action) {

        return action1.date == action2.date && action1.user == action2.user;
    }

}