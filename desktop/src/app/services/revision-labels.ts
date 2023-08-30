import { Document } from 'idai-field-core';

const moment = typeof window !== 'undefined' ? window.require('moment') : require('moment');
const remote = typeof window !== 'undefined' ? window.require('@electron/remote') : undefined;


/**
 * @author Thomas Kleinke
 */
export module RevisionLabels {

    export function getRevisionLabel(revision: Document, timeSuffix: string): string {

        return Document.getLastModified(revision).user
            + ' – '
            + getLastModifiedDateLabel(revision, timeSuffix)
    }


    export function getLastModifiedDateLabel(revision: Document, timeSuffix: string): string {

        // If the translation text for the time suffix is set to '.', this indicates that no time suffix should be used for
        // the respective language.
        if (timeSuffix === '.') timeSuffix = '';

        const locale: string = remote.getGlobal('getLocale')();
        moment.locale(locale);

        const lastModifiedDate: Date = Document.getLastModified(revision).date;

        return moment(lastModifiedDate).format('LL') + ' '
            + moment(lastModifiedDate).format('LTS') + ' '
            + timeSuffix;
    }
}