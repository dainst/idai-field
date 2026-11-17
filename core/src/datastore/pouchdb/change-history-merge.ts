import { Document } from '../../model/document/document';
import { Action } from '../../model/document/action';


/**
 * @author Thomas Kleinke
 * @author Daniel de Oliveira
 */
export module ChangeHistoryMerge {

    /**
     * Merges the change histories of two documents.
     *
     * Only the mainDocument is changed. Its change history merges with the change history (created & modified actions)
     * of the secondDocument.
     */
    export function mergeChangeHistories(mainDocument: Document, secondDocument: Document) {

        const changeHistory: Array<Action> = getCombinedChangeHistory([mainDocument, secondDocument]);
        sortChangeHistory(changeHistory);

        if (changeHistory.length === 0) return;

        mainDocument.created = changeHistory.shift() as Action;
        mainDocument.modified = changeHistory;
    }


    function getCombinedChangeHistory(documents: Array<Document>): Array<Action> {

        return documents.reduce(
            (changeHistory: Array<Action>, document: Document) =>
                (addActionsToChangeHistory(changeHistory, document), changeHistory),
            []);
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

        return changeHistory.find(_ => isSameAction(action, _)) !== undefined;
    }


    function isSameAction(action1: Action, action2: Action): boolean {

        return ((action1.date as any).getTime() === (action2.date as any).getTime()
            && action1.user === action2.user);
    }


    function sortChangeHistory(changeHistory: Array<Action>) {

        changeHistory.sort((action1, action2) => {
            if (action1.date < action2.date) return -1;
            if (action2.date < action1.date) return 1;
            return 0;
        });
    }
}
