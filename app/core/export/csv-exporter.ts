import {FieldDocument} from 'idai-components-2/src/model/field-document';
import {IdaiType} from 'idai-components-2/src/configuration/idai-type';
import {CSVExport} from './csv-export';
import * as fs from "fs";
import {M} from '../../components/m';

/**
 * @author Daniel de Oliveira
 */
export module CSVExporter {

    export function performExport(documents: FieldDocument[],
                                  resourceType: IdaiType,
                                  outputFilePath: string) {

        const result = CSVExport.createExportable(documents, resourceType); // TODO return string instead of string[]
        // console.log("result", result);
        writeFile(outputFilePath, result);
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