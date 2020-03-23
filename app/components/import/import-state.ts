import {ImportFormat} from '../../core/import/importer';
import {Category} from '../../core/configuration/model/category';

/**
 * @author Thomas Kleinke
 * @author Daniel de Oliveira
 */
export class ImportState {

    public sourceType: string = 'file';
    public format: ImportFormat = 'native';
    public file: File|undefined;
    public selectedOperationId: string = '';
    public mergeMode = false;
    public permitDeletions = false;

    // For CSV import

    public categories: Array<Category> = [];
    public selectedCategory: Category|undefined = undefined;
    public typeFromFileName: boolean = false;

    private separator: string = ',';
    //


    public getSeparator(): string {

        return this.separator;
    }


    public setSeparator(separator: string) {

        if (separator.length === 1) this.separator = separator;
    }
}