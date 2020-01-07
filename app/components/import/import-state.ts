import {ImportFormat} from '../../core/import/importer';
import {IdaiType} from '../../core/configuration/model/idai-type';

/**
 * @author Thomas Kleinke
 * @author Daniel de Oliveira
 */
export class ImportState {

    // For CSV import

    private separator: string = ',';

    public resourceTypes: Array<IdaiType> = [];

    public selectedType: IdaiType|undefined = undefined;

    public typeFromFileName: boolean = false;
    //

    public sourceType: string = 'file';

    public format: ImportFormat = 'native';

    public file: File|undefined;

    public selectedOperationId: string = '';

    public mergeMode = false;

    public permitDeletions = false;



    public getSeparator(): string {

        return this.separator;
    }


    public setSeparator(separator: string) {

        if (separator.length === 1) this.separator = separator;
    }
}