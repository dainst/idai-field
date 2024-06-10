import { CategoryForm, FieldResource } from 'idai-field-core';
import { CSVExport, CSVExportResult } from './csv-export';
import { M } from '../../../components/messages/m';
import { PerformExport } from '../export-helper';
import { getAsynchronousFs } from '../../../services/getAsynchronousFs';

/**
 * Small wrapper to separate async and file handling, including
 * the choice of line endings, from the main logic
 *
 * @author Daniel de Oliveira
 */
export module CsvExporter {

    /**
     * @param outputFilePath
     */
    export function performExport(outputFilePath: string, projectLanguages: string[], separator: string,
                                  combineHierarchicalRelations: boolean): PerformExport {

        return (category: CategoryForm, relations: string[]) => {

            return async (resources: Array<FieldResource>) => {

                const result: CSVExportResult = CSVExport.createExportable(
                    resources, CategoryForm.getFields(category), relations, projectLanguages,
                    separator, combineHierarchicalRelations, category.scanCodes !== undefined
                );
                await writeFile(outputFilePath, result.csvData);

                return result.invalidFields;
            }
        }
    }


    async function writeFile(outputFilePath: string, lines: string[]): Promise<void> {
        
        try {
            return await getAsynchronousFs().writeFile(outputFilePath, lines.join('\n'));
        } catch (err) {
            console.error('Error while trying to write file: ' + outputFilePath, err);
            throw [M.EXPORT_ERROR_GENERIC];
        }
    }
}
