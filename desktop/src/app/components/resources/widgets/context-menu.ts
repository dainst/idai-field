import {FieldDocument} from 'idai-field-core';


/**
 * @author Thomas Kleinke
 */
export class ContextMenu {

    public position: { x: number, y: number }|undefined;
    public documents: Array<FieldDocument> = [];


    public open(event: MouseEvent, documents: Array<FieldDocument>) {

        if (documents.find(document => !document.resource.id)) return this.close();

        this.position = { x: event.clientX, y: event.clientY };
        this.documents = documents;
    }


    public close() {

        this.position = undefined;
        this.documents = [];
    }


    public isOpen(): boolean {

        return this.position !== undefined;
    }
}
