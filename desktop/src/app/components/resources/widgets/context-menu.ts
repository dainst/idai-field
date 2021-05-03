import {Document} from 'idai-field-core';


export type ContextMenuOrientation = 'top'|'bottom';


/**
 * @author Thomas Kleinke
 */
export class ContextMenu {

    public position: { x: number, y: number }|undefined;
    public documents: Array<Document> = [];


    public open(event: MouseEvent, documents: Array<Document>) {

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


    public static computeOrientation(yPosition?: number): ContextMenuOrientation {

        return !yPosition || yPosition <= window.innerHeight * 0.6
            ? 'top'
            : 'bottom';
    }
}
