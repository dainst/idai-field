import { Document } from 'idai-field-core';
import { ContextMenu } from '../../widgets/context-menu';

/**
 * @author Thomas Kleinke
 */
 export class ResourcesContextMenu extends ContextMenu {

    public documents: Array<Document> = [];


    public open(event: MouseEvent, documents: Array<Document>) {

        if (documents.find(document => !document.resource.id)) return this.close();

        super.open(event);
        this.documents = documents;
    }
 }
