import { Document } from 'idai-field-core';
import { ContextMenu } from '../../../widgets/context-menu';


/**
 * @author Thomas Kleinke
 */
 export class WarningsContextMenu extends ContextMenu {

    public document: Document;


    public open(event: MouseEvent, document: Document) {

        super.open(event);

        this.document = document;
    }
 }
