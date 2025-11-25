export type MenuContext = 'default'|'docedit'|'modal'|'blockingModal'|'projects'|'configuration'|'geometryEdit'
    |'mapLayersEdit'|'georeferenceEdit'|'imagePickerModal'|'configurationEdit'|'configurationValuelistEdit'
    |'configurationSubfieldEdit'|'configurationModal'|'configurationManagement'|'warnings'|'qrCodeEditor'
    |'qrCodeScanner'|'printSettingsModal'|'workflowEditor'|'imageToolModal';

    
/**
 * @author Thomas Kleinke
 */
export module MenuContext {

    export const DEFAULT = 'default';
    export const DOCEDIT = 'docedit';
    export const MODAL = 'modal';
    export const BLOCKING_MODAL = 'blockingModal';
    export const CONFIGURATION = 'configuration';
    export const GEOMETRY_EDIT = 'geometryEdit';
    export const MAP_LAYERS_EDIT = 'mapLayersEdit';
    export const GEOREFERENCE_EDIT = 'georeferenceEdit';
    export const IMAGE_PICKER_MODAL = 'imagePickerModal';
    export const CONFIGURATION_EDIT = 'configurationEdit';
    export const CONFIGURATION_VALUELIST_EDIT = 'configurationValuelistEdit';
    export const CONFIGURATION_SUBFIELD_EDIT = 'configurationSubfieldEdit';
    export const CONFIGURATION_MODAL = 'configurationModal';
    export const CONFIGURATION_MANAGEMENT = 'configurationManagement';
    export const WARNINGS = 'warnings';
    export const QR_CODE_EDITOR = 'qrCodeEditor';
    export const QR_CODE_SCANNER = 'qrCodeScanner';
    export const PRINT_SETTINGS_MODAL = 'printSettingsModal';
    export const WORKFLOW_EDITOR = 'workflowEditor';
    export const IMAGE_TOOL_MODAL = 'imageToolModal';
}
