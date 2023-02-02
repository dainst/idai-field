import { ImporterOptions, ImporterFormat } from '../../components/import/importer';
import { CategoryForm } from 'idai-field-core';


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
    public ignoreUnconfiguredFields = false;

    // For CSV import

    public categories: Array<CategoryForm> = [];
    public selectedCategory: CategoryForm|undefined = undefined;
    public typeFromFileName: boolean = false;

    public separator: string|undefined = ',';

    public setSeparator(separator: string) {

        if (separator.length === 1) this.separator = separator;
    }
}
