import { Datastore, Document, FieldGeometryType } from 'idai-field-core';
import { M } from '../messages/m';
import { GeoJsonExporter } from './geojson-exporter';

const remote = window.require('@electron/remote');
const ipcRenderer = window.require('electron')?.ipcRenderer;
const fs = window.require('fs');


type ShapefileType = {
    geometryTypes: Array<FieldGeometryType>,
    gdalType: string,
    fileName: string
};

const SHAPEFILE_TYPES: Array<ShapefileType> = [
    { geometryTypes: ['Point', 'MultiPoint'], gdalType: 'MULTIPOINT', fileName: 'multipoints' },
    { geometryTypes: ['LineString', 'MultiLineString'], gdalType: 'MULTILINESTRING', fileName: 'multipolylines' },
    { geometryTypes: ['Polygon', 'MultiPolygon'], gdalType: 'MULTIPOLYGON', fileName: 'multipolygons' }
];

const TEMP_DIRECTORY_PATH: string = remote.getGlobal('appDataPath') + '/gdal/';



/**
 * @author Thomas Kleinke
 */
export module ShapefileExporter {

    export async function performExport(datastore: Datastore, projectDocument: Document, outputFilePath: string,
                                        operationId: string) {

        const timestamp: string = '_' + Date.now();
        const shapefileDirectoryPath: string = TEMP_DIRECTORY_PATH + '/' + timestamp + '/';
        const epsgCode: string|undefined = getEPSGCode(projectDocument);

        try {
            for (let type of SHAPEFILE_TYPES) {
                await buildShapefile(type, timestamp, operationId, datastore, epsgCode);
            }

            fs.mkdirSync(shapefileDirectoryPath);
            moveFilesToShapefileDirectory(shapefileDirectoryPath, timestamp, epsgCode !== undefined);
        } catch (err) {
            console.error(err);
            throw [M.EXPORT_SHAPEFILE_ERROR_WRITE];
        }

        try {
           await ipcRenderer.invoke('createZip', outputFilePath, shapefileDirectoryPath);
        } catch (err) {
            console.error(err);
            throw [M.EXPORT_SHAPEFILE_ERROR_ZIP_FILE_CREATION];
        } finally {
            fs.rmSync(shapefileDirectoryPath, { recursive: true });
        }
    }


    async function buildShapefile(type: ShapefileType, timestamp: string, operationId: string, datastore: Datastore,
                                  epsgCode: string) {

        const geoJsonFilePath: string = TEMP_DIRECTORY_PATH + type.fileName + '.geojson';
        await GeoJsonExporter.performExport(datastore, geoJsonFilePath, operationId, true, type.geometryTypes);

        await ipcRenderer.invoke(
            'ogr2ogr',
            geoJsonFilePath,
            getGdalOptions(type, epsgCode),
            type.fileName + timestamp
        );

        fs.rmSync(geoJsonFilePath);
    }


    function getGdalOptions(type: ShapefileType, epsgCode?: string): string[] {

        const options: string[] = [
            '-f', 'ESRI Shapefile',
            '-nlt', type.gdalType,
            '-lco', 'ENCODING=UTF-8'
        ];

        if (epsgCode) {
            options.push('-a_srs');
            options.push('EPSG:' + epsgCode);
        }

        return options;
    }


    function moveFilesToShapefileDirectory(shapefileDirectoryPath: string, timestamp: string,
                                           keepProjectionFiles: boolean) {

        const fileNames: string[] = fs.readdirSync(TEMP_DIRECTORY_PATH)
            .filter(fileName => fileName.includes(timestamp + '.'));
        
        fileNames.filter(fileName => keepProjectionFiles || !fileName.endsWith('.prj'))
            .forEach(fileName => {
                fs.copyFileSync(
                    TEMP_DIRECTORY_PATH + fileName,
                    shapefileDirectoryPath + fileName.replace(timestamp, '')
                );
            });

        fileNames.forEach(fileName => fs.rmSync(TEMP_DIRECTORY_PATH + fileName));
    }


    function getEPSGCode(projectDocument: Document): string|undefined {

        const availableEPSGCodes = ['4326', '3857'];

        return availableEPSGCodes.find(epsg => {
            return projectDocument.resource.coordinateReferenceSystem
                && projectDocument.resource.coordinateReferenceSystem.includes(epsg);
        });
    }
}
