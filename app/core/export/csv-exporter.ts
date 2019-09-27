import * as fs from 'fs';
import {FieldResource} from 'idai-components-2';
import {CSVExport} from './csv-export';
import {M} from '../../components/m';
import {PerformExport} from './export-helper';
import {IdaiType} from '../configuration/model/idai-type';

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
                CSVExport.createExportable(resources, resourceType.fields, relations));
        }
    }


    function writeFile(outputFilePath: string,
                       lines: string[]): Promise<void> {

        return new Promise((resolve, reject) => {
            fs.writeFile(outputFilePath, lines.join('\n'),
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