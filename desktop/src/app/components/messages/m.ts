import { Injectable } from '@angular/core';
import { I18n } from '@ngx-translate/i18n-polyfill';
import { MD } from './md';
import { Message } from './message';


/**
 * @author Daniel de Oliveira
 * @author Jan G. Wieners
 * @author Thomas Kleinke
 */
@Injectable()
export class M extends MD { // = Messages Dictionary. For reasons of brevity of calls to it just 'M'.

    // Internal messages from components
    // The original messages in the internal dictionary are overwritten with the translated ones
    public static MESSAGES_ERROR_UNKNOWN_MESSAGE: string = 'messages.error.unknownMessage';
    public static PROJECT_CONFIGURATION_ERROR_GENERIC: string = 'projectConfiguration.error.generic';
    public static CONFIG_READER_ERROR_INVALID_JSON: string = 'configReader.error.invalidJson';

    // All packages
    public static ALL_ERROR_FIND = 'all.error.find';

    // App Package
    public static APP_ERROR_GENERIC_SAVE_ERROR = 'app.error.genericSaveError';
    public static APP_CONTROLLER_SUCCESS = 'app.appControllerSuccess';

    // Settings Package
    public static SETTINGS_SUCCESS = 'settings.success';
    public static SETTINGS_ERROR_MALFORMED_ADDRESS = 'settings.error.malformedAddress';

    // Projects Package
    public static PROJECTS_DELETE_SUCCESS = 'projects.deleteSuccess';

    // Model Package
    public static MODEL_VALIDATION_IDENTIFIER_ALREADY_EXISTS = 'model.validation.error.identifierExists';
    public static MODEL_VALIDATION_INVALID_IDENTIFIER_PREFIX = 'model.validation.error.invalidIdentifierPrefix';
    public static MODEL_VALIDATION_MISSING_COORDINATES = 'model.validation.error.missingCoordinates';
    public static MODEL_VALIDATION_INVALID_COORDINATES = 'model.validation.error.invalidCoordinates';
    public static MODEL_VALIDATION_MISSING_GEOMETRYTYPE = 'model.validation.error.missingGeometryType';
    public static MODEL_VALIDATION_UNSUPPORTED_GEOMETRY_TYPE = 'model.validation.error.unsupportedGeometryType';

    // Backup Package
    public static BACKUP_WRITE_SUCCESS = 'backup.write.success';
    public static BACKUP_READ_SUCCESS = 'backup.read.success';
    public static BACKUP_WRITE_ERROR_GENERIC = 'backup.write.error.generic';
    public static BACKUP_READ_ERROR_GENERIC = 'backup.read.error.generic';
    public static BACKUP_READ_ERROR_FILE_NOT_FOUND = 'backup.read.error.fileNotFound';
    public static BACKUP_READ_ERROR_NO_PROJECT_IDENTIFIER = 'backup.read.error.noProjectIdentifier';
    public static BACKUP_READ_ERROR_SAME_PROJECT_IDENTIFIER = 'backup.read.error.sameProjectIdentifier';
    public static BACKUP_READ_WARNING_UNSIMILAR_PROJECT_IDENTIFIER = 'backup.read.warning.unsimilarProjectIdentifier';

    // Download Project Package
    public static INITIAL_SYNC_DB_NOT_EMPTY = 'M.InitialSync.dbNotEmpty';
    public static INITIAL_SYNC_GENERIC_ERROR = 'M.InitialSync.genericError';
    public static INITIAL_SYNC_COULD_NOT_START_GENERIC_ERROR = 'M.InitialSync.couldNotStartGenericError';
    public static INITIAL_SYNC_INVALID_CREDENTIALS = 'M.InitialSync.invalidCredentials'

    // ImportPackage - ParserErrors
    public static IMPORT_PARSER_INVALID_JSON = 'M.Import.ParserErrors.invalidJson';
    public static IMPORT_PARSER_INVALID_JSONL = 'M.Import.ParserErrors.invalidJsonl';
    public static IMPORT_PARSER_INVALID_GEOJSON_IMPORT_STRUCT = 'M.Import.ParserErrors.invalidGeojsonImportStruct';
    public static IMPORT_PARSER_INVALID_GEOMETRY = 'M.Import.ParserErrors.invalidGeometry';
    public static IMPORT_PARSER_MISSING_IDENTIFIER = 'M.Import.ParserErrors.missingIdentifier';
    public static IMPORT_PARSER_MISSING_IDENTIFIER_SHAPEFILE = 'M.Import.ParserErrors.missingIdentifierShapefile';
    public static IMPORT_PARSER_ID_MUST_NOT_BE_SET = 'M.Import.ParserErrors.parsing.idnottobeset';
    public static IMPORT_PARSER_SHAPEFILE_GENERIC = 'M.Import.ParserErrors.shapefile.generic';
    public static IMPORT_PARSER_CATALOG_GENERIC = 'M.Import.ParserErrors.catalog.generic';
    public static IMPORT_PARSER_IDENTIFIER_FORMAT = 'M.Import.ParserErrors.identifierFormat';
    public static IMPORT_PARSER_MANDATORY_CSV_FIELD_MISSING = 'M.Import.ParserErrors.mandatoryCsvFieldMissing';
    public static IMPORT_PARSER_INVALID_CSV = 'M.Import.ParserErrors.invalidCsv';
    public static IMPORT_PARSER_CSV_INVALID_HEADING = 'M.Import.ParserErrors.invalidCsvHeading';
    public static IMPORT_PARSER_CSV_HEADING_ARRAY_INDICES_INVALID_SEQUENCE = 'M.Import.ParserErrors.csvHeadingArrayIndicesInvalidSequence';
    public static IMPORT_PARSER_CSV_HEADING_EMPTY_ENTRY = 'M.Import.ParserErrors.csvHeadingEmptyEntry';
    public static IMPORT_PARSER_CSV_HEADING_PATH_ITEM_TYPE_MISMATCH = 'M.Import.ParserErrors.csvHeadingPathItemTypeMismatch';
    public static IMPORT_PARSER_CSV_ROWS_LENGTH_MISMATCH = 'M.Import.ParserErrors.csvRowsLengthMismatch';
    public static IMPORT_PARSER_GENERIC_CSV_ERROR = 'M.Import.ParserErrors.genericCsvError';
    public static IMPORT_PARSER_NOT_A_NUMBER = 'M.Import.ParserErrors.notANumber';
    public static IMPORT_PARSER_NOT_A_BOOLEAN = 'M.Import.ParserErrors.notABoolean';

    // ImportPackage - ReaderErrors
    public static IMPORT_READER_GENERIC_START_ERROR = 'M.Import.ReaderErrors.genericStartError';
    public static IMPORT_READER_FILE_UNREADABLE = 'M.Import.ReaderErrors.fileUnreadable';
    public static IMPORT_READER_GENERIC_DATASTORE = 'M.Import.ReaderErrors..genericDatastoreError';
    public static IMPORT_READER_ROLLBACK = 'M.Import.ReaderErrors.rollbackError';
    public static IMPORT_READER_INVALID_OPERATION_RESOURCE = 'M.Import.ReaderErrors.invalidOperationResource';
    public static IMPORT_READER_SHAPEFILE_READ_ERROR = 'M.Import.ReaderErrors.shapefile.readError';
    public static IMPORT_READER_SHAPEFILE_UNSUPPORTED_GEOMETRY_TYPE = 'M.Import.ReaderErrors.shapefile.unsupportedGeometryType';
    public static IMPORT_READER_SHAPEFILE_JSONL_WRITE = 'M.Import.ReaderErrors.shapefile.jsonlWriteError';

    // ImportPackage ValidationErrors
    public static IMPORT_VALIDATION_MISSING_PROPERTY = 'M.Import.ValidationErrors.missingProperty';
    public static IMPORT_VALIDATION_ERROR_NO_RECORDEDIN = 'M.Import.ValidationErrors.noRecordedin';
    public static IMPORT_VALIDATION_ERROR_NO_RECORDEDIN_TARGET = 'M.Import.ValidationErrors.noRecordedinTarget';
    public static IMPORT_VALIDATION_ERROR_INVALID_FIELD = 'M.Import.ValidationErrors.invalidField';
    public static IMPORT_VALIDATION_ERROR_INVALID_FIELDS = 'M.Import.ValidationErrors.invalidFields';
    public static IMPORT_VALIDATION_ERROR_INVALID_RELATION_FIELD = 'M.Import.ValidationErrors.invalidRelationField';
    public static IMPORT_VALIDATION_ERROR_INVALID_RELATION_FIELDS = 'M.Import.ValidationErrors.invalidRelationFields';
    public static IMPORT_VALIDATION_ERROR_INVALID_NUMERIC_VALUE = 'M.Import.ValidationErrors.invalidNumericValue';
    public static IMPORT_VALIDATION_ERROR_INVALID_NUMERIC_VALUES = 'M.Import.ValidationErrors.invalidNumericValues';
    public static IMPORT_VALIDATION_ERROR_INVALID_URL = 'M.Import.ValidationErrors.invalidUrl';
    public static IMPORT_VALIDATION_ERROR_INVALID_URLS = 'M.Import.ValidationErrors.invalidUrls';
    public static IMPORT_VALIDATION_ERROR_INVALID_DATE = 'M.Import.ValidationErrors.invalidDate';
    public static IMPORT_VALIDATION_ERROR_INVALID_DATES = 'M.Import.ValidationErrors.invalidDates';
    public static IMPORT_VALIDATION_ERROR_INVALID_DATING_VALUE = 'M.Import.ValidationErrors.invalidDatingValue';
    public static IMPORT_VALIDATION_ERROR_INVALID_DATING_VALUES = 'M.Import.ValidationErrors.invalidDatingValues';
    public static IMPORT_VALIDATION_ERROR_INVALID_DIMENSION_VALUE = 'M.Import.ValidationErrors.invalidDimensionValue';
    public static IMPORT_VALIDATION_ERROR_INVALID_DIMENSION_VALUES = 'M.Import.ValidationErrors.invalidDimensionValues';
    public static IMPORT_VALIDATION_ERROR_INVALID_LITERATURE_VALUE = 'M.Import.ValidationErrors.invalidLiteratureValue';
    public static IMPORT_VALIDATION_ERROR_INVALID_LITERATURE_VALUES = 'M.Import.ValidationErrors.invalidLiteratureValues';
    public static IMPORT_VALIDATION_ERROR_INVALID_DROPDOWN_RANGE_VALUES = 'M.Import.ValidationErrors.invalidDropdownRangeValues';
    public static IMPORT_VALIDATION_ERROR_INVALID_MAP_LAYER_RELATION_TARGETS = 'M.Import.ValidationErrors.invalidMapLayerRelationTargets';
    public static IMPORT_VALIDATION_ERROR_MAX_CHARACTERS_EXCEEDED = 'M.Import.ValidationErrors.maxCharactersExceeded';
    public static IMPORT_VALIDATION_ERROR_END_DATE_BEFORE_BEGINNING_DATE = 'M.Import.ValidationErrors.endDateBeforeBeginningDate';

    // Import Package - ImportErrors
    public static IMPORT_NO_OPERATION_ASSIGNABLE = 'M.Import.ImportErrors.noOperationAssignable';
    public static IMPORT_NO_FEATURE_ASSIGNABLE = 'M.Import.ImportErrors.noFeatureAssignable';
    public static IMPORT_EXEC_NO_LIES_WITHIN_SET = 'M.Import.ImportErrors.onlyPlaceAndOperationWithoutRecordedInAllowed';
    public static IMPORT_PREVALIDATION_OPERATIONS_NOT_ALLOWED = 'M.Import.ImportErrors.operationsNotAllowed';
    public static IMPORT_VALIDATION_INVALID_CATEGORY = 'M.Import.ImportErrors.invalidCategory';
    public static IMPORT_ERROR_MUST_LIE_WITHIN_OTHER_NON_OPERATON_RESOURCE = 'M.Import.ImportErrors.mustLieWithinOtherNonOperationResource';
    public static IMPORT_ERROR_TARGET_CATEGORY_RANGE_MISMATCH = 'M.Import.ImportErrors.targetCategoryRangeMismatch';
    public static IMPORT_PREVALIDATION_DUPLICATE_IDENTIFIER = 'M.Import.ImportErrors.duplicateIdentifier';
    public static IMPORT_PREVALIDATION_MISSING_RELATION_TARGET = 'M.Import.ImportErrors.missingRelationTarget';
    public static IMPORT_ERROR_CATEGORY_NOT_ALLOWED = 'M.Import.ImportErrors.categoryNotAllowed';
    public static IMPORT_ERROR_CATEGORY_ONLY_ALLOWED_ON_UPDATE = 'M.Import.ImportErrors.categoryOnlyAllowedOnUpdate';
    public static IMPORT_ERROR_NOT_UPDATED = 'M.Import.ImportErrors.notUpdated';
    public static IMPORT_WARNING_EMPTY = 'M.Import.warning.empty';
    public static IMPORT_WARNING_IGNORED_EXISTING_IDENTIFIER = 'M.Import.warning.ignoredExistingIdentifier';
    public static IMPORT_WARNING_IGNORED_EXISTING_IDENTIFIERS = 'M.Import.warning.ignoredExistingIdentifiers';
    public static IMPORT_WARNING_IGNORED_MISSING_IDENTIFIER = 'M.Import.warning.ignoredMissingIdentifier';
    public static IMPORT_WARNING_IGNORED_MISSING_IDENTIFIERS = 'M.Import.warning.ignoredMissingIdentifiers';
    public static IMPORT_SUCCESS_SINGLE = 'M.Import.success.single';
    public static IMPORT_SUCCESS_MULTIPLE = 'M.Import.success.multiple';
    public static IMPORT_EXEC_MISSING_RELATION_TARGET = 'M.Import.ImportErrors.missingRelationTarget';
    public static IMPORT_EXEC_NOT_INTERRELATED = 'M.Import.ImportErrors.notInterrelated';
    public static IMPORT_EXEC_EMPTY_RELATION = 'M.Import.ImportErrors.emptyRelation';
    public static IMPORT_LIES_WITHIN_TARGET_NOT_MATCHES_ON_IS_RECORDED_IN = 'M.Import.ImportErrors.liesWithinRecordedInMismatch';
    public static IMPORT_PARENT_ASSIGNMENT_TO_OPERATIONS_NOT_ALLOWED = 'M.Import.ImportErrors.parentAssignmentToOperationNotAllowed';
    public static IMPORT_PARENT_MUST_NOT_BE_ARRAY = 'M.Import.ImportErrors.parentMustNotBeArray';
    public static IMPORT_MUST_BE_ARRAY = 'M.Import.ImportErrors.relationMustBeArray';
    public static IMPORT_MUST_BE_IN_SAME_OPERATION = 'M.Import.ImportErrors.mustBeInSameOperation';
    public static IMPORT_ERROR_MUST_NOT_BE_EMPTY_STRING = 'M.Import.ImportErrors.mustNotBeEmptyString';
    public static IMPORT_ERROR_CATEGORY_CANNOT_BE_CHANGED = 'M.Import.ImportErrors.categoryCannotBeChanged';
    public static IMPORT_ERROR_EMPTY_SLOTS_IN_ARRAYS_FORBIDDEN = 'M.Import.ImportErrors.emptySlotsInArraysForbidden';
    public static IMPORT_ERROR_ARRAY_OF_HETEROGENEOUS_TYPES = 'M.Import.ImportErrors.arrayOfHeterogeneousType';
    public static IMPORT_ERROR_INVALID_FILE_FORMAT = 'M.Import.ImportErrors.invalidFileFormat';
    public static IMPORT_ERROR_EMPTY_OBJECT_IN_RESOURCE = 'M.Import.ImportErros.emptyObjectInResource';

    // Import Package - ImportCatalogErrors
    public static IMPORT_CATALOG_ERROR_IDENTIFIER_CLASH = 'M.Import.ImportCatalogErrors.identifierClash';
    public static IMPORT_CATALOG_ERROR_CONNECTED_TYPE_DELETED = 'M.Import.ImportCatalogErrors.connectedTypeDeleted';
    public static IMPORT_CATALOG_ERROR_DIFFERENT_PROJECT_ENTRIES = 'M.Import.ImportCatalogErrors.differentProjectEntries';
    public static IMPORT_CATALOG_ERROR_NO_OR_TOO_MANY_TYPE_CATALOG_DOCUMENTS = 'M.Import.ImportCatalogErrors.noOrTooManyTypeCatalogDocuments';
    public static IMPORT_CATALOG_ERROR_INVALID_RELATIONS = 'M.Import.ImportCatalogErrors.invalidRelations';
    public static IMPORT_CATALOG_ERROR_OWNER_MUST_NOT_REIMPORT_CATALOG = 'M.Import.ImportCatalogErrors.ownerMustNotImportCatalog';
    public static IMPORT_CATALOG_ERROR_OWNER_MUST_NOT_OVERWRITE_EXISTING_IMAGES = 'M.Import.ImportCatalogErrors.ownerMustNotOverwriteExistingImages';

    // Export Package
    public static EXPORT_SUCCESS = 'export.success';
    public static EXPORT_ERROR_GENERIC = 'export.error.generic';
    public static EXPORT_CATALOG_IMAGES_NOT_EXCLUSIVE_TO_CATALOG = 'export.error.catalog.imagesNotExclusiveToCatalog';
    public static EXPORT_CATALOG_FAILED_TO_COPY_IMAGES = 'export.error.catalog.failedToCopyImages';
    public static EXPORT_GEOJSON_ERROR_WRITE = 'export.geojson.error.write';
    public static EXPORT_SHAPEFILE_ERROR_TEMP_FOLDER_CREATION = 'export.shapefile.error.tempFolderCreation';
    public static EXPORT_SHAPEFILE_ERROR_ZIP_FILE_CREATION = 'export.shapefile.error.zipFileCreation';
    public static EXPORT_SHAPEFILE_ERROR_WRITE = 'export.shapefile.error.write';
    public static EXPORT_SHAPEFILE_ERROR_GET_RESOURCES = 'export.shapefile.error.getResources';
    public static EXPORT_CSV_WARNING_INVALID_FIELD_DATA_SINGLE = 'export.csv.warning.invalidFieldData.single';
    public static EXPORT_CSV_WARNING_INVALID_FIELD_DATA_MULTIPLE = 'export.csv.warning.invalidFieldData.multiple';

    // Datastore Package
    public static DATASTORE_ERROR_NOT_FOUND = 'datastore.error.notFound';

    // Docedit Package
    public static DOCEDIT_WARNING_SAVE_CONFLICT = 'docedit.warning.saveConflict';
    public static DOCEDIT_WARNING_CATEGORY_CHANGE_FIELDS = 'docedit.warning.categoryChange.fields';
    public static DOCEDIT_WARNING_CATEGORY_CHANGE_RELATIONS = 'docedit.warning.categoryChange.relations';
    public static DOCEDIT_ERROR_SAVE = 'docedit.error.save';
    public static DOCEDIT_ERROR_DELETE = 'docedit.error.delete';
    public static DOCEDIT_ERROR_RESOLVE_CONFLICT = 'docedit.error.resolveConflict';
    public static DOCEDIT_VALIDATION_ERROR_INVALID_NUMERIC_VALUE = 'docedit.validation.error.invalidNumericValue';
    public static DOCEDIT_VALIDATION_ERROR_INVALID_NUMERIC_VALUES = 'docedit.validation.error.invalidNumericValues';
    public static DOCEDIT_VALIDATION_ERROR_INVALID_URL = 'docedit.validation.error.invalidUrl';
    public static DOCEDIT_VALIDATION_ERROR_INVALID_URLS = 'docedit.validation.error.invalidUrls';
    public static DOCEDIT_VALIDATION_ERROR_INVALID_DATING_VALUE = 'docedit.validation.error.invalidDatingValue';
    public static DOCEDIT_VALIDATION_ERROR_INVALID_DATING_VALUES = 'docedit.validation.error.invalidDatingValues';
    public static DOCEDIT_VALIDATION_ERROR_INVALID_DIMENSION_VALUE = 'docedit.validation.error.invalidDimensionValue';
    public static DOCEDIT_VALIDATION_ERROR_INVALID_DIMENSION_VALUES = 'docedit.validation.error.invalidDimensionValues';
    public static DOCEDIT_VALIDATION_ERROR_INVALID_DECIMAL_SEPARATOR = 'docedit.validation.error.invalidDecimalSeparator';
    public static DOCEDIT_VALIDATION_ERROR_INVALID_DECIMAL_SEPARATORS = 'docedit.validation.error.invalidDecimalSeparators';
    public static DOCEDIT_VALIDATION_ERROR_MISSING_PROPERTY = 'docedit.validation.error.missingProperty';
    public static DOCEDIT_VALIDATION_ERROR_NO_RECORDEDIN = 'docedit.validation.error.noRecordedIn';
    public static DOCEDIT_VALIDATION_ERROR_NO_RECORDEDIN_TARGET = 'docedit.validation.error.noRecordedInTarget';
    public static DOCEDIT_VALIDATION_ERROR_END_DATE_BEFORE_BEGINNING_DATE = 'docedit.validation.error.endDateBeforeBeginningDate';
    public static DOCEDIT_VALIDATION_ERROR_MAX_CHARACTERS_EXCEEDED = 'docedit.validation.error.maxCharactersExceeded';

    // Images Package
    public static IMAGES_SUCCESS_IMAGES_UPLOADED = 'images.success.imagesUploaded';
    public static IMAGES_SUCCESS_WLD_FILE_UPLOADED = 'images.success.wldFileUploaded';
    public static IMAGES_SUCCESS_WLD_FILES_UPLOADED = 'images.success.wldFilesUploaded';
    public static IMAGES_ERROR_FILEREADER = 'images.error.fileReader';
    public static IMAGES_ERROR_DUPLICATE_FILENAME = 'images.error.duplicateFilename';
    public static IMAGES_ERROR_DUPLICATE_FILENAMES = 'images.error.duplicateFilenames';
    public static IMAGES_ERROR_UNMATCHED_WLD_FILES = 'images.error.unmatchedWldFiles';

    // Imagestore Package
    public static IMAGESTORE_ERROR_INVALID_PATH = 'imagestore.error.invalidPath';
    public static IMAGESTORE_ERROR_INVALID_PATH_READ = 'imagestore.error.invalidPath.read';
    public static IMAGESTORE_ERROR_INVALID_PATH_WRITE = 'imagestore.error.invalidPath.write';
    public static IMAGESTORE_ERROR_INVALID_PATH_DELETE = 'imagestore.error.invalidPath.delete';
    public static IMAGESTORE_ERROR_UPLOAD = 'imagestore.error.upload';
    public static IMAGESTORE_ERROR_UPLOAD_PIXEL_LIMIT_EXCEEDED = 'imagestore.error.upload.pixelLimitExceeded';
    public static IMAGESTORE_ERROR_WRITE = 'imagestore.error.write';
    public static IMAGESTORE_ERROR_DELETE = 'imagestore.error.delete';
    public static IMAGESTORE_ERROR_INVALID_WORLDFILE = 'imagestore.error.invalidWorldfile';
    public static IMAGESTORE_DROP_AREA_ERROR_UNSUPPORTED_EXTENSIONS = 'imagestore.dropArea.error.unsupportedExtensions';

    // RemoteImagestore Package
    public static REMOTEIMAGESTORE_WARNING_LARGE_FILE_UPLOAD_BLOCKED_BY_PEER = 'remoteimagestore.warning.largeFileUploadBlockedByPeer';

    // Resources Package
    public static RESOURCES_SUCCESS_IMAGES_UPLOADED = 'resources.success.imagesImported';
    public static RESOURCES_WARNING_PROJECT_IDENTIFIER_NOT_SAME = 'resources.error.projectIdentifierNotSame';
    public static RESOURCES_ERROR_CATEGORY_NOT_FOUND = 'resources.error.categoryNotFound';
    public static RESOURCES_ERROR_ONE_PROJECT_MUST_EXIST = 'resources.error.oneProjectMustExist'; // TODO Rename
    public static RESOURCES_ERROR_RESOURCE_DELETED = 'resources.error.resourceDeleted';
    public static RESOURCES_ERROR_UNKNOWN_RESOURCE_DELETED = 'resources.error.unknownResourceDeleted';
    public static RESOURCES_ERROR_PARENT_RESOURCE_DELETED = 'resources.error.parentResourceDeleted';
    public static RESOURCES_ERROR_PARENT_RESOURCE_UNKNOWN_CATEGORY = 'resources.error.parentResourceUnknownCategory';
    public static RESOURCES_ERROR_PARENT_OPERATION_UNKNOWN_CATEGORY = 'resources.error.parentOperationUnknownCategory';
    public static RESOURCES_ERROR_RESOURCE_MISSING_DURING_SYNCING = 'resources.error.resourceMissingDuringSyncing';
    public static RESOURCES_ERROR_CANNOT_MOVE_WITH_SAME_OPERATION_RELATIONS = 'resources.error.cannotMoveWithSameOperationRelations';
    public static RESOURCES_ERROR_CANNOT_MOVE_CHILDREN = 'resources.error.cannotMoveChildren';

    // Project identifier validation
    public static PROJECT_CREATION_ERROR_MISSING_IDENTIFIER = 'projectCreation.error.missingIdentifier';
    public static PROJECT_CREATION_ERROR_IDENTIFIER_LENGTH = 'projectCreation.error.identifierLength';
    public static PROJECT_CREATION_ERROR_IDENTIFIER_CHARACTERS = 'projectCreation.error.identifierCharacters';
    public static PROJECT_CREATION_ERROR_IDENTIFIER_EXISTS = 'projectCreation.error.identifierExists';
    public static PROJECT_CREATION_ERROR_IDENTIFIER_STARTING_CHARACTER = 'projectCreation.error.identifierStartingCharacter';
    public static PROJECT_CREATION_ERROR_NAME_LENGTH = 'projectCreation.error.nameLength';

    // Configuration Package
    public static CONFIGURATION_ERROR_NO_VALUES_IN_VALUELIST = 'configuration.error.noValuesInValuelist';
    public static CONFIGURATION_ERROR_NO_VALUELIST = 'configuration.error.noValuelist';
    public static CONFIGURATION_ERROR_NO_SUBFIELDS = 'configuration.error.noSubfields';
    public static CONFIGURATION_ERROR_SUBFIELD_CONDITION_VIOLATION_VALUELISTS = 'configuration.error.subfieldConditionViolation.valuelists';
    public static CONFIGURATION_ERROR_SUBFIELD_CONDITION_VIOLATION_INPUT_TYPE = 'configuration.error.subfieldConditionViolation.inputType';
    public static CONFIGURATION_ERROR_VALUE_USED_IN_SUBFIELD_CONDITION = 'configuration.error.valueUsedInSubfieldCondition';
    public static CONFIGURATION_ERROR_INVALID_REFERENCE = 'configuration.error.invalidReference';
    public static CONFIGURATION_ERROR_IMPORT_FAILURE = 'configuration.error.importFailure';
    public static CONFIGURATION_ERROR_NO_PROJECT_LANGUAGES = 'configuration.error.noProjectLanguages';

    public msgs : { [id: string]: Message } = {};


    constructor(private i18n: I18n) {

        super();
        this.msgs[M.IMPORT_ERROR_NOT_UPDATED] = {
            content: i18n({
                id: 'messages.import.error.notupdated',
                value: 'Fehlgeschlagene Zuordnung per Bezeichner \'[0]\'. Ressource nicht vorhanden.',
            }),
            level: 'danger',
            params: [],
            hidden: false
        };
        this.msgs[M.MESSAGES_ERROR_UNKNOWN_MESSAGE] = {
            content: i18n({
                id: 'messages.messages.error.unknownMessage',
                value: 'Ein unbekannter Fehler ist aufgetreten. Details können in der Developer Console eingesehen werden.',
            }),
            level: 'danger',
            params: [],
            hidden: false
        };
        this.msgs[M.PROJECT_CONFIGURATION_ERROR_GENERIC] = {
            content: i18n({
                id: 'messages.configuration.error.generic',
                value: 'Fehler beim Auswerten eines Konfigurationsobjektes.',
            }),
            level: 'danger',
            params: [],
            hidden: false
        };
        this.msgs[M.CONFIG_READER_ERROR_INVALID_JSON] = {
            content: i18n({
                id: 'messages.configReader.error.invalidJson',
                value: 'Fehler beim Parsen der Konfigurationsdatei \'[0]\': Das JSON ist nicht valide.',
            }),
            level: 'danger',
            params: [],
            hidden: false
        };
        this.msgs[M.ALL_ERROR_FIND] = {
            content: i18n({
                id: 'messages.all.error.find',
                value: 'Beim Laden von Ressourcen ist ein Fehler aufgetreten.'
            }),
            level: 'danger',
            params: [],
            hidden: false
        };
        this.msgs[M.SETTINGS_SUCCESS] = {
            content: i18n({
                id: 'messages.settings.success',
                value: 'Die Einstellungen wurden erfolgreich aktiviert.'
            }),
            level: 'success',
            params: [],
            hidden: false
        };
        this.msgs[M.SETTINGS_ERROR_MALFORMED_ADDRESS] = {
            content: i18n({
                id: 'messages.settings.error.malformedAddress',
                value: 'Die angegebene Serveradresse entspricht nicht dem angegebenen Format.'
            }),
            level: 'danger',
            params: [],
            hidden: false
        };
        this.msgs[M.PROJECTS_DELETE_SUCCESS] = {
            content: i18n({
                id: 'messages.projects.deleteSuccess',
                value: 'Das Projekt "[0]" wurde erfolgreich gelöscht.'
            }),
            level: 'success',
            params: [],
            hidden: false
        };
        this.msgs[M.APP_ERROR_GENERIC_SAVE_ERROR] = {
            content: i18n({
                id: 'messages.app.error.genericSaveError',
                value: 'Beim Speichern der Ressource ist ein Fehler aufgetreten.'
            }),
            level: 'danger',
            params: [],
            hidden: false
        };
        this.msgs[M.APP_CONTROLLER_SUCCESS] = {
            content: i18n({
                id: 'messages.app.appControllerSuccess',
                value: 'Erfolgreich ausgeführt.'
            }),
            level: 'success',
            params: [],
            hidden: false
        };
        this.msgs[M.BACKUP_WRITE_SUCCESS] = {
            content: i18n({
                id: 'messages.backup.write.success',
                value: 'Die Datenbank wurde erfolgreich gesichert.'
            }),
            level: 'success',
            params: [],
            hidden: false
        };
        this.msgs[M.BACKUP_READ_SUCCESS] = {
            content: i18n({
                id: 'messages.backup.read.success',
                value: 'Das Backup wurde erfolgreich eingelesen.'
            }),
            level: 'success',
            params: [],
            hidden: false
        };
        this.msgs[M.BACKUP_WRITE_ERROR_GENERIC] = {
            content: i18n({
                id: 'messages.backup.write.error.generic',
                value: 'Beim Sichern der Datenbank ist ein Fehler aufgetreten.'
            }),
            level: 'danger',
            params: [],
            hidden: false
        };
        this.msgs[M.BACKUP_READ_ERROR_GENERIC] = {
            content: i18n({
                id: 'messages.backup.read.error.generic',
                value: 'Beim Einlesen der Backup-Datei ist ein Fehler aufgetreten.'
            }),
            level: 'danger',
            params: [],
            hidden: false
        };
        this.msgs[M.BACKUP_READ_ERROR_FILE_NOT_FOUND] = {
            content: i18n({
                id: 'messages.backup.read.error.fileNotFound',
                value: 'Die angegebene Datei konnte nicht gefunden werden.'
            }),
            level: 'danger',
            params: [],
            hidden: false
        };
        this.msgs[M.BACKUP_READ_ERROR_NO_PROJECT_IDENTIFIER] = {
            content: i18n({
                id: 'messages.backup.read.error.noProjectIdentifier',
                value: 'Geben Sie eine Projektkennung an, um fortzufahren.'
            }),
            level: 'danger',
            params: [],
            hidden: false
        };
        this.msgs[M.BACKUP_READ_ERROR_SAME_PROJECT_IDENTIFIER] = {
            content: i18n({
                id: 'messages.backup.read.error.sameProjectIdentifier',
                value: 'Bitte wählen Sie als Ziel ein anderes als das gerade ausgewählte Projekt.'
            }),
            level: 'danger',
            params: [],
            hidden: false
        };
        this.msgs[M.BACKUP_READ_WARNING_UNSIMILAR_PROJECT_IDENTIFIER] = {
            content: i18n({
                id: 'messages.backup.read.warning.unsimilarProjectIdentifier',
                value: 'Die von Ihnen gewählte Projektkennung unterscheidet sich stark von der Kennung des Originalprojekts. Bitte prüfen Sie, ob Sie die korrekte Backup-Datei ausgewählt haben, bevor Sie Daten aus dem wiederhergestellten Projekt mit anderen Field-Desktop-Instanzen oder Field-Servern synchronisieren.'
            }),
            level: 'warning',
            params: [],
            hidden: false
        };
        this.msgs[M.MODEL_VALIDATION_IDENTIFIER_ALREADY_EXISTS] = {
            content: i18n({
                id: 'messages.model.validation.error.identifierExists',
                value: 'Der Ressourcen-Bezeichner [0] existiert bereits.'
            }),
            level: 'danger',
            params: [''],
            hidden: false
        };
        this.msgs[M.MODEL_VALIDATION_INVALID_IDENTIFIER_PREFIX] = {
            content: i18n({
                id: 'messages.model.validation.error.identifierPrefix',
                value: 'Der Ressourcen-Bezeichner \'[0]\' beginnt nicht mit dem für die Kategorie \'[1]\' konfigurierten Bezeichner-Präfix \'[2]\'.'
            }),
            level: 'danger',
            params: ['?', '?', '?'],
            hidden: false
        };
        this.msgs[M.MODEL_VALIDATION_MISSING_COORDINATES] = {
            content: i18n({
                id: 'messages.model.validation.error.missingCoordinates',
                value: 'Die Koordinaten einer Geometrie sind nicht definiert.'
            }),
            level: 'danger',
            params: [],
            hidden: false
        };
        this.msgs[M.MODEL_VALIDATION_INVALID_COORDINATES] = {
            content: i18n({
                id: 'messages.model.validation.error.invalidCoordinates',
                value: 'Die Koordinaten einer Geometrie vom Typ [0] sind nicht valide.'
            }),
            level: 'danger',
            params: ['?'],
            hidden: false
        };
        this.msgs[M.MODEL_VALIDATION_MISSING_GEOMETRYTYPE] = {
            content: i18n({
                id: 'messages.model.validation.error.missingGeometryType',
                value: 'Der Typ einer Geometrie ist nicht definiert.'
            }),
            level: 'danger',
            params: [],
            hidden: false
        };
        this.msgs[M.MODEL_VALIDATION_UNSUPPORTED_GEOMETRY_TYPE] = {
            content: i18n({
                id: 'messages.model.validation.error.unsupportedGeometryType',
                value: 'Der Geometrietyp [0] wird von der Anwendung nicht unterstützt.'
            }),
            level: 'danger',
            params: ['?'],
            hidden: false
        };
        this.msgs[M.INITIAL_SYNC_DB_NOT_EMPTY] = {
            content: i18n({
                id: 'messages.initialSync.targetDbNotEmpty',
                value: 'Download fehlgeschlagen: Das angegebene Projekt existiert bereits auf dieser Field-Desktop-Installation.'
            }),
            level: 'danger',
            params: [],
            hidden: false
        };
        this.msgs[M.INITIAL_SYNC_GENERIC_ERROR] = {
            content: i18n({
                id: 'messages.initialSync.genericError',
                value: 'Download fehlgeschlagen: Stellen Sie sicher, dass die angegebene Adresse korrekt ist und eine Netzwerkverbindung besteht. Prüfen Sie auch die Firewalleinstellungen Ihres Systems.'
            }),
            level: 'danger',
            params: [],
            hidden: false
        };
        this.msgs[M.INITIAL_SYNC_COULD_NOT_START_GENERIC_ERROR] = {
            content: i18n({
                id: 'messages.initialSync.couldNotStartGenericError',
                value: 'Download fehlgeschlagen: Ein unbekannter Fehler ist aufgetreten.'
            }),
            level: 'danger',
            params: [],
            hidden: false
        };
        this.msgs[M.INITIAL_SYNC_INVALID_CREDENTIALS] = {
            content: i18n({
                id: 'messages.initialSync.invalidCredentials',
                value: 'Download fehlgeschlagen: Stellen Sie sicher, dass das Projekt unter der angegebenen Adresse existiert und prüfen Sie das Passwort.'
            }),
            level: 'danger',
            params: [],
            hidden: false
        };
        this.msgs[M.IMPORT_SUCCESS_SINGLE] = {
            content: i18n({
                id: 'messages.import.success.single',
                value: 'Eine Ressource wurde erfolgreich importiert.'
            }),
            level: 'success',
            params: [],
            hidden: false
        };
        this.msgs[M.IMPORT_SUCCESS_MULTIPLE] = {
            content: i18n({
                id: 'messages.import.success.multiple',
                value: '[0] Ressourcen wurden erfolgreich importiert.'
            }),
            level: 'success',
            params: [
                i18n({
                    id: 'messages.import.success.multiple.defaultParameter',
                    value: 'Mehrere'
                })],
            hidden: false
        };
        this.msgs[M.IMPORT_WARNING_EMPTY] = {
            content: i18n({
                id: 'messages.import.warning.empty',
                value: 'Die Import-Datei enthält keine Einträge.'
            }),
            level: 'warning',
            params: [],
            hidden: false
        };
        this.msgs[M.IMPORT_WARNING_IGNORED_EXISTING_IDENTIFIER] = {
            content: i18n({
                id: 'messages.import.warning.ignoredExistingIdentifier',
                value: 'Die Ressource \'[0]\' wurde nicht importiert, weil bereits eine Ressource mit dem gleichen Bezeichner existiert.'
            }),
            level: 'warning',
            params: [],
            hidden: false
        };
        this.msgs[M.IMPORT_WARNING_IGNORED_EXISTING_IDENTIFIERS] = {
            content: i18n({
                id: 'messages.import.warning.ignoredExistingIdentifiers',
                value: '[0] Ressourcen wurden nicht importiert, weil bereits Ressourcen mit dem jeweiligen Bezeichner existieren (vollständige Auflistung unten).'
            }),
            level: 'warning',
            params: [],
            hidden: false
        };
        this.msgs[M.IMPORT_WARNING_IGNORED_MISSING_IDENTIFIER] = {
            content: i18n({
                id: 'messages.import.warning.ignoredMissingIdentifier',
                value: 'Die Ressource \'[0]\' wurde nicht importiert, weil keine Ressource mit dem Bezeichner gefunden wurde.'
            }),
            level: 'warning',
            params: [],
            hidden: false
        };
        this.msgs[M.IMPORT_WARNING_IGNORED_MISSING_IDENTIFIERS] = {
            content: i18n({
                id: 'messages.import.warning.ignoredMissingIdentifiers',
                value: '[0] Ressourcen wurden nicht importiert, weil keine Ressourcen mit dem jeweiligen Bezeichner gefunden wurden (vollständige Auflistung unten).'
            }),
            level: 'warning',
            params: [],
            hidden: false
        };
        this.msgs[M.IMPORT_READER_GENERIC_START_ERROR] = {
            content: i18n({
                id: 'messages.import.error.genericStartError',
                value: 'Import kann nicht gestartet werden.'
            }),
            level: 'danger',
            params: [],
            hidden: false
        };
        this.msgs[M.IMPORT_READER_FILE_UNREADABLE] = {
            content: i18n({
                id: 'messages.import.error.fileUnreadable',
                value: 'Beim Import ist ein Fehler aufgetreten: Die Datei [0] konnte nicht gelesen werden.',
            }),
            level: 'danger',
            params: [''],
            hidden: false
        };
        this.msgs[M.IMPORT_PARSER_INVALID_JSON] = {
            content: i18n({
                id: 'messages.import.error.invalidJson',
                value: 'Beim Import ist ein Fehler aufgetreten: Das JSON ist nicht valide. Die ursprüngliche Fehlermeldung lautet: [0].'
            }),
            level: 'danger',
            params: ['?'],
            hidden: false
        };
        this.msgs[M.IMPORT_PARSER_INVALID_JSONL] = {
            content: i18n({
                id: 'messages.import.error.invalidJsonl',
                value: 'Beim Import ist ein Fehler aufgetreten: Das JSON in Zeile [0] ist nicht valide.'
            }),
            level: 'danger',
            params: ['?'],
            hidden: false
        };
        this.msgs[M.IMPORT_PARSER_INVALID_GEOJSON_IMPORT_STRUCT] = {
            content: i18n({
                id: 'messages.import.error.invalidGeojsonImportStruct',
                value: 'Fehlerhafte GeoJSON-Importstruktur. Grund: [0].'
            }),
            level: 'danger',
            params: ['?'],
            hidden: false
        };
        this.msgs[M.IMPORT_PARSER_MISSING_IDENTIFIER] = {
            content: i18n({
                id: 'messages.import.error.missingIdentifier',
                value: 'Beim Import ist ein Fehler aufgetreten: Ein oder mehrere Features ohne properties.identifier wurden gefunden.'
            }),
            level: 'danger',
            params: ['?'],
            hidden: false
        };
        this.msgs[M.IMPORT_PARSER_MISSING_IDENTIFIER_SHAPEFILE] = {
            content: i18n({
                id: 'messages.import.error.missingIdentifierShapefile',
                value: 'Beim Import ist ein Fehler aufgetreten: Ein oder mehrere Features ohne das Attribut "identifier" wurden gefunden.'
            }),
            level: 'danger',
            params: ['?'],
            hidden: false
        };
        this.msgs[M.IMPORT_PARSER_ID_MUST_NOT_BE_SET] = {
            content: i18n({
                id: 'messages.import.error.parser.idnottobeset',
                value: 'Beim Import ist ein Fehler aufgetreten: Ein oder mehrere Ressourcen enthielten unerlaubte Einträge für resource.id.'
            }),
            level: 'danger',
            params: [],
            hidden: false
        };
        this.msgs[M.IMPORT_PARSER_IDENTIFIER_FORMAT] = {
            content: i18n({
                id: 'messages.import.error.identifierFormat',
                value: 'Beim Import ist ein Fehler aufgetreten: properties.identifier muss eine Zeichenkette sein, keine Zahl.'
            }),
            level: 'danger',
            params: ['?'],
            hidden: false
        };
        this.msgs[M.IMPORT_PARSER_INVALID_CSV] = {
            content: i18n({
                id: 'messages.import.error.invalidCsv',
                value: 'Beim Import ist ein Fehler aufgetreten: Das CSV in Zeile [0] konnte nicht gelesen werden.'
            }),
            level: 'danger',
            params: ['?'],
            hidden: false
        };
        this.msgs[M.IMPORT_PARSER_CSV_INVALID_HEADING] = {
            content: i18n({
                id: 'messages.import.error.csvInvalidHeading',
                value: 'Ungültiger CSV-Header: Siehe [0].'
            }),
            level: 'danger',
            params: ['?'],
            hidden: false
        };
        this.msgs[M.IMPORT_PARSER_CSV_HEADING_EMPTY_ENTRY] = {
            content: i18n({
                id: 'messages.import.error.csvHeadingEmptyEntry',
                value: 'CSV-Header darf keine leeren Einträge haben.'
            }),
            level: 'danger',
            params: ['?'],
            hidden: false
        };
        this.msgs[M.IMPORT_PARSER_CSV_HEADING_PATH_ITEM_TYPE_MISMATCH] = {
            content: i18n({
                id: 'messages.import.parser.error.csvHeadingPathItemTypeMismatch',
                value: 'CSV-Header: Array Indices und Object keys dürfen nicht gemischt werden: [0]'
            }),
            level: 'danger',
            params: ['?'],
            hidden: false
        };
        this.msgs[M.IMPORT_PARSER_CSV_HEADING_ARRAY_INDICES_INVALID_SEQUENCE] = {
            content: i18n({
                id: 'messages.import.error.csvHeadingArrayIndicesInvalidSequence',
                value: 'Ungültige Sequenz für Array Indices in CSV-Header: [0]'
            }),
            level: 'danger',
            params: ['?'],
            hidden: false
        };
        this.msgs[M.IMPORT_PARSER_CSV_ROWS_LENGTH_MISMATCH] = {
            content: i18n({
                id: 'messages.import.error.csvRowsLengthMismatch',
                value: 'Anzahl der Einträge in Zeile [0] stimmt nicht mit Anzahl der Einträge in Header überein'
            }),
            level: 'danger',
            params: ['?'],
            hidden: false
        };
        this.msgs[M.IMPORT_PARSER_NOT_A_BOOLEAN] = {
            content: i18n({
                id: 'messages.import.error.parser.csv.notaboolean',
                value: 'CSV fehlerhaft: Wert "[0]" in Spalte "[1]" ist kein Boolean.'
            }),
            level: 'danger',
            params: ['?', '?'],
            hidden: false
        };
        this.msgs[M.IMPORT_PARSER_NOT_A_NUMBER] = {
            content: i18n({
                id: 'messages.import.error.parser.csv.notanumber',
                value: 'CSV fehlerhaft: Wert "[0]" in Spalte "[1]" ist keine Zahl.'
            }),
            level: 'danger',
            params: ['?', '?'],
            hidden: false
        };
        this.msgs[M.IMPORT_PARSER_GENERIC_CSV_ERROR] = {
            content: i18n({
                id: 'messages.import.error.genericCsvError',
                value: 'Beim Import ist ein Fehler aufgetreten: Die CSV-Daten konnten nicht gelesen werden.'
            }),
            level: 'danger',
            params: [],
            hidden: false
        };
        this.msgs[M.IMPORT_PARSER_MANDATORY_CSV_FIELD_MISSING] = {
            content: i18n({
                id: 'messages.import.error.mandatoryCsvFieldMissing',
                value: 'Beim Import ist ein Fehler aufgetreten: In Zeile [0] fehlt das Pflichtfeld \'[1]\'.'
            }),
            level: 'danger',
            params: ['?', '?'],
            hidden: false
        };
        this.msgs[M.IMPORT_READER_INVALID_OPERATION_RESOURCE] = {
            content: i18n({
                id: 'messages.import.error.invalidOperationResource',
                value: 'Beim Import ist ein Fehler aufgetreten: Ressourcen der Kategorie [0] können der gewählten Maßnahme der Kategorie [1] nicht zugeordnet werden.'
            }),
            level: 'danger',
            params: ['?', '?'],
            hidden: false
        };
        this.msgs[M.IMPORT_PREVALIDATION_OPERATIONS_NOT_ALLOWED] = {
            content: i18n({
                id: 'messages.import.error.operationsNotAllowed',
                value: 'Wenn die Option \'Daten einer Maßnahme zuordnen\' gewählt ist, darf die Import-Datei keine Maßnahmen enthalten.'
            }),
            level: 'danger',
            params: [],
            hidden: false
        };
        this.msgs[M.IMPORT_EXEC_NO_LIES_WITHIN_SET] = {
            content: i18n({
                id: 'messages.import.error.onlyplaceandoperationwithoutrecordedinallowed',
                value: 'Wenn \'Keine Zuordnung\' gewählt ist, müssen alle Ressourcen außer Maßnahmen oder Orte \'isChildOf\'-Zuordnungen haben.'
            }),
            level: 'danger',
            params: [],
            hidden: false
        };
        this.msgs[M.IMPORT_PREVALIDATION_DUPLICATE_IDENTIFIER] = {
            content: i18n({
                id: 'messages.import.error.duplicateidentifier',
                value: 'Mehrfach vorhandener Identifier in Importdatei: \'[0]\'.'
            }),
            level: 'danger',
            params: [ '?' ],
            hidden: false
        };
        this.msgs[M.IMPORT_READER_GENERIC_DATASTORE] = {
            content: i18n({
                id: 'messages.import.error.genericDatastoreError',
                value: 'Beim Import ist ein Fehler aufgetreten: Die Ressource [0] konnte nicht gespeichert werden.'
            }),
            level: 'danger',
            params: [ '?' ],
            hidden: false
        };
        this.msgs[M.IMPORT_PARSER_INVALID_GEOMETRY] = {
            content: i18n({
                id: 'messages.import.error.invalidGeometry',
                value: 'Beim Import ist ein Fehler aufgetreten: Invalide Geometriedaten in Zeile [0].'
            }),
            level: 'danger',
            params: ['?'],
            hidden: false
        };
        this.msgs[M.IMPORT_READER_ROLLBACK] = {
            content: i18n({
                id: 'messages.import.error.rollbackError',
                value: 'Beim Versuch, die bereits importierten Daten zu löschen, ist ein Fehler aufgetreten.'
            }),
            level: 'danger',
            params: [],
            hidden: false
        };
        this.msgs[M.IMPORT_EXEC_MISSING_RELATION_TARGET] = {
            content: i18n({
                id: 'messages.import.error.missingRelationTarget',
                value: 'Beim Import ist ein Fehler aufgetreten: Die als Ziel einer Relation angegebene Ressource mit der ID [0] konnte nicht gefunden werden.'
            }),
            level: 'danger',
            params: ['?'],
            hidden: false
        };
        this.msgs[M.IMPORT_EXEC_NOT_INTERRELATED] = {
            content: i18n({
                id: 'messages.import.error.notInterrelated',
                value: 'Beim Import ist ein Fehler aufgetreten: Verknüpfung bei \'[0]\' fehlerhaft.'
            }),
            level: 'danger',
            params: ['?', '?'],
            hidden: false
        };
        this.msgs[M.IMPORT_EXEC_EMPTY_RELATION] = {
            content: i18n({
                id: 'messages.import.error.emptyRelation',
                value: 'Beim Import ist ein Fehler aufgetreten: Leere Relation bei \'[0]\'.'
            }),
            level: 'danger',
            params: ['?'],
            hidden: false
        };
        this.msgs[M.IMPORT_LIES_WITHIN_TARGET_NOT_MATCHES_ON_IS_RECORDED_IN] = {
            content: i18n({
                id: 'messages.import.error.liesWithinRecordedInMismatch',
                value: '\'parent\' zeigt auf Resource einer anderen Maßnahme. Bezeichner: \'[0]\'.'
            }),
            level: 'danger',
            params: ['?'],
            hidden: false
        };
        this.msgs[M.IMPORT_PARENT_ASSIGNMENT_TO_OPERATIONS_NOT_ALLOWED] = {
            content: i18n({
                id: 'messages.importerrors.parentassignmenttooperationnotallowed',
                value: 'Wenn der Modus \'Daten einer Maßnahme zuordnen gewählt ist\', dürfen keine Zuordnungen zu Maßnahmen per \'parent\' vorgenommen werden.'
            }),
            level: 'danger',
            params: ['?'],
            hidden: false
        };
        this.msgs[M.IMPORT_PARENT_MUST_NOT_BE_ARRAY] = {
            content: i18n({
                id: 'messages.Import.ImportErrors.parentMustNotBeArray',
                value: 'Fehler bei Ressource mit Bezeichner \'[0]\'. Die \'parent\'-Relation darf kein Array sein.'
            }),
            level: 'danger',
            params: ['?'],
            hidden: false
        };
        this.msgs[M.IMPORT_MUST_BE_ARRAY] = {
            content: i18n({
                id: 'messages.Import.ImportErrors.relationMustBeArray',
                value: 'Fehler bei Ressource mit Bezeichner \'[0]\'. Relationen ausser \'isChildOf\' müssen Arrays sein.'
            }),
            level: 'danger',
            params: ['?'],
            hidden: false
        };
        this.msgs[M.IMPORT_PREVALIDATION_MISSING_RELATION_TARGET] = {
            content: i18n({
                id: 'messages.import.error.prevalidation.missingRelationTarget',
                value: 'Beim Import ist ein Fehler aufgetreten: Die als Ziel einer Relation angegebene Ressource mit dem Bezeichner \'[0]\' konnte nicht gefunden werden.'
            }),
            level: 'danger',
            params: ['?'],
            hidden: false
        };
        this.msgs[M.IMPORT_NO_OPERATION_ASSIGNABLE] = {
            content: i18n({
                id: 'messages.import.error.noOperationAssignable',
                value: 'Beim Import ist ein Fehler aufgetreten: Eine Ressource konnte keiner Maßnahme mit dem Bezeichner \'[0]\' zugeordnet werden.'
            }),
            level: 'danger',
            params: ['?'],
            hidden: false
        };
        this.msgs[M.IMPORT_NO_FEATURE_ASSIGNABLE] = {
            content: i18n({
                id: 'messages.import.error.noFeatureAssignable',
                value: 'Beim Import ist ein Fehler aufgetreten: Eine Ressource konnte keiner stratigraphischen Einheit zugeordnet werden. Ziel-Bezeichner oder Fehler: \'[0]\''
            }),
            level: 'danger',
            params: ['?'],
            hidden: false
        };
        this.msgs[M.IMPORT_READER_SHAPEFILE_READ_ERROR] = {
            content: i18n({
                id: 'messages.import.error.shapefile.readError',
                value: 'Beim Import ist ein Fehler aufgetreten: Die Datei konnte nicht gelesen werden. Bitte wählen Sie ein gültiges Shapefile (.shp) aus.'
            }),
            level: 'danger',
            params: [],
            hidden: false
        };
        this.msgs[M.IMPORT_READER_SHAPEFILE_UNSUPPORTED_GEOMETRY_TYPE] = {
            content: i18n({
                id: 'messages.import.error.shapefile.unsupportedGeometryType',
                value: 'Beim Import ist ein Fehler aufgetreten: Der Geometrietyp [0] wird nicht unterstützt.'
            }),
            level: 'danger',
            params: [],
            hidden: false
        };
        this.msgs[M.IMPORT_READER_SHAPEFILE_JSONL_WRITE] = {
            content: i18n({
                id: 'messages.import.error.shapefile.jsonlWriteError',
                value: 'Beim Import ist ein Fehler aufgetreten: Die temporäre Datei [0] konnte nicht angelegt werden.'
            }),
            level: 'danger',
            params: [],
            hidden: false
        };
        this.msgs[M.IMPORT_PARSER_SHAPEFILE_GENERIC] = {
            content: i18n({
                id: 'messages.import.error.shapefile.generic',
                value: 'Beim Import ist ein Fehler aufgetreten: Das Shapefile konnte nicht importiert werden.'
            }),
            level: 'danger',
            params: [],
            hidden: false
        };
        this.msgs[M.IMPORT_PARSER_CATALOG_GENERIC] = {
            content: i18n({
                id: 'messages.import.error.catalog.generic',
                value: 'Beim Import ist ein Fehler aufgetreten: Der Katalog konnte nicht importiert werden.'
            }),
            level: 'danger',
            params: [],
            hidden: false
        };
        this.msgs[M.IMPORT_VALIDATION_INVALID_CATEGORY] = {
            content: i18n({
                id: 'messages.import.validation.error.invalidCategory',
                value: 'Ungültige Kategoriedefinition: \'[0]\''
            }),
            level: 'danger',
            params: [],
            hidden: false
        };
        this.msgs[M.IMPORT_ERROR_MUST_LIE_WITHIN_OTHER_NON_OPERATON_RESOURCE] = {
            content: i18n({
                id: 'messages.import.validation.error.mustHaveLiesWithin',
                value: 'Ressourcen der Kategorie \'[0]\' müssen innerhalb von anderen Ressourcen angelegt werden. Betroffen ist: \'[1]\'.'
            }),
            level: 'danger',
            params: [],
            hidden: false
        };
        this.msgs[M.IMPORT_ERROR_TARGET_CATEGORY_RANGE_MISMATCH] = {
            content: i18n({
                id: 'messages.import.validation.error.targetCategoryRangeMismatch',
                value: 'Eine Ressource der Kategorie \'[2]\' darf nicht mittels \'[1]\' mit \'[0]\' verknüpft werden.'
            }),
            level: 'danger',
            params: [],
            hidden: false
        };
        this.msgs[M.IMPORT_VALIDATION_ERROR_INVALID_FIELD] = {
            content: i18n({
                id: 'messages.import.validation.error.invalidField',
                value: 'Fehlende Felddefinition für das Feld \'[1]\' einer Ressource der Kategorie \'[0]\'.'
            }),
            level: 'danger',
            params: [],
            hidden: false
        };
        this.msgs[M.IMPORT_VALIDATION_ERROR_INVALID_FIELDS] = {
            content: i18n({
                id: 'messages.import.validation.error.invalidFields',
                value: 'Fehlende Felddefinitionen für die Felder \'[1]\' einer Ressource der Kategorie \'[0]\'.'
            }),
            level: 'danger',
            params: [],
            hidden: false
        };
        this.msgs[M.IMPORT_VALIDATION_ERROR_INVALID_RELATION_FIELD] = {
            content: i18n({
                id: 'messages.import.validation.error.invalidRelationField',
                value: 'Fehlende Definition für die Relation \'[1]\' einer Ressource der Kategorie \'[0]\'.'
            }),
            level: 'danger',
            params: [],
            hidden: false
        };
        this.msgs[M.IMPORT_VALIDATION_ERROR_INVALID_RELATION_FIELDS] = {
            content: i18n({
                id: 'messages.import.validation.error.invalidRelationFields',
                value: 'Fehlende Definitionen für die Relationen \'[1]\' einer Ressource der Kategorie \'[0]\'.'
            }),
            level: 'danger',
            params: [],
            hidden: false
        };
        this.msgs[M.IMPORT_VALIDATION_ERROR_INVALID_NUMERIC_VALUE] = {
            content: i18n({
                id: 'messages.import.validation.error.invalidNumericValue',
                value: 'Ungültiger Zahlenwert im Feld \'[1]\' einer Ressource der Kategorie \'[0]\'.'
            }),
            level: 'danger',
            params: [],
            hidden: false
        };
        this.msgs[M.IMPORT_VALIDATION_ERROR_INVALID_NUMERIC_VALUES] = {
            content: i18n({
                id: 'messages.import.validation.error.invalidNumericValues',
                value: 'Ungültige Zahlenwerte in den folgenden Feldern einer Ressource der Kategorie \'[0]\': [1].'
            }),
            level: 'danger',
            params: [],
            hidden: false
        };
        this.msgs[M.IMPORT_VALIDATION_ERROR_INVALID_URL] = {
            content: i18n({
                id: 'messages.import.validation.error.invalidUrl',
                value: 'Ungültige URL im Feld \'[1]\' einer Ressource der Kategorie \'[0]\'.'
            }),
            level: 'danger',
            params: [],
            hidden: false
        };
        this.msgs[M.IMPORT_VALIDATION_ERROR_INVALID_URLS] = {
            content: i18n({
                id: 'messages.import.validation.error.invalidUrls',
                value: 'Ungültige URLs in den folgenden Feldern einer Ressource der Kategorie \'[0]\': [1].'
            }),
            level: 'danger',
            params: [],
            hidden: false
        };
        this.msgs[M.IMPORT_VALIDATION_ERROR_INVALID_DATE] = {
            content: i18n({
                id: 'messages.import.validation.error.invalidDate',
                value: 'Ungültige Datumsangabe im Feld \'[1]\' einer Ressource der Kategorie \'[0]\'. Format für Datumsangaben: "Tag.Monat.Jahr", z. B.: 01.01.2010'
            }),
            level: 'danger',
            params: [],
            hidden: false
        };
        this.msgs[M.IMPORT_VALIDATION_ERROR_INVALID_DATES] = {
            content: i18n({
                id: 'messages.import.validation.error.invalidDates',
                value: 'Ungültige Datumsangaben in den folgenden Feldern einer Ressource der Kategorie \'[0]\': [1]. Format für Datumsangaben: "Tag.Monat.Jahr", z. B.: 01.01.2010'
            }),
            level: 'danger',
            params: [],
            hidden: false
        };
        this.msgs[M.IMPORT_VALIDATION_ERROR_INVALID_DATING_VALUE] = {
            content: i18n({
                id: 'messages.import.validation.error.invalidDatingValue',
                value: 'Ungültige Datierung im Feld \'[1]\' einer Ressource der Kategorie \'[0]\'.'
            }),
            level: 'danger',
            params: [],
            hidden: false
        };
        this.msgs[M.IMPORT_VALIDATION_ERROR_INVALID_DATING_VALUES] = {
            content: i18n({
                id: 'messages.import.validation.error.invalidDatingValues',
                value: 'Ungültige Datierungen in den folgenden Feldern einer Ressource der Kategorie \'[0]\': [1].'
            }),
            level: 'danger',
            params: [],
            hidden: false
        };
        this.msgs[M.IMPORT_VALIDATION_ERROR_INVALID_DIMENSION_VALUE] = {
            content: i18n({
                id: 'messages.import.validation.error.invalidDimensionValue',
                value: 'Ungültige Maßangabe im Feld \'[1]\' einer Ressource der Kategorie \'[0]\'.'
            }),
            level: 'danger',
            params: [],
            hidden: false
        };
        this.msgs[M.IMPORT_VALIDATION_ERROR_INVALID_DIMENSION_VALUES] = {
            content: i18n({
                id: 'messages.import.validation.error.invalidDimensionValues',
                value: 'Ungültige Maßangaben in den folgenden Feldern einer Ressource der Kategorie \'[0]\': [1].'
            }),
            level: 'danger',
            params: [],
            hidden: false
        };
        this.msgs[M.IMPORT_VALIDATION_ERROR_INVALID_LITERATURE_VALUE] = {
            content: i18n({
                id: 'messages.import.validation.error.invalidLiteratureValue',
                value: 'Ungültiger Literaturverweis im Feld \'[1]\' einer Ressource der Kategorie \'[0]\'.'
            }),
            level: 'danger',
            params: [],
            hidden: false
        };
        this.msgs[M.IMPORT_VALIDATION_ERROR_INVALID_LITERATURE_VALUES] = {
            content: i18n({
                id: 'messages.import.validation.error.invalidLiteratureValues',
                value: 'Ungültige Literaturverweise in den folgenden Feldern einer Ressource der Kategorie \'[0]\': [1].'
            }),
            level: 'danger',
            params: [],
            hidden: false
        };
        this.msgs[M.IMPORT_VALIDATION_ERROR_INVALID_DROPDOWN_RANGE_VALUES] = {
            content: i18n({
                id: 'messages.import.validation.error.invalidDropdownValues',
                value: 'Ungültiger Bereich im Feld \'[1]\' einer Ressource der Kategorie \'[0]\'.'
            }),
            level: 'danger',
            params: [],
            hidden: false
        };
        this.msgs[M.IMPORT_VALIDATION_ERROR_INVALID_MAP_LAYER_RELATION_TARGETS] = {
            content: i18n({
                id: 'messages.import.validation.error.invalidMapLayerRelationTargets',
                value: 'Die Relation \'hasDefaultMapLayer\' einer Ressource der Kategorie \'[0]\' verweist auf eine oder mehrere Ressourcen, auf die nicht in der Relation \'hasMapLayer\' verwiesen wird.'
            }),
            level: 'danger',
            params: [],
            hidden: false
        };
        this.msgs[M.IMPORT_VALIDATION_ERROR_END_DATE_BEFORE_BEGINNING_DATE] = {
            content: i18n({
                id: 'messages.import.validation.error.endDateBeforeBeginningDate',
                value: 'Das Enddatum einer Ressource der Kategorie \'[0]\' liegt vor dem Startdatum.'
            }),
            level: 'danger',
            params: [],
            hidden: false
        };
        this.msgs[M.IMPORT_VALIDATION_MISSING_PROPERTY] = {
            content: i18n({
                id: 'messages.import.validation.error.missingProperty',
                value: 'Eigenschaft(en) einer Ressource der Kategorie \'[0]\' müssen vorhanden sein: \'[1]\'.'
            }),
            level: 'danger',
            params: [],
            hidden: false
        };
        this.msgs[M.IMPORT_VALIDATION_ERROR_MAX_CHARACTERS_EXCEEDED] = {
            content: i18n({
                id: 'messages.import.validation.error.maxCharactersExceeded',
                value: 'Im Feld \'[1]\' der Kategorie \'[0]\' dürfen maximal [2] Zeichen eingetragen werden.'
            }),
            level: 'danger',
            params: [],
            hidden: false
        };
        this.msgs[M.IMPORT_ERROR_CATEGORY_NOT_ALLOWED] = {
            content: i18n({
                id: 'messages.import.error.categoryNotAllowed',
                value: 'Ressourcen der folgenden Kategorie sind beim Import nicht erlaubt: \'[0]\''
            }),
            level: 'danger',
            params: ['?'],
            hidden: false
        };
        this.msgs[M.IMPORT_ERROR_CATEGORY_ONLY_ALLOWED_ON_UPDATE] = {
            content: i18n({
                id: 'messages.import.error.categoryOnlyAllowedOnUpdate',
                value: 'Ressourcen der folgenden Kategorie sind beim Import nur im Ergänzungsmodus erlaubt: \'[0]\''
            }),
            level: 'danger',
            params: ['?'],
            hidden: false
        };
        this.msgs[M.IMPORT_MUST_BE_IN_SAME_OPERATION] = {
            content: i18n({
                id: 'messages.import.error.mustBeInSameOperation',
                value: 'Ressourcen liegen in unterschiedlichen Maßnahmen: \'[0]\', \'[1]\''
            }),
            level: 'danger',
            params: ['?', '?'],
            hidden: false
        };
        this.msgs[M.IMPORT_ERROR_CATEGORY_CANNOT_BE_CHANGED] = {
            content: i18n({
                id: 'messages.import.error.categoryCannotBeChanged',
                value: 'Die Kategorie kann beim Import nicht geändert werden. Betroffen ist: \'[0]\''
            }),
            level: 'danger',
            params: ['?'],
            hidden: false
        };
        this.msgs[M.IMPORT_ERROR_EMPTY_SLOTS_IN_ARRAYS_FORBIDDEN] = {
            content: i18n({
                id: 'messages.import.error.emptySlotsInArraysForbidden',
                value: 'Leere Array-Felder sind nicht erlaubt. Betroffen ist: \'[0]\''
            }),
            level: 'danger',
            params: ['?'],
            hidden: false
        };
        this.msgs[M.IMPORT_ERROR_ARRAY_OF_HETEROGENEOUS_TYPES] = {
            content: i18n({
                id: 'messages.import.error.arrayOfHeterogeneousTypes',
                value: 'Arrays müssen konsistent Felder vom gleichen Typ beinhalten. Betroffen ist: \'[0]\''
            }),
            level: 'danger',
            params: ['?'],
            hidden: false
        };
        this.msgs[M.IMPORT_ERROR_MUST_NOT_BE_EMPTY_STRING] = {
            content: i18n({
                id: 'messages.import.error.mustNotBeEmptyString',
                value: 'Leere Strings sind nicht als Werte in Importdatensätzen erlaubt.'
            }),
            level: 'danger',
            params: ['?', '?'],
            hidden: false
        };
        this.msgs[M.IMPORT_ERROR_INVALID_FILE_FORMAT] = {
            content: i18n({
                id: 'messages.import.error.invalidFileFormat',
                value: 'Die ausgewählte Datei kann nicht importiert werden. Gültige Dateiendungen sind: [0]'
            }),
            level: 'danger',
            params: [''],
            hidden: false
        };
        this.msgs[M.IMPORT_ERROR_EMPTY_OBJECT_IN_RESOURCE] = {
            content: i18n({
                id: 'messages.import.error.emptyObjectInResource',
                value: 'Leere Objekte sind in Importdatensätzen nicht erlaubt (Ausnahme: Feld "relations").'
            }),
            level: 'danger',
            params: [],
            hidden: false
        };
        this.msgs[M.IMPORT_CATALOG_ERROR_CONNECTED_TYPE_DELETED] = {
            content: i18n({
                id: 'messages.import.catalog.error.connected_type_deleted',
                value: 'Update eines bestehenden Katalogs abgebrochen. Die bestehende Version enthält mit Funden verknüpfte Typen, die in der Import-Datei nicht mehr vorhanden sind. Bitte entfernen Sie die Verknüpfungen und starten den Import anschließend erneut. Betroffene Typen: [0]'
            }),
            level: 'danger',
            params: [],
            hidden: false
        };
        this.msgs[M.IMPORT_CATALOG_ERROR_IDENTIFIER_CLASH] = {
            content: i18n({
                id: 'messages.import.catalog.error.identifier_clash',
                value: 'Katalogimport abgebrochen. Identifier-Konflikte mit Dokumenten der Datenbank. Identifier: [0]'
            }),
            level: 'danger',
            params: [],
            hidden: false
        };
        this.msgs[M.IMPORT_CATALOG_ERROR_OWNER_MUST_NOT_REIMPORT_CATALOG] = {
            content: i18n({
                id: 'messages.import.catalog.error.owner_must_not_reimport_catalog',
                value: 'Katalogimport abgebrochen. Löschen Sie den Katalog \'[0]\', bevor Sie ihn erneut importieren.'
            }),
            level: 'danger',
            params: [],
            hidden: false
        };
        this.msgs[M.IMPORT_CATALOG_ERROR_OWNER_MUST_NOT_OVERWRITE_EXISTING_IMAGES] = {
            content: i18n({
                id: 'messages.import.catalog.error.owner_must_not_overwrite_existing_images',
                value: 'Katalogimport abgebrochen. Importdatei beinhaltet Bilder, die bereits in der Datenbank vorhanden sind.'
            }),
            level: 'danger',
            params: [],
            hidden: false
        };
        this.msgs[M.IMPORT_CATALOG_ERROR_DIFFERENT_PROJECT_ENTRIES] = {
            content: i18n({
                id: 'messages.import.catalog.error.differentProjectEntries',
                value: 'Katalogimport abgebrochen. Alle zu importierenden Dokumente müssen den gleichen Projekt-Eintrag haben.'
            }),
            level: 'danger',
            params: [],
            hidden: false
        };
        this.msgs[M.IMPORT_CATALOG_ERROR_NO_OR_TOO_MANY_TYPE_CATALOG_DOCUMENTS] = {
            content: i18n({
                id: 'messages.import.catalog.error.noOrTooManyTypeCatalogDocuments',
                value: 'Katalogimport abgebrochen. Keine oder zu viele TypeCatalog-Dokumente.'
            }),
            level: 'danger',
            params: [],
            hidden: false
        };
        this.msgs[M.IMPORT_CATALOG_ERROR_INVALID_RELATIONS] = {
            content: i18n({
                id: 'messages.import.catalog.error.invalidRelations',
                value: 'Katalogimport abgebrochen. Ungültige Relationen.'
            }),
            level: 'danger',
            params: [],
            hidden: false
        };
        this.msgs[M.IMPORT_VALIDATION_ERROR_NO_RECORDEDIN] = {
            content: i18n({
                id: 'messages.import.validation.error.noRecordedIn',
                value: 'Fehlende Definition von \'Aufgenommen in Maßnahme\'. Eine Zuordnung muss vorgenommen werden.'
            }),
            level: 'danger',
            params: ['?'],
            hidden: false
        };
        this.msgs[M.IMPORT_VALIDATION_ERROR_NO_RECORDEDIN_TARGET] = {
            content: i18n({
                id: 'messages.import.validation.error.noRecordedInTarget',
                value: 'Fehlendes Ziel einer Relation vom Typ \'Aufgenommen in Maßnahme\'. Ziel-ID: [0].'
            }),
            level: 'danger',
            params: [],
            hidden: false
        };
        this.msgs[M.EXPORT_SUCCESS] = {
            content: i18n({
                id: 'messages.export.success',
                value: 'Die Exportdatei wurde erfolgreich erstellt.'
            }),
            level: 'success',
            params: [],
            hidden: false
        };
        this.msgs[M.EXPORT_ERROR_GENERIC] = {
            content: i18n({
                id: 'messages.export.error.generic',
                value: 'Beim Export ist ein Fehler aufgetreten.'
            }),
            level: 'danger',
            params: [],
            hidden: false
        };
        this.msgs[M.EXPORT_GEOJSON_ERROR_WRITE] = {
            content: i18n({
                id: 'messages.export.geojson.error.write',
                value: 'Beim Export ist ein Fehler aufgetreten: Die GeoJSON-Datei konnte nicht geschrieben werden.'
            }),
            level: 'danger',
            params: [],
            hidden: false
        };
        this.msgs[M.EXPORT_CATALOG_IMAGES_NOT_EXCLUSIVE_TO_CATALOG] = {
            content: i18n({
                id: 'messages.export.error.catalog.images-not-exclusive-to-catalog',
                value: 'Beim Export ist ein Fehler aufgetreten: Bilder des Kataloges dürfen nicht gleichzeitig mit anderen Ressourcen verbunden sein. Bilder: [0]'
            }),
            level: 'danger',
            params: [],
            hidden: false
        };
        this.msgs[M.EXPORT_CATALOG_FAILED_TO_COPY_IMAGES] = {
            content: i18n({
                id: 'messages.export.error.catalog.failedToCopyImages',
                value: 'Beim Export ist ein Fehler aufgetreten: Die mit dem Katalog verknüpften Bilder konnten nicht exportiert werden. Bitte prüfen Sie, ob die Original-Bilddateien im Bilderverzeichnis vorhanden sind.'
            }),
            level: 'danger',
            params: [],
            hidden: false
        };
        this.msgs[M.EXPORT_SHAPEFILE_ERROR_TEMP_FOLDER_CREATION] = {
            content: i18n({
                id: 'messages.export.shapefile.error.tempFolderCreation',
                value: 'Beim Export ist ein Fehler aufgetreten: Das temporäre Verzeichnis [0] konnte nicht angelegt werden.'
            }),
            level: 'danger',
            params: [],
            hidden: false
        };
        this.msgs[M.EXPORT_SHAPEFILE_ERROR_ZIP_FILE_CREATION] = {
            content: i18n({
                id: 'messages.export.shapefile.error.zipFileCreation',
                value: 'Beim Export ist ein Fehler aufgetreten: Die ZIP-Datei [0] konnte nicht erstellt werden.'
            }),
            level: 'danger',
            params: [],
            hidden: false
        };
        this.msgs[M.EXPORT_SHAPEFILE_ERROR_WRITE] = {
            content: i18n({
                id: 'messages.export.shapefile.error.write',
                value: 'Beim Export ist ein Fehler aufgetreten: Das Shapefile konnte nicht geschrieben werden.'
            }),
            level: 'danger',
            params: [],
            hidden: false
        };
        this.msgs[M.EXPORT_SHAPEFILE_ERROR_GET_RESOURCES] = {
            content: i18n({
                id: 'messages.export.shapefile.error.getResources',
                value: 'Beim Export ist ein Fehler aufgetreten: Die Ressourcen konnten nicht aus der Datenbank gelesen werden.'
            }),
            level: 'danger',
            params: [],
            hidden: false
        };
        this.msgs[M.EXPORT_CSV_WARNING_INVALID_FIELD_DATA_SINGLE] = {
            content: i18n({
                id: 'messages.export.csv.warning.invalidFieldData.single',
                value: 'Das Feld "[0]" der Ressoure [1] wurde beim Export ignoriert, weil die eingetragenen Felddaten nicht dem konfigurierten Eingabetyp entsprechen.'
            }),
            level: 'warning',
            params: [],
            hidden: false
        };
        this.msgs[M.EXPORT_CSV_WARNING_INVALID_FIELD_DATA_MULTIPLE] = {
            content: i18n({
                id: 'messages.export.csv.warning.invalidFieldData.multiple',
                value: 'Mehrere Felder wurden beim Export ignoriert, weil die eingetragenen Felddaten nicht dem konfigurierten Eingabetyp entsprechen (vollständige Auflistung unten).'
            }),
            level: 'warning',
            params: [],
            hidden: false
        };
        this.msgs[M.DATASTORE_ERROR_NOT_FOUND] = {
            content: i18n({
                id: 'messages.datastore.error.notFound',
                value: 'Die Ressource konnte nicht gefunden werden.'
            }),
            level: 'danger',
            params: [],
            hidden: false
        };
        this.msgs[M.DOCEDIT_WARNING_SAVE_CONFLICT] = {
            content: i18n({
                id: 'messages.docedit.warning.saveConflict',
                value: 'Beim Speichern der Ressource ist ein Konflikt aufgetreten.'
            }),
            level: 'warning',
            params: [],
            hidden: false
        };
        this.msgs[M.DOCEDIT_WARNING_CATEGORY_CHANGE_FIELDS] = {
            content: i18n({
                id: 'messages.docedit.warning.categoryChange.fields',
                value: 'Bitte beachten Sie, dass die Daten der folgenden Felder beim Speichern verloren gehen: [0]'
            }),
            level: 'warning',
            params: [''],
            hidden: false
        };
        this.msgs[M.DOCEDIT_WARNING_CATEGORY_CHANGE_RELATIONS] = {
            content: i18n({
                id: 'messages.docedit.warning.categoryChange.relations',
                value: 'Bitte beachten Sie, dass die Relationen der folgenden Relationstypen beim Speichern verloren gehen: [0]'
            }),
            level: 'warning',
            params: [''],
            hidden: false
        };
        this.msgs[M.DOCEDIT_ERROR_SAVE] = {
            content: i18n({
                id: 'messages.docedit.error.save',
                value: 'Beim Speichern der Ressource ist ein Fehler aufgetreten.'
            }),
            level: 'danger',
            params: [],
            hidden: false
        };
        this.msgs[M.DOCEDIT_ERROR_DELETE] = {
            content: i18n({
                id: 'messages.docedit.error.delete',
                value: 'Beim Löschen der Ressource ist ein Fehler aufgetreten.'
            }),
            level: 'danger',
            params: [],
            hidden: false
        };
        this.msgs[M.DOCEDIT_ERROR_RESOLVE_CONFLICT] = {
            content: i18n({
                id: 'messages.docedit.error.resolveConflict',
                value: 'Der Konflikt konnte nicht gelöst werden. Bitte prüfen Sie, ob der Konflikt bereits von einem anderen Benutzer bzw. einer anderen Benutzerin gelöst wurde.'
            }),
            level: 'danger',
            params: [],
            hidden: false
        };
        this.msgs[M.DOCEDIT_VALIDATION_ERROR_INVALID_NUMERIC_VALUE] = {
            content: i18n({
                id: 'messages.docedit.validation.error.invalidNumericValue',
                value: 'Bitte tragen Sie im Feld \'[1]\' einen gültigen Zahlenwert ein.'
            }),
            level: 'danger',
            params: [],
            hidden: false
        };
        this.msgs[M.DOCEDIT_VALIDATION_ERROR_INVALID_NUMERIC_VALUES] = {
            content: i18n({
                id: 'messages.docedit.validation.error.invalidNumericValues',
                value: 'Bitte tragen Sie in den folgenden Feldern gültige Zahlenwerte ein: [1].'
            }),
            level: 'danger',
            params: [],
            hidden: false
        };
        this.msgs[M.DOCEDIT_VALIDATION_ERROR_INVALID_URL] = {
            content: i18n({
                id: 'messages.docedit.validation.error.invalidUrl',
                value: 'Bitte tragen Sie im Feld \'[1]\' eine gültige URL ein.'
            }),
            level: 'danger',
            params: [],
            hidden: false
        };
        this.msgs[M.DOCEDIT_VALIDATION_ERROR_INVALID_URLS] = {
            content: i18n({
                id: 'messages.docedit.validation.error.invalidUrls',
                value: 'Bitte tragen Sie in den folgenden Feldern gültige URLs ein: [1].'
            }),
            level: 'danger',
            params: [],
            hidden: false
        };
        this.msgs[M.DOCEDIT_VALIDATION_ERROR_INVALID_DATING_VALUE] = {
            content: i18n({
                id: 'messages.docedit.validation.error.invalidDatingValue',
                value: 'Bitte tragen Sie im Feld \'[1]\' eine gültige Datierung ein.'
            }),
            level: 'danger',
            params: [],
            hidden: false
        };
        this.msgs[M.DOCEDIT_VALIDATION_ERROR_INVALID_DATING_VALUES] = {
            content: i18n({
                id: 'messages.docedit.validation.error.invalidDatingValues',
                value: 'Bitte tragen Sie in den folgenden Feldern gültige Datierungen ein: [1].'
            }),
            level: 'danger',
            params: [],
            hidden: false
        };
        this.msgs[M.DOCEDIT_VALIDATION_ERROR_INVALID_DIMENSION_VALUE] = {
            content: i18n({
                id: 'messages.docedit.validation.error.invalidDimensionValue',
                value: 'Bitte tragen Sie im Feld \'[1]\' eine gültige Maßangabe ein.'
            }),
            level: 'danger',
            params: [],
            hidden: false
        };
        this.msgs[M.DOCEDIT_VALIDATION_ERROR_INVALID_DIMENSION_VALUES] = {
            content: i18n({
                id: 'messages.docedit.validation.error.invalidDimensionValues',
                value: 'Bitte tragen Sie in den folgenden Feldern gültige Maßangaben ein: [1].'
            }),
            level: 'danger',
            params: [],
            hidden: false
        };
        this.msgs[M.DOCEDIT_VALIDATION_ERROR_INVALID_DECIMAL_SEPARATOR] = {
            content: i18n({
                id: 'messages.docedit.validation.error.invalidDecimalSeparator',
                value: 'Bitte verwenden Sie im Feld \'[1]\' den Punkt als Dezimaltrennzeichen.'
            }),
            level: 'danger',
            params: [],
            hidden: false
        };
        this.msgs[M.DOCEDIT_VALIDATION_ERROR_INVALID_DECIMAL_SEPARATORS] = {
            content: i18n({
                id: 'messages.docedit.validation.error.invalidDecimalSeparators',
                value: 'Bitte verwenden Sie in den folgenden Feldern den Punkt als Dezimaltrennzeichen: [1].'
            }),
            level: 'danger',
            params: [],
            hidden: false
        };
        this.msgs[M.DOCEDIT_VALIDATION_ERROR_MISSING_PROPERTY] = {
            content: i18n({
                id: 'messages.docedit.validation.error.missingProperty',
                value: 'Bitte füllen Sie das Feld \'[1]\' aus.'
            }),
            level: 'danger',
            params: [],
            hidden: false
        };
        this.msgs[M.DOCEDIT_VALIDATION_ERROR_MAX_CHARACTERS_EXCEEDED] = {
            content: i18n({
                id: 'messages.docedit.validation.error.maxCharactersExceeded',
                value: 'Im Feld \'[1]\' dürfen maximal [2] Zeichen eingetragen werden.'
            }),
            level: 'danger',
            params: [],
            hidden: false
        };
        this.msgs[M.DOCEDIT_VALIDATION_ERROR_NO_RECORDEDIN] = {
            content: i18n({
                id: 'messages.docedit.validation.error.noRecordedIn',
                value: 'Bitte wählen Sie eine Zielressource für die Relation \'Aufgenommen in Maßnahme\' aus.'
            }),
            level: 'danger',
            params: [],
            hidden: false
        };
        this.msgs[M.DOCEDIT_VALIDATION_ERROR_NO_RECORDEDIN_TARGET] = {
            content: i18n({
                id: 'messages.docedit.validation.error.noRecordedInTarget',
                value: 'Die Zielressource [0] der Relation \'Aufgenommen in Maßnahme\' konnte nicht gefunden werden.'
            }),
            level: 'danger',
            params: [],
            hidden: false
        };
        this.msgs[M.DOCEDIT_VALIDATION_ERROR_END_DATE_BEFORE_BEGINNING_DATE] = {
            content: i18n({
                id: 'messages.docedit.validation.error.endDateBeforeBeginningDate',
                value: 'Das angegebene Enddatum liegt vor dem Startdatum. Bitte prüfen Sie die eingetragenen Daten.'
            }),
            level: 'danger',
            params: [],
            hidden: false
        };
        this.msgs[M.IMAGES_SUCCESS_IMAGES_UPLOADED] = {
            content: i18n({
                id: 'messages.images.success.imagesUploaded',
                value: '[0] Bilder wurden erfolgreich importiert.'
            }),
            level: 'success',
            params: [],
            hidden: false
        };
        this.msgs[M.IMAGES_SUCCESS_WLD_FILE_UPLOADED] = {
            content: i18n({
                id: 'messages.images.success.wldFileUploaded',
                value: 'Zu einem Bild wurden Georeferenzdaten aus einem World-File importiert.'
            }),
            level: 'success',
            params: [],
            hidden: false
        };
        this.msgs[M.IMAGES_SUCCESS_WLD_FILES_UPLOADED] = {
            content: i18n({
                id: 'messages.images.success.wldFilesUploaded',
                value: 'Zu [0] Bildern wurden Georeferenzdaten aus World-Files importiert.'
            }),
            level: 'success',
            params: [],
            hidden: false
        };
        this.msgs[M.IMAGES_ERROR_FILEREADER] = {
            content: i18n({
                id: 'messages.images.error.fileReader',
                value: 'Datei \'[0]\' konnte nicht vom lokalen Dateisystem gelesen werden.'
            }),
            level: 'danger',
            params: [],
            hidden: false
        };
        this.msgs[M.IMAGES_ERROR_DUPLICATE_FILENAME] = {
            content: i18n({
                id: 'messages.images.error.duplicateFilename',
                value: 'Die Bilddatei \'[0]\' konnte nicht hinzugefügt werden. Ein Bild mit dem gleichen Dateinamen existiert bereits.'
            }),
            level: 'danger',
            params: [],
            hidden: false
        };
        this.msgs[M.IMAGES_ERROR_DUPLICATE_FILENAMES] = {
            content: i18n({
                id: 'messages.images.error.duplicateFilenames',
                value: 'Die folgenden Bilddateien konnten nicht hinzugefügt werden, da Bilder mit identischen Dateinamen bereits existieren: [0]'
            }),
            level: 'danger',
            params: [],
            hidden: false
        };
        this.msgs[M.IMAGES_ERROR_UNMATCHED_WLD_FILES] = {
            content: i18n({
                id: 'messages.images.error.unmachtedWldFiles',
                value: 'Die folgenden World-Files konnten nicht geladen werden, da die entsprechenden Bilddateien nicht gefunden wurden: [0]'
            }),
            level: 'danger',
            params: [],
            hidden: false
        };
        this.msgs[M.IMAGESTORE_ERROR_INVALID_PATH] = {
            content: i18n({
                id: 'messages.imagestore.error.invalidPath',
                value: 'Das Bilderverzeichnis konnte nicht gefunden werden. Der Verzeichnispfad \'[0]\' ist ungültig.'
            }),
            level: 'warning',
            params: [],
            hidden: false
        };
        this.msgs[M.IMAGESTORE_ERROR_INVALID_PATH_READ] = {
            content: i18n({
                id: 'messages.imagestore.error.invalidPath.read',
                value: 'Es können keine Dateien aus dem Bilderverzeichnis gelesen werden. Bitte geben Sie einen gültigen Verzeichnispfad in den Einstellungen an.'
            }),
            level: 'warning',
            params: [],
            hidden: false
        };
        this.msgs[M.IMAGESTORE_ERROR_INVALID_PATH_WRITE] = {
            content: i18n({
                id: 'messages.imagestore.error.invalidPath.write',
                value: 'Es können keine Dateien im Bilderverzeichnis gespeichert werden. Bitte geben Sie einen gültigen Verzeichnispfad in den Einstellungen an.'
            }),
            level: 'danger',
            params: [],
            hidden: false
        };
        this.msgs[M.IMAGESTORE_ERROR_INVALID_PATH_DELETE] = {
            content: i18n({
                id: 'messages.imagestore.error.invalidPath.delete',
                value: 'Es können keine Dateien aus dem Bilderverzeichnis gelöscht werden. Bitte geben Sie einen gültigen Verzeichnispfad in den Einstellungen an.'
            }),
            level: 'danger',
            params: [],
            hidden: false
        };
        this.msgs[M.IMAGESTORE_ERROR_UPLOAD] = {
            content: i18n({
                id: 'messages.imagestore.error.upload',
                value: 'Die Datei \'[0]\' konnte nicht gelesen werden.'
            }),
            level: 'danger',
            params: [],
            hidden: false
        };
        this.msgs[M.IMAGESTORE_ERROR_UPLOAD_PIXEL_LIMIT_EXCEEDED] = {
            content: i18n({
                id: 'messages.imagestore.error.upload.pixelLimitExceeded',
                value: 'Die Datei \'[0]\' konnte nicht gelesen werden: Die maximale Pixelanzahl von [1] wurde überschritten. Bitte verringern Sie die Auflösung des Bildes und versuchen Sie es erneut.'
            }),
            level: 'danger',
            params: [],
            hidden: false
        };
        this.msgs[M.IMAGESTORE_ERROR_WRITE] = {
            content: i18n({
                id: 'messages.imagestore.error.write',
                value: 'Die Datei \'[0]\' konnte nicht im Bilderverzeichnis gespeichert werden.'
            }),
            level: 'danger',
            params: [],
            hidden: false
        };
        this.msgs[M.IMAGESTORE_ERROR_DELETE] = {
            content: i18n({
                id: 'messages.imagestore.error.delete',
                value: 'Fehler beim Löschen des Bilds \'[0]\'.'
            }),
            level: 'danger',
            params: [],
            hidden: false
        };
        this.msgs[M.IMAGESTORE_ERROR_INVALID_WORLDFILE] = {
            content: i18n({
                id: 'messages.imagestore.error.invalidWorldfile',
                value: 'Die Datei \'[0]\' ist kein gültiges World-File.'
            }),
            level: 'danger',
            params: [],
            hidden: false
        };
        this.msgs[M.IMAGESTORE_DROP_AREA_ERROR_UNSUPPORTED_EXTENSIONS] = {
            content: i18n({
                id: 'messages.imagestore.dropArea.error.unsupportedExtensions',
                value: 'Dateien mit nicht unterstützten Formaten ([0]) werden ignoriert. Gültige Dateiendungen sind: [1]'
            }),
            level: 'danger',
            params: [],
            hidden: false
        };
        this.msgs[M.REMOTEIMAGESTORE_WARNING_LARGE_FILE_UPLOAD_BLOCKED_BY_PEER] = {
            content: i18n({
                id: 'remoteimagestore.warning.largeFileUploadBlockedByPeer',
                value: 'Ihr aktuelles Synchronisationsziel blockiert den Empfang von Originalbildern. Sie können entweder in Ihren Synchronisations-Einstellungen das Hochladen von Originalbildern deaktivieren, oder Sie sorgen beim Synchronisationsziel dafür, dass die Option zur Annahme von Originalbildern angepasst wird.'
            }),
            level: 'warning',
            params: [],
            hidden: false
        };
        this.msgs[M.RESOURCES_SUCCESS_IMAGES_UPLOADED] = {
            content: i18n({
                id: 'messages.resources.success.imagesUploaded',
                value: '[0] Bilder wurden erfolgreich importiert und mit der Ressource [1] verknüpft.'
            }),
            level: 'success',
            params: [],
            hidden: false
        };
        this.msgs[M.RESOURCES_WARNING_PROJECT_IDENTIFIER_NOT_SAME] = {
            content: i18n({
                id: 'messages.resources.warning.projectIdentifierNotSame',
                value: 'Die Projektkennungen stimmen nicht miteinander überein. Das Projekt wird nicht gelöscht.'
            }),
            level: 'warning',
            params: [],
            hidden: false
        };
        this.msgs[M.RESOURCES_ERROR_CATEGORY_NOT_FOUND] = {
            content: i18n({
                id: 'messages.resources.error.categoryNotFound',
                value: 'Die Kategoriedefinition für \'[0]\' fehlt in der Datei Fields.json.'
            }),
            level: 'danger',
            params: [],
            hidden: false
        };
        this.msgs[M.RESOURCES_ERROR_ONE_PROJECT_MUST_EXIST] = {
            content: i18n({
                id: 'messages.resources.error.oneProjectMustExist',
                value: 'Das Projekt kann nicht gelöscht werden. Es muss mindestens ein Projekt vorhanden sein.'
            }),
            level: 'danger',
            params: [],
            hidden: false
        };
        this.msgs[M.RESOURCES_ERROR_RESOURCE_DELETED] = {
            content: i18n({
                id: 'messages.resources.error.resourceDeleted',
                value: 'Die Ressource \'[0]\' kann nicht aufgerufen werden, da sie in der Zwischenzeit von einem anderen Benutzer bzw. einer anderen Benutzerin gelöscht wurde.'
            }),
            level: 'danger',
            params: [],
            hidden: false
        };
        this.msgs[M.RESOURCES_ERROR_UNKNOWN_RESOURCE_DELETED] = {
            content: i18n({
                id: 'messages.resources.error.unknownResourceDeleted',
                value: 'Die Ressource kann nicht aufgerufen werden, da sie in der Zwischenzeit von einem anderen Benutzer bzw. einer anderen Benutzerin gelöscht wurde.'
            }),
            level: 'danger',
            params: [],
            hidden: false
        };
        this.msgs[M.RESOURCES_ERROR_RESOURCE_MISSING_DURING_SYNCING] = {
            content: i18n({
                id: 'messages.resources.error.resourceMissingDuringSyncing',
                value: 'Die Ressource kann nicht aufgerufen werden. Bitte warten Sie, bis die Synchronisierung abgeschlossen ist, und versuchen es anschließend erneut.'
            }),
            level: 'danger',
            params: [],
            hidden: false
        };
        this.msgs[M.RESOURCES_ERROR_CANNOT_MOVE_WITH_SAME_OPERATION_RELATIONS] = {
            content: i18n({
                id: 'messages.resources.error.cannotMoveWithSameOperationRelations',
                value: 'Die Ressource [0] kann nicht in eine andere Maßnahme verschoben werden, da Relationen gesetzt sind, die nur zwischen Ressourcen innerhalb der gleichen Maßnahme gesetzt werden dürfen. Entfernen Sie die Relationen und versuchen Sie es anschließend erneut.'
            }),
            level: 'danger',
            params: [],
            hidden: false
        };
        this.msgs[M.RESOURCES_ERROR_CANNOT_MOVE_CHILDREN] = {
            content: i18n({
                id: 'messages.resources.error.cannotMoveChildren',
                value: 'Die Ressource [0] kann nicht verschoben werden, weil eine oder mehrere der ihr untergeordneten Ressourcen nicht innerhalb der Zielmaßnahme liegen dürfen.'
            }),
            level: 'danger',
            params: [],
            hidden: false
        };
        this.msgs[M.RESOURCES_ERROR_PARENT_RESOURCE_UNKNOWN_CATEGORY] = {
            content: i18n({
                id: 'messages.resources.error.parentResourceUnknownCategory',
                value: 'Die Ressource kann nicht aufgerufen werden, da sie einer Ressource der nicht konfigurierten Kategorie "[0]" untergeordnet ist. Fügen Sie die Kategorie der Projektkonfiguration hinzu, um wieder auf die Ressource zugreifen zu können.'
            }),
            level: 'danger',
            params: [],
            hidden: false
        };
        this.msgs[M.RESOURCES_ERROR_PARENT_OPERATION_UNKNOWN_CATEGORY] = {
            content: i18n({
                id: 'messages.resources.error.parentOperationUnknownCategory',
                value: 'Die Ressource kann nicht aufgerufen werden, da sie einer Maßnahme der nicht konfigurierten Kategorie "[0]" angehört. Fügen Sie die Kategorie der Projektkonfiguration hinzu, um wieder auf die Ressource zugreifen zu können.'
            }),
            level: 'danger',
            params: [],
            hidden: false
        };
        this.msgs[M.RESOURCES_ERROR_PARENT_RESOURCE_DELETED] = {
            content: i18n({
                id: 'messages.resources.error.parentResourceDeleted',
                value: 'Die Ressource kann nicht angelegt werden, da die übergeordnete Ressource in der Zwischenzeit von einem anderen Benutzer bzw. einer anderen Benutzerin gelöscht wurde.'
            }),
            level: 'danger',
            params: [],
            hidden: false
        };
        this.msgs[M.PROJECT_CREATION_ERROR_MISSING_IDENTIFIER] = {
            content: i18n({
                id: 'messages.projectCreation.error.missingIdentifier',
                value: 'Bitte geben Sie eine Kennung für das neue Projekt ein.'
            }),
            level: 'danger',
            params: [],
            hidden: false
        };
        this.msgs[M.PROJECT_CREATION_ERROR_IDENTIFIER_EXISTS] = {
            content: i18n({
                id: 'messages.projectCreation.error.identifierExists',
                value: 'Ein Projekt mit der Kennung \'[0]\' existiert bereits.'
            }),
            level: 'danger',
            params: [],
            hidden: false
        };
        this.msgs[M.PROJECT_CREATION_ERROR_IDENTIFIER_LENGTH] = {
            content: i18n({
                id: 'messages.projectCreation.error.identifierLength',
                value: 'Die angegebene Projektkennung ist um [0] Zeichen zu lang.'
            }),
            level: 'danger',
            params: [],
            hidden: false
        };
        this.msgs[M.PROJECT_CREATION_ERROR_IDENTIFIER_CHARACTERS] = {
            content: i18n({
                id: 'messages.projectCreation.error.identifierCharacters',
                value: 'Die angegebene Projektkennung enthält nicht erlaubte Zeichen.'
            }),
            level: 'danger',
            params: [],
            hidden: false
        };
        this.msgs[M.PROJECT_CREATION_ERROR_IDENTIFIER_STARTING_CHARACTER] = {
            content: i18n({
                id: 'messages.projectCreation.error.identifierStartingCharacter',
                value: 'Die Projektkennung muss mit einem Kleinbuchstaben beginnen.'
            }),
            level: 'danger',
            params: [],
            hidden: false
        };
        this.msgs[M.PROJECT_CREATION_ERROR_NAME_LENGTH] = {
            content: i18n({
                id: 'messages.projectCreation.error.nameLength',
                value: 'Der angegebene Projektname für die Sprache [0] ist um [1] Zeichen zu lang.'
            }),
            level: 'danger',
            params: [],
            hidden: false
        };
        this.msgs[M.CONFIGURATION_ERROR_NO_VALUES_IN_VALUELIST] = {
            content: i18n({
                id: 'messages.configuration.error.noValuesInValuelist',
                value: 'Bitte tragen Sie mindestens einen Wert ein.'
            }),
            level: 'danger',
            params: [],
            hidden: false
        };
        this.msgs[M.CONFIGURATION_ERROR_NO_VALUELIST] = {
            content: i18n({
                id: 'messages.configuration.error.noValuelist',
                value: 'Bitte wählen Sie eine Werteliste aus oder wechseln Sie den Eingabetyp des Feldes.'
            }),
            level: 'danger',
            params: [],
            hidden: false
        };
        this.msgs[M.CONFIGURATION_ERROR_NO_SUBFIELDS] = {
            content: i18n({
                id: 'messages.configuration.error.noSubfields',
                value: 'Bitte legen Sie mindestens zwei Unterfelder an oder wechseln Sie den Eingabetyp des Feldes.'
            }),
            level: 'danger',
            params: [],
            hidden: false
        };
        this.msgs[M.CONFIGURATION_ERROR_SUBFIELD_CONDITION_VIOLATION_VALUELISTS] = {
            content: i18n({
                id: 'messages.configuration.error.subfieldConditionViolation.valuelists',
                value: 'Die Werteliste dieses Unterfeldes kann nicht entfernt oder ausgetauscht werden, da es als Bedingungsfeld für das Unterfeld "[0]" konfiguriert wurde.'
            }),
            level: 'danger',
            params: [],
            hidden: false
        };
        this.msgs[M.CONFIGURATION_ERROR_SUBFIELD_CONDITION_VIOLATION_INPUT_TYPE] = {
            content: i18n({
                id: 'messages.configuration.error.subfieldConditionViolation.inputType',
                value: 'Der Eingabetyp dieses Unterfeldes kann nicht geändert werden, da es als Bedingungsfeld für das Unterfeld "[0]" konfiguriert wurde.'
            }),
            level: 'danger',
            params: [],
            hidden: false
        };
        this.msgs[M.CONFIGURATION_ERROR_VALUE_USED_IN_SUBFIELD_CONDITION] = {
            content: i18n({
                id: 'messages.configuration.error.valueUsedInSubfieldCondition',
                value: 'Der Wert "[0]" kann nicht gelöscht werden, solange er als Bedingungswert für das Unterfeld "[1]" des Feldes "[2]" von Kategorie "[3]" konfiguriert ist.'
            }),
            level: 'danger',
            params: [],
            hidden: false
        };
        this.msgs[M.CONFIGURATION_ERROR_INVALID_REFERENCE] = {
            content: i18n({
                id: 'messages.configuration.error.invalidReference',
                value: '"[0]" ist keine gültige URL. Bitte geben Sie als Verweise ausschließlich URLs an.'
            }),
            level: 'danger',
            params: [],
            hidden: false
        };
        this.msgs[M.CONFIGURATION_ERROR_IMPORT_FAILURE] = {
            content: i18n({
                id: 'messages.configuration.error.importFailure',
                value: 'Die Projektkonfiguration konnte nicht importiert werden.'
            }),
            level: 'danger',
            params: [],
            hidden: false
        };
        this.msgs[M.CONFIGURATION_ERROR_NO_PROJECT_LANGUAGES] = {
            content: i18n({
                id: 'messages.configuration.error.noProjectLanguages',
                value: 'Bitte wählen Sie mindestens eine Projektsprache aus.'
            }),
            level: 'danger',
            params: [],
            hidden: false
        };
    }
}
