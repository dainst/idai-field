import { CategoryForm, FieldResource } from 'idai-field-core';
import { M } from '../../../components/messages/m';
import { PerformExport } from '../export-helper';
import { getAsynchronousFs } from '../../../services/get-asynchronous-fs';
import { ExportResult } from '../export-runner';
import { CSVExport } from './csv-export';

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
    export function performExport(projectLanguages: string[], separator: string,
                                  combineHierarchicalRelations: boolean, outputFilePath?: string): PerformExport {

        return (category: CategoryForm, relations: string[]) => {

            return async (resources: Array<FieldResource>) => {

                const result: ExportResult = CSVExport.createExportable(
                    resources, CategoryForm.getFields(category), relations, projectLanguages,
                    separator, combineHierarchicalRelations, category.scanCodes !== undefined
                );

                if (outputFilePath) await writeFile(outputFilePath, result.exportData);

                return result;
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
