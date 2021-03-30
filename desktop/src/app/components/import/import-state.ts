import {ImporterOptions, ImporterFormat} from '../../core/import/importer';
import {Category} from 'idai-field-core';


/**
 * @author Thomas Kleinke
 * @author Daniel de Oliveira
 */
export class ImportState implements ImporterOptions {

    public sourceType: string = 'file';
    public format: ImporterFormat|undefined;
    public file: any|undefined;
    public url: string|undefined;
    public selectedOperationId: string = '';
    public mergeMode = false;
    public permitDeletions = false;

    // For CSV import

    public categories: Array<Category> = [];
    public selectedCategory: Category|undefined = undefined;
    public typeFromFileName: boolean = false;

    public separator: string|undefined = ',';

    public setSeparator(separator: string) {

        if (separator.length === 1) this.separator = separator;
    }
}
