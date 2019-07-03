import {FieldResource, IdaiType} from 'idai-components-2';
import {CSVExport} from './csv-export';
import * as fs from 'fs';
import {M} from '../../components/m';
import {PerformExport} from './export-helper';

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
    export function performExport(outputFilePath: string): PerformExport {

        return async (resources: Array<FieldResource>,
                      resourceType: IdaiType,
                      relations: string[]) => {

            await writeFile(
                outputFilePath,
                CSVExport.createExportable(resources, resourceType, relations)); // TODO maybe call it separately
        }
    }


    function writeFile(outputFilePath: string,
                       lines: string[]): Promise<void> {

        return new Promise((resolve, reject) => {
            fs.writeFile(outputFilePath, lines.join('\n'), // TODO review use of separators
                (err: any) => {
                if (err) {
                    console.error(err);
                    reject([M.EXPORT_ERROR_GENERIC]);
                } else {
                    resolve();
                }
            });
        });
    }
}