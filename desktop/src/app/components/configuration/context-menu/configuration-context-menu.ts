import { CategoryForm, Field, Group } from 'idai-field-core';
import { ContextMenu } from '../../widgets/context-menu';


/**
 * @author Thomas Kleinke
 */
 export class ConfigurationContextMenu extends ContextMenu {

    public category: CategoryForm;
    public group?: Group;
    public field?: Field;


    public open(event: MouseEvent, category: CategoryForm, group?: Group, field?: Field) {

        super.open(event, category, group, field);

        this.category = category;
        this.group = group;
        this.field = field;
    }
 }
