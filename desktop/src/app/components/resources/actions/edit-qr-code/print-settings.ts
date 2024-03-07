import { clone } from 'tsfun';
import { getAsynchronousFs } from '../../../../services/getAsynchronousFs';

const remote = typeof window !== 'undefined' ? window.require('@electron/remote') : undefined;

const FILE_PATH = remote.getGlobal('appDataPath') + '/print-settings.json';

const DEFAULT_PAGE_WIDTH = 76;          // mm
const DEFAULT_PAGE_HEIGHT = 25;         // mm
const DEFAULT_SCALE = 100;              // percent
const DEFAULT_CONTAINER_HEIGHT = 280;   // px


export interface PrintSettings {

    pageWidth: number;
    pageHeight: number;
    scale: number;
    marginLeft: number;
    marginTop: number;
}


/**
 * @author Thomas Kleinke
 */
export module PrintSettings {

    export async function load(): Promise<PrintSettings> {

        try {
            const content: string = await getAsynchronousFs().readFile(FILE_PATH, 'utf-8');
            return parseSerializationObject(JSON.parse(content));
        } catch (err) {
            return parseSerializationObject({});
        }
    }


    export async function store(settings: PrintSettings) {

        try {
            await getAsynchronousFs().writeFile(
                FILE_PATH, JSON.stringify(buildSerializationObject(settings))
            );
        } catch (err) {
            console.error('Error while trying to serialize print settings', err);
            throw err;
        }
    }


    export function getPrintStyle(settings: PrintSettings): string {

        const processedSettings: PrintSettings = process(settings);

        return '@page {'
                + 'size: '
                    + processedSettings.pageWidth + 'mm '
                    + processedSettings.pageHeight + 'mm; '
                + 'margin: 0;'
            + '}'
            + '@media print {'
                + '#qr-code-container {'
                    + 'top: calc(' + processedSettings.marginTop + 'mm + '
                        + getAutoMarginTop(processedSettings) + 'px);'
                    + 'left: ' + processedSettings.marginLeft + 'mm;'
                    + 'transform: scale(' + processedSettings.scale + ') '
                + '}'
        + '}';
    }


    function process(settings: PrintSettings): PrintSettings {

        const clonedSettings: PrintSettings = clone(settings);

        if (clonedSettings.pageHeight > clonedSettings.pageWidth) swapPageWidthAndHeight(clonedSettings);
        clonedSettings.scale = getAutoScale(clonedSettings) * (clonedSettings.scale / 200.0);
        
        return clonedSettings;
    }
    
        
    function swapPageWidthAndHeight(settings: PrintSettings) {

        const pageWidth: number = settings.pageWidth;
        settings.pageWidth = settings.pageHeight;
        settings.pageHeight = pageWidth;
    }
    
    
    function getAutoScale(settings: PrintSettings): number {

        return Math.min(
            settings.pageWidth / DEFAULT_PAGE_WIDTH,
            settings.pageHeight / DEFAULT_PAGE_HEIGHT
        );
    }
    
    
    function getAutoMarginTop(settings: PrintSettings): number {

        const heightScale: number = settings.pageHeight / DEFAULT_PAGE_HEIGHT / 2;

        if (heightScale > settings.scale) {
            return DEFAULT_CONTAINER_HEIGHT * (heightScale - settings.scale) / 2;
        } else {
            return 0;
        }
    }


    function buildSerializationObject(settings: PrintSettings): any {

        return {
            scanCodes: {
                pageWidth: settings.pageWidth,
                pageHeight: settings.pageHeight,
                scale: settings.scale,
                marginLeft: settings.marginLeft,
                marginTop: settings.marginTop
            }
        };
    }


    function parseSerializationObject(object: any): PrintSettings {

        return {
            pageWidth: object.scanCodes?.pageWidth ?? DEFAULT_PAGE_WIDTH,
            pageHeight: object.scanCodes?.pageHeight ?? DEFAULT_PAGE_HEIGHT,
            scale: object.scanCodes?.scale ?? DEFAULT_SCALE,
            marginLeft: object.scanCodes?.marginLeft ?? 0,
            marginTop: object.scanCodes?.marginTop ?? 0
        }
    }
}
