export type MenuContext = 'default'|'docedit'|'modal'|'projects'|'configuration'|'geometryEdit'|'mapLayersEdit'
    |'georeferenceEdit'|'configurationEdit'|'configurationValuelistEdit'|'configurationSubfieldEdit'
    |'configurationModal'|'configurationManagement'|'warnings'|'qrCodeEditor'|'qrCodeScanner';

    
/**
 * @author Thomas Kleinke
 */
export module MenuContext {

    export const DEFAULT = 'default';
    export const DOCEDIT = 'docedit';
    export const MODAL = 'modal';
    export const CONFIGURATION = 'configuration';
    export const GEOMETRY_EDIT = 'geometryEdit';
    export const MAP_LAYERS_EDIT = 'mapLayersEdit';
    export const GEOREFERENCE_EDIT = 'georeferenceEdit';
    export const CONFIGURATION_EDIT = 'configurationEdit';
    export const CONFIGURATION_VALUELIST_EDIT = 'configurationValuelistEdit';
    export const CONFIGURATION_SUBFIELD_EDIT = 'configurationSubfieldEdit';
    export const CONFIGURATION_MODAL = 'configurationModal';
    export const CONFIGURATION_MANAGEMENT = 'configurationManagement';
    export const WARNINGS = 'warnings';
    export const QR_CODE_EDITOR = 'qrCodeEditor';
    export const QR_CODE_SCANNER = 'qrCodeScanner';
}
