import { clone } from 'tsfun';
import { validateFloat } from 'idai-field-core';


const DEFAULT_PAGE_WIDTH = 76;          // mm
const DEFAULT_PAGE_HEIGHT = 25;         // mm
const DEFAULT_SCALE = 100;              // percent
const DEFAULT_CONTAINER_HEIGHT = 280;   // px


export interface PrintSettingsProfile {
    name: string;
    pageWidth: number;
    pageHeight: number;
    scale: number;
    marginLeft: number;
    marginTop: number;
    fontWeight: '500'|'600'|'700';
}


/**
 * @author Thomas Kleinke
 */
export module PrintSettingsProfile {

    export function getPrintStyle(profile: PrintSettingsProfile): string {

        const processedProfile: PrintSettingsProfile = process(profile);

        return '@page {'
                + 'size: '
                    + processedProfile.pageWidth + 'mm '
                    + processedProfile.pageHeight + 'mm; '
                + 'margin: 0;'
            + '}'
            + '@media print {'
                + '#qr-code-container {'
                    + 'top: calc(' + processedProfile.marginTop + 'mm + '
                        + getAutoMarginTop(processedProfile) + 'px);'
                    + 'left: ' + processedProfile.marginLeft + 'mm;'
                    + 'transform: scale(' + processedProfile.scale + ');'
                + '}'
                + '#qr-code-string, #qr-code-identifier, .print-label-field {'
                    + 'font-weight: ' + processedProfile.fontWeight + ';'
                +'}'
                + '#qr-code-container b {'
                    + 'font-weight: ' + (parseInt(processedProfile.fontWeight) + 100) + ';'
                + '}'
        + '}';
    }


    export function createDefaultProfile(): PrintSettingsProfile {

        return {
            name: '',
            pageWidth: DEFAULT_PAGE_WIDTH,
            pageHeight: DEFAULT_PAGE_HEIGHT,
            scale: DEFAULT_SCALE,
            marginLeft: 0,
            marginTop: 0,
            fontWeight: '600'
        };
    }


    export function validate(profile: PrintSettingsProfile): boolean {

        return validateValue(profile.pageWidth)
            && validateValue(profile.pageHeight)
            && validateValue(profile.scale)
            && validateValue(profile.marginLeft)
            && validateValue(profile.marginTop)
            && profile.pageWidth > 0
            && profile.pageHeight > 0
            && profile.scale > 0
            && ['500', '600', '700'].includes(profile.fontWeight);
    }


    function validateValue(value: number): boolean {

        return value !== undefined
            && value !== null
            && validateFloat(value.toString());
    }


    function process(profile: PrintSettingsProfile): PrintSettingsProfile {

        const clonedProfile: PrintSettingsProfile = clone(profile);

        if (clonedProfile.pageHeight > clonedProfile.pageWidth) swapWidthAndHeight(clonedProfile);
        clonedProfile.scale = getAutoScale(clonedProfile) * (clonedProfile.scale / 200.0);
        
        return clonedProfile;
    }
    
        
    function swapWidthAndHeight(profile: PrintSettingsProfile) {

        const pageWidth: number = profile.pageWidth;
        const marginLeft: number = profile.marginLeft;

        profile.pageWidth = profile.pageHeight;
        profile.pageHeight = pageWidth;
        profile.marginLeft = -profile.marginTop;
        profile.marginTop = marginLeft;
    }
    
    
    function getAutoScale(profile: PrintSettingsProfile): number {

        return Math.min(
            profile.pageWidth / DEFAULT_PAGE_WIDTH,
            profile.pageHeight / DEFAULT_PAGE_HEIGHT
        );
    }
    
    
    function getAutoMarginTop(profile: PrintSettingsProfile): number {

        const heightScale: number = profile.pageHeight / DEFAULT_PAGE_HEIGHT / 2;

        if (heightScale > profile.scale) {
            return DEFAULT_CONTAINER_HEIGHT * (heightScale - profile.scale) / 2;
        } else {
            return 0;
        }
    }
}
