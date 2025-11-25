import { Document, formatDate } from 'idai-field-core';
import { getSystemTimezone } from '../util/timezones';
import { Settings } from './settings/settings';


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

        // If the translation text for the time suffix is set to '.', this indicates that no time suffix should be
        // used for the respective language.
        timeSuffix = timeSuffix === '.'
            ? ''
            : ' ' + timeSuffix;

        const lastModifiedDate: Date = Document.getLastModified(revision).date;
        return formatDate(lastModifiedDate, Settings.getLocale(), getSystemTimezone()) + timeSuffix;
    }
}