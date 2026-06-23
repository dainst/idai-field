import { Document } from '../model/document/document';
import { Warnings } from '../model/warnings';


/**
 * @author Thomas Kleinke
 */
export class WarningsManager {

    private warnings: { [resourceId: string]: Warnings } = {};


    constructor() {}


    public get(document: Document): Warnings {

        if (!document) return undefined;

        return this.warnings[document.resource.id];
    }


    public set(document: Document, warnings: Warnings) {

        if (!document) return;

        if (warnings && Warnings.hasWarnings(warnings)) {
            this.warnings[document.resource.id] = warnings;
        } else {
            delete this.warnings[document.resource.id];
        }
    }
}
