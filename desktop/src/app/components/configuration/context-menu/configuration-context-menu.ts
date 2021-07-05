import { Category, FieldDefinition, Group } from 'idai-field-core';
import { ContextMenu } from '../../widgets/context-menu';


/**
 * @author Thomas Kleinke
 */
 export class ConfigurationContextMenu extends ContextMenu {

    public category: Category;
    public group?: Group;
    public field?: FieldDefinition;


    public open(event: MouseEvent, category: Category, group?: Group, field?: FieldDefinition) {
        
        super.open(event, category, group, field);
        
        this.category = category;
        this.group = group;
        this.field = field;
    }
 }
