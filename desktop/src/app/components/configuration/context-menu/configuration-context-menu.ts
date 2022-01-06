import { CategoryForm, Field, Group, Valuelist } from 'idai-field-core';
import { ContextMenu } from '../../widgets/context-menu';


/**
 * @author Thomas Kleinke
 */
 export class ConfigurationContextMenu extends ContextMenu {

    public category?: CategoryForm;
    public group?: Group;
    public field?: Field;
    public valuelist?: Valuelist;


    public open(event: MouseEvent, category?: CategoryForm, group?: Group, field?: Field, valuelist?: Valuelist) {

        super.open(event);

        this.category = category;
        this.group = group;
        this.field = field;
        this.valuelist = valuelist;
    }
 }
