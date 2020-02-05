import {FieldDocument} from 'idai-components-2';

/**
 * @author Thomas Kleinke
 */
export class ContextMenu {

    public position: { x: number, y: number }|undefined;
    public document: FieldDocument|undefined;


    public open(event: MouseEvent, document: FieldDocument) {

        if (!document.resource.id) return this.close();

        this.position = { x: event.clientX, y: event.clientY };
        this.document = document;
    }


    public close() {

        this.position = undefined;
        this.document = undefined;
    }


    public isOpen(): boolean {

        return this.position !== undefined;
    }
}