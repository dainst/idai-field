import { Document } from 'idai-field-core';

const moment = typeof window !== 'undefined' ? window.require('moment') : require('moment');


/**
 * @author Thomas Kleinke
 */
export module RevisionLabels {

    export function getRevisionLabel(revision: Document): string {

        return Document.getLastModified(revision).user
            + ' - '
            + getLastModifiedDateLabel(revision)
    }


    export function getLastModifiedDateLabel(revision: Document): string {

        moment.locale('de');
        return moment(Document.getLastModified(revision).date).format('DD. MMMM YYYY HH:mm:ss [Uhr]');
    }
}