import { Injectable } from '@angular/core';
import { MD } from './md';
import { MessageTemplate } from './message';


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
    public static APP_CONTROLLER_SUCCESS = 'app.appControllerSuccess';

    // Settings Package
    public static SETTINGS_SUCCESS = 'settings.success';
    public static SETTINGS_ERROR_MALFORMED_ADDRESS = 'settings.error.malformedAddress';
    public static SETTINGS_ERROR_MISSING_USERNAME = 'settings.error.missingUsername';

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
    public static IMPORT_PARSER_MISSING_IDENTIFIER = 'M.Import.ParserErrors.missingIdentifier';
    public static IMPORT_PARSER_ID_MUST_NOT_BE_SET = 'M.Import.ParserErrors.parsing.idnottobeset';
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
    public static IMPORT_VALIDATION_ERROR_INVALID_COMPOSITE_VALUE = 'M.Import.ValidationErrors.invalidCompositeValue';
    public static IMPORT_VALIDATION_ERROR_INVALID_COMPOSITE_VALUES = 'M.Import.ValidationErrors.invalidCompositeValues';
    public static IMPORT_VALIDATION_ERROR_INVALID_DROPDOWN_RANGE_VALUES = 'M.Import.ValidationErrors.invalidDropdownRangeValues';
    public static IMPORT_VALIDATION_ERROR_INVALID_MAP_LAYER_RELATION_TARGETS = 'M.Import.ValidationErrors.invalidMapLayerRelationTargets';
    public static IMPORT_VALIDATION_ERROR_MAX_CHARACTERS_EXCEEDED = 'M.Import.ValidationErrors.maxCharactersExceeded';
    public static IMPORT_VALIDATION_ERROR_END_DATE_BEFORE_BEGINNING_DATE = 'M.Import.ValidationErrors.endDateBeforeBeginningDate';
    public static IMPORT_VALIDATION_ERROR_RESOURCE_LIMIT_EXCEEDED = 'M.Import.ValidationErrors.resourceLimitExceeded';

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
    public static EXPORT_SHAPEFILE_ERROR_WRITE = 'export.shapefile.error.write';
    public static EXPORT_SHAPEFILE_ERROR_ZIP_FILE_CREATION = 'export.shapefile.error.zipFileCreation';
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
    public static RESOURCES_SUCCESS_STORAGE_PLACE_SAVED_SINGLE = 'resources.success.storagePlaceSaved.single';
    public static RESOURCES_SUCCESS_STORAGE_PLACE_SAVED_MULTIPLE = 'resources.success.storagePlaceSaved.multiple';
    public static RESOURCES_SUCCESS_GENERATED_QR_CODE_SAVED = 'resources.success.generatedQrCodeSaved';
    public static RESOURCES_SUCCESS_EXISTING_QR_CODE_SAVED = 'resources.success.existingQrCodeSaved';
    public static RESOURCES_SUCCESS_QR_CODE_DELETED = 'resources.success.qrCodeDeleted';
    public static RESOURCES_INFO_STORAGE_PLACE_ALREADY_SET_SINGLE = 'resources.info.storagePlaceAlreadySet.single';
    public static RESOURCES_INFO_STORAGE_PLACE_ALREADY_SET_MULTIPLE = 'resources.info.storagePlaceAlreadySet.multiple';
    public static RESOURCES_ERROR_NO_STORAGE_PLACE_CATEGORY = 'resources.error.noStoragePlaceCategory';
    public static RESOURCES_WARNING_PROJECT_IDENTIFIER_NOT_SAME = 'resources.error.projectIdentifierNotSame';
    public static RESOURCES_ERROR_ONE_PROJECT_MUST_EXIST = 'resources.error.oneProjectMustExist'; // TODO Rename
    public static RESOURCES_ERROR_RESOURCE_DELETED = 'resources.error.resourceDeleted';
    public static RESOURCES_ERROR_UNKNOWN_RESOURCE_DELETED = 'resources.error.unknownResourceDeleted';
    public static RESOURCES_ERROR_PARENT_RESOURCE_DELETED = 'resources.error.parentResourceDeleted';
    public static RESOURCES_ERROR_RESOURCE_MISSING_DURING_SYNCING = 'resources.error.resourceMissingDuringSyncing';
    public static RESOURCES_ERROR_CANNOT_MOVE_WITH_SAME_OPERATION_RELATIONS = 'resources.error.cannotMoveWithSameOperationRelations';
    public static RESOURCES_ERROR_CANNOT_MOVE_CHILDREN = 'resources.error.cannotMoveChildren';
    public static RESOURCES_ERROR_QR_CODE_SCANNING_FAILURE = 'resources.error.qrCodeScanningFailure';
    public static RESOURCES_ERROR_QR_CODE_RESOURCE_NOT_FOUND = 'resources.error.qrCodeResourceNotFound';
    public static RESOURCES_ERROR_QR_CODE_ALREADY_ASSIGNED = 'resources.error.qrCodeAlreadyAssigned';

    // Project identifier validation
    public static PROJECT_CREATION_ERROR_MISSING_IDENTIFIER = 'projectCreation.error.missingIdentifier';
    public static PROJECT_CREATION_ERROR_IDENTIFIER_LENGTH = 'projectCreation.error.identifierLength';
    public static PROJECT_CREATION_ERROR_IDENTIFIER_CHARACTERS = 'projectCreation.error.identifierCharacters';
    public static PROJECT_CREATION_ERROR_IDENTIFIER_EXISTS = 'projectCreation.error.identifierExists';
    public static PROJECT_CREATION_ERROR_IDENTIFIER_STARTING_CHARACTER = 'projectCreation.error.identifierStartingCharacter';
    public static PROJECT_CREATION_ERROR_NAME_LENGTH = 'projectCreation.error.nameLength';

    // Configuration Package
    public static CONFIGURATION_SUCCESS_IMPORT = 'configuration.success.import';
    public static CONFIGURATION_ERROR_NO_VALUES_IN_VALUELIST = 'configuration.error.noValuesInValuelist';
    public static CONFIGURATION_ERROR_NO_VALUELIST = 'configuration.error.noValuelist';
    public static CONFIGURATION_ERROR_NO_SUBFIELDS = 'configuration.error.noSubfields';
    public static CONFIGURATION_ERROR_SUBFIELD_CONDITION_VIOLATION_VALUELISTS = 'configuration.error.subfieldConditionViolation.valuelists';
    public static CONFIGURATION_ERROR_SUBFIELD_CONDITION_VIOLATION_INPUT_TYPE = 'configuration.error.subfieldConditionViolation.inputType';
    public static CONFIGURATION_ERROR_VALUE_USED_IN_SUBFIELD_CONDITION = 'configuration.error.valueUsedInSubfieldCondition';
    public static CONFIGURATION_ERROR_INVALID_REFERENCE = 'configuration.error.invalidReference';
    public static CONFIGURATION_ERROR_INVALID_RESOURCE_LIMIT_NOT_A_NUMBER = 'configuration.error.invalidResourceLimit.notANumber';
    public static CONFIGURATION_ERROR_INVALID_RESOURCE_LIMIT_TOO_LOW = 'configuration.error.invalidResourceLimit.tooLow';
    public static CONFIGURATION_ERROR_IMPORT_FAILURE = 'configuration.error.importFailure';
    public static CONFIGURATION_ERROR_IMPORT_UNSUPPORTED_VERSION = 'configuration.error.unsupportedVersion';
    public static CONFIGURATION_ERROR_NO_PROJECT_LANGUAGES = 'configuration.error.noProjectLanguages';
    public static CONFIGURATION_ERROR_NO_ALLOWED_TARGET_CATEGORIES = 'configuration.error.noAllowedTargetCategories';

    // Matrix Package
    public static MATRIX_ERROR_GENERIC = 'matrix.error.generic';

    public msgs : { [id: string]: MessageTemplate } = {};


    constructor() {

        super();

        this.msgs[M.IMPORT_ERROR_NOT_UPDATED] = {
            content: $localize `:@@messages.import.error.notupdated:Fehlgeschlagene Zuordnung per Bezeichner \'[0]\'. Ressource nicht vorhanden.`,
            level: 'danger'
        };
        this.msgs[M.MESSAGES_ERROR_UNKNOWN_MESSAGE] = {
            content: $localize `:@@messages.messages.error.unknownMessage:Ein unbekannter Fehler ist aufgetreten. Details können in der Developer Console eingesehen werden.`,
            level: 'danger'
        };
        this.msgs[M.PROJECT_CONFIGURATION_ERROR_GENERIC] = {
            content: $localize `:@@messages.configuration.error.generic:Fehler beim Auswerten eines Konfigurationsobjektes.`,
            level: 'danger'
        };
        this.msgs[M.CONFIG_READER_ERROR_INVALID_JSON] = {
            content: $localize `:@@messages.configReader.error.invalidJson:Fehler beim Parsen der Konfigurationsdatei \'[0]\': Das JSON ist nicht valide.`,
            level: 'danger'
        };
        this.msgs[M.ALL_ERROR_FIND] = {
            content: $localize `:@@messages.all.error.find:Beim Laden von Ressourcen ist ein Fehler aufgetreten.`,
            level: 'danger'
        };
        this.msgs[M.SETTINGS_SUCCESS] = {
            content: $localize `:@@messages.settings.success:Die Einstellungen wurden erfolgreich aktiviert.`,
            level: 'success'
        };
        this.msgs[M.SETTINGS_ERROR_MALFORMED_ADDRESS] = {
            content: $localize `:@@messages.settings.error.malformedAddress:Bitte geben Sie als Adresse eine gültige URL ein.`,
            level: 'danger'
        };
        this.msgs[M.SETTINGS_ERROR_MISSING_USERNAME] = {
            content: $localize `:@@messages.settings.error.missingUsername:Bitte geben Sie Ihren Namen im Feld "Name der Benutzerin/des Benutzers" ein.`,
            level: 'danger'
        };
        this.msgs[M.PROJECTS_DELETE_SUCCESS] = {
            content: $localize `:@@messages.projects.deleteSuccess:Das Projekt "[0]" wurde erfolgreich gelöscht.`,
            level: 'success'
        };
        this.msgs[M.APP_CONTROLLER_SUCCESS] = {
            content: $localize `:@@messages.app.appControllerSuccess:Erfolgreich ausgeführt.`,
            level: 'success'
        };
        this.msgs[M.BACKUP_WRITE_SUCCESS] = {
            content: $localize `:@@messages.backup.write.success:Die Datenbank wurde erfolgreich gesichert.`,
            level: 'success'
        };
        this.msgs[M.BACKUP_READ_SUCCESS] = {
            content: $localize `:@@messages.backup.read.success:Das Backup wurde erfolgreich eingelesen.`,
            level: 'success'
        };
        this.msgs[M.BACKUP_WRITE_ERROR_GENERIC] = {
            content: $localize `:@@messages.backup.write.error.generic:Beim Sichern der Datenbank ist ein Fehler aufgetreten.`,
            level: 'danger'
        };
        this.msgs[M.BACKUP_READ_ERROR_GENERIC] = {
            content: $localize `:@@messages.backup.read.error.generic:Beim Einlesen der Backup-Datei ist ein Fehler aufgetreten.`,
            level: 'danger'
        };
        this.msgs[M.BACKUP_READ_ERROR_FILE_NOT_FOUND] = {
            content: $localize `:@@messages.backup.read.error.fileNotFound:Die angegebene Datei konnte nicht gefunden werden.`,
            level: 'danger'
        };
        this.msgs[M.BACKUP_READ_ERROR_NO_PROJECT_IDENTIFIER] = {
            content: $localize `:@@messages.backup.read.error.noProjectIdentifier:Geben Sie eine Projektkennung an, um fortzufahren.`,
            level: 'danger'
        };
        this.msgs[M.BACKUP_READ_ERROR_SAME_PROJECT_IDENTIFIER] = {
            content: $localize `:@@messages.backup.read.error.sameProjectIdentifier:Bitte wählen Sie als Ziel ein anderes als das gerade ausgewählte Projekt.`,
            level: 'danger'
        };
        this.msgs[M.BACKUP_READ_WARNING_UNSIMILAR_PROJECT_IDENTIFIER] = {
            content: $localize `:@@messages.backup.read.warning.unsimilarProjectIdentifier:Die von Ihnen gewählte Projektkennung unterscheidet sich stark von der Kennung des Originalprojekts. Bitte prüfen Sie, ob Sie die korrekte Backup-Datei ausgewählt haben, bevor Sie Daten aus dem wiederhergestellten Projekt mit anderen Field-Desktop-Instanzen oder Field-Servern synchronisieren.`,
            level: 'warning'
        };
        this.msgs[M.MODEL_VALIDATION_IDENTIFIER_ALREADY_EXISTS] = {
            content: $localize `:@@messages.model.validation.error.identifierExists:Der Ressourcen-Bezeichner [0] existiert bereits.`,
            level: 'danger'
        };
        this.msgs[M.MODEL_VALIDATION_INVALID_IDENTIFIER_PREFIX] = {
            content: $localize `:@@messages.model.validation.error.identifierPrefix:Der Ressourcen-Bezeichner \'[0]\' beginnt nicht mit dem für die Kategorie \'[1]\' konfigurierten Bezeichner-Präfix \'[2]\'.`,
            level: 'danger'
        };
        this.msgs[M.MODEL_VALIDATION_MISSING_COORDINATES] = {
            content: $localize `:@@messages.model.validation.error.missingCoordinates:Die Koordinaten einer Geometrie sind nicht definiert.`,
            level: 'danger'
        };
        this.msgs[M.MODEL_VALIDATION_INVALID_COORDINATES] = {
            content: $localize `:@@messages.model.validation.error.invalidCoordinates:Die Koordinaten einer Geometrie vom Typ [0] sind nicht valide.`,
            level: 'danger'
        };
        this.msgs[M.MODEL_VALIDATION_MISSING_GEOMETRYTYPE] = {
            content: $localize `:@@messages.model.validation.error.missingGeometryType:Der Typ einer Geometrie ist nicht definiert.`,
            level: 'danger'
        };
        this.msgs[M.MODEL_VALIDATION_UNSUPPORTED_GEOMETRY_TYPE] = {
            content: $localize `:@@messages.model.validation.error.unsupportedGeometryType:Der Geometrietyp [0] wird von der Anwendung nicht unterstützt.`,
            level: 'danger'
        };
        this.msgs[M.INITIAL_SYNC_DB_NOT_EMPTY] = {
            content: $localize `:@@messages.initialSync.targetDbNotEmpty:Download fehlgeschlagen: Das angegebene Projekt existiert bereits auf dieser Field-Desktop-Installation.`,
            level: 'danger'
        };
        this.msgs[M.INITIAL_SYNC_GENERIC_ERROR] = {
            content: $localize `:@@messages.initialSync.genericError:Download fehlgeschlagen: Stellen Sie sicher, dass die angegebene Adresse korrekt ist und eine Netzwerkverbindung besteht. Prüfen Sie auch die Firewalleinstellungen Ihres Systems.`,
            level: 'danger'
        };
        this.msgs[M.INITIAL_SYNC_COULD_NOT_START_GENERIC_ERROR] = {
            content: $localize `:@@messages.initialSync.couldNotStartGenericError:Download fehlgeschlagen: Ein unbekannter Fehler ist aufgetreten.`,
            level: 'danger'
        };
        this.msgs[M.INITIAL_SYNC_INVALID_CREDENTIALS] = {
            content: $localize `:@@messages.initialSync.invalidCredentials:Download fehlgeschlagen: Stellen Sie sicher, dass das Projekt unter der angegebenen Adresse existiert und prüfen Sie das Passwort.`,
            level: 'danger'
        };
        this.msgs[M.IMPORT_SUCCESS_SINGLE] = {
            content: $localize `:@@messages.import.success.single:Eine Ressource wurde erfolgreich importiert.`,
            level: 'success'
        };
        this.msgs[M.IMPORT_SUCCESS_MULTIPLE] = {
            content: $localize `:@@messages.import.success.multiple:[0] Ressourcen wurden erfolgreich importiert.`,
            level: 'success'
        };
        this.msgs[M.IMPORT_WARNING_EMPTY] = {
            content: $localize `:@@messages.import.warning.empty:Die Import-Datei enthält keine Einträge.`,
            level: 'warning'
        };
        this.msgs[M.IMPORT_WARNING_IGNORED_EXISTING_IDENTIFIER] = {
            content: $localize `:@@messages.import.warning.ignoredExistingIdentifier:Die Ressource \'[0]\' wurde nicht importiert, weil bereits eine Ressource mit dem gleichen Bezeichner existiert.`,
            level: 'warning'
        };
        this.msgs[M.IMPORT_WARNING_IGNORED_EXISTING_IDENTIFIERS] = {
            content: $localize `:@@messages.import.warning.ignoredExistingIdentifiers:[0] Ressourcen wurden nicht importiert, weil bereits Ressourcen mit dem jeweiligen Bezeichner existieren (vollständige Auflistung unten).`,
            level: 'warning'
        };
        this.msgs[M.IMPORT_WARNING_IGNORED_MISSING_IDENTIFIER] = {
            content: $localize `:@@messages.import.warning.ignoredMissingIdentifier:Die Ressource \'[0]\' wurde nicht importiert, weil keine Ressource mit dem Bezeichner gefunden wurde.`,
            level: 'warning'
        };
        this.msgs[M.IMPORT_WARNING_IGNORED_MISSING_IDENTIFIERS] = {
            content: $localize `:@@messages.import.warning.ignoredMissingIdentifiers:[0] Ressourcen wurden nicht importiert, weil keine Ressourcen mit dem jeweiligen Bezeichner gefunden wurden (vollständige Auflistung unten).`,
            level: 'warning'
        };
        this.msgs[M.IMPORT_READER_GENERIC_START_ERROR] = {
            content: $localize `:@@messages.import.error.genericStartError:Import kann nicht gestartet werden.`,
            level: 'danger'
        };
        this.msgs[M.IMPORT_READER_FILE_UNREADABLE] = {
            content: $localize `:@@messages.import.error.fileUnreadable:Beim Import ist ein Fehler aufgetreten: Die Datei [0] konnte nicht gelesen werden.`,
            level: 'danger'
        };
        this.msgs[M.IMPORT_PARSER_INVALID_JSON] = {
            content: $localize `:@@messages.import.error.invalidJson:Beim Import ist ein Fehler aufgetreten: Das JSON ist nicht valide. Die ursprüngliche Fehlermeldung lautet: [0].`,
            level: 'danger'
        };
        this.msgs[M.IMPORT_PARSER_INVALID_JSONL] = {
            content: $localize `:@@messages.import.error.invalidJsonl:Beim Import ist ein Fehler aufgetreten: Das JSON in Zeile [0] ist nicht valide.`,
            level: 'danger'
        };
        this.msgs[M.IMPORT_PARSER_INVALID_GEOJSON_IMPORT_STRUCT] = {
            content: $localize `:@@messages.import.error.invalidGeojsonImportStruct:Fehlerhafte GeoJSON-Importstruktur. Grund: [0].`,
            level: 'danger'
        };
        this.msgs[M.IMPORT_PARSER_MISSING_IDENTIFIER] = {
            content: $localize `:@@messages.import.error.missingIdentifier:Beim Import ist ein Fehler aufgetreten: Ein oder mehrere Features ohne properties.identifier wurden gefunden.`,
            level: 'danger'
        };
        this.msgs[M.IMPORT_PARSER_ID_MUST_NOT_BE_SET] = {
            content: $localize `:@@messages.import.error.parser.idnottobeset:Beim Import ist ein Fehler aufgetreten: Ein oder mehrere Ressourcen enthielten unerlaubte Einträge für resource.id.`,
            level: 'danger'
        };
        this.msgs[M.IMPORT_PARSER_IDENTIFIER_FORMAT] = {
            content: $localize `:@@messages.import.error.identifierFormat:Beim Import ist ein Fehler aufgetreten: properties.identifier muss eine Zeichenkette sein, keine Zahl.`,
            level: 'danger'
        };
        this.msgs[M.IMPORT_PARSER_INVALID_CSV] = {
            content: $localize `:@@messages.import.error.invalidCsv:Beim Import ist ein Fehler aufgetreten: Das CSV in Zeile [0] konnte nicht gelesen werden.`,
            level: 'danger'
        };
        this.msgs[M.IMPORT_PARSER_CSV_INVALID_HEADING] = {
            content: $localize `:@@messages.import.error.csvInvalidHeading:Ungültiger CSV-Header: Siehe [0].`,
            level: 'danger'
        };
        this.msgs[M.IMPORT_PARSER_CSV_HEADING_EMPTY_ENTRY] = {
            content: $localize `:@@messages.import.error.csvHeadingEmptyEntry:CSV-Header darf keine leeren Einträge haben.`,
            level: 'danger'
        };
        this.msgs[M.IMPORT_PARSER_CSV_HEADING_PATH_ITEM_TYPE_MISMATCH] = {
            content: $localize `:@@messages.import.parser.error.csvHeadingPathItemTypeMismatch:CSV-Header: Array Indices und Object keys dürfen nicht gemischt werden: [0]`,
            level: 'danger'
        };
        this.msgs[M.IMPORT_PARSER_CSV_HEADING_ARRAY_INDICES_INVALID_SEQUENCE] = {
            content: $localize `:@@messages.import.error.csvHeadingArrayIndicesInvalidSequence:Ungültige Sequenz für Array Indices in CSV-Header: [0]`,
            level: 'danger'
        };
        this.msgs[M.IMPORT_PARSER_CSV_ROWS_LENGTH_MISMATCH] = {
            content: $localize `:@@messages.import.error.csvRowsLengthMismatch:Anzahl der Einträge in Zeile [0] stimmt nicht mit Anzahl der Einträge in Header überein`,
            level: 'danger'
        };
        this.msgs[M.IMPORT_PARSER_NOT_A_BOOLEAN] = {
            content: $localize `:@@messages.import.error.parser.csv.notaboolean:CSV fehlerhaft: Wert "[0]" in Spalte "[1]" ist kein Boolean.`,
            level: 'danger'
        };
        this.msgs[M.IMPORT_PARSER_NOT_A_NUMBER] = {
            content: $localize `:@@messages.import.error.parser.csv.notanumber:CSV fehlerhaft: Wert "[0]" in Spalte "[1]" ist keine Zahl.`,
            level: 'danger'
        };
        this.msgs[M.IMPORT_PARSER_GENERIC_CSV_ERROR] = {
            content: $localize `:@@messages.import.error.genericCsvError:Beim Import ist ein Fehler aufgetreten: Die CSV-Daten konnten nicht gelesen werden.`,
            level: 'danger'
        };
        this.msgs[M.IMPORT_PARSER_MANDATORY_CSV_FIELD_MISSING] = {
            content: $localize `:@@messages.import.error.mandatoryCsvFieldMissing:Beim Import ist ein Fehler aufgetreten: In Zeile [0] fehlt das Pflichtfeld \'[1]\'.`,
            level: 'danger'
        };
        this.msgs[M.IMPORT_READER_INVALID_OPERATION_RESOURCE] = {
            content: $localize `:@@messages.import.error.invalidOperationResource:Beim Import ist ein Fehler aufgetreten: Ressourcen der Kategorie [0] können der gewählten Maßnahme der Kategorie [1] nicht zugeordnet werden.`,
            level: 'danger'
        };
        this.msgs[M.IMPORT_PREVALIDATION_OPERATIONS_NOT_ALLOWED] = {
            content: $localize `:@@messages.import.error.operationsNotAllowed:Wenn die Option \'Daten einer Maßnahme zuordnen\' gewählt ist, darf die Import-Datei keine Maßnahmen enthalten.`,
            level: 'danger'
        };
        this.msgs[M.IMPORT_EXEC_NO_LIES_WITHIN_SET] = {
            content: $localize `:@@messages.import.error.onlyplaceandoperationwithoutrecordedinallowed:Wenn \'Keine Zuordnung\' gewählt ist, müssen alle Ressourcen außer Maßnahmen oder Orte \'isChildOf\'-Zuordnungen haben.`,
            level: 'danger'
        };
        this.msgs[M.IMPORT_PREVALIDATION_DUPLICATE_IDENTIFIER] = {
            content: $localize `:@@messages.import.error.duplicateidentifier:Mehrfach vorhandener Identifier in Importdatei: \'[0]\'.`,
            level: 'danger'
        };
        this.msgs[M.IMPORT_READER_GENERIC_DATASTORE] = {
            content: $localize `:@@messages.import.error.genericDatastoreError:Beim Import ist ein Fehler aufgetreten: Die Ressource [0] konnte nicht gespeichert werden.`,
            level: 'danger'
        };

        this.msgs[M.IMPORT_READER_ROLLBACK] = {
            content: $localize `:@@messages.import.error.rollbackError:Beim Versuch, die bereits importierten Daten zu löschen, ist ein Fehler aufgetreten.`,
            level: 'danger'
        };
        this.msgs[M.IMPORT_EXEC_MISSING_RELATION_TARGET] = {
            content: $localize `:@@messages.import.error.missingRelationTarget:Beim Import ist ein Fehler aufgetreten: Die als Ziel einer Relation angegebene Ressource mit der ID [0] konnte nicht gefunden werden.`,
            level: 'danger'
        };
        this.msgs[M.IMPORT_EXEC_NOT_INTERRELATED] = {
            content: $localize `:@@messages.import.error.notInterrelated:Beim Import ist ein Fehler aufgetreten: Verknüpfung bei \'[0]\' fehlerhaft.`,
            level: 'danger'
        };
        this.msgs[M.IMPORT_EXEC_EMPTY_RELATION] = {
            content: $localize `:@@messages.import.error.emptyRelation:Beim Import ist ein Fehler aufgetreten: Leere Relation bei \'[0]\'.`,
            level: 'danger'
        };
        this.msgs[M.IMPORT_LIES_WITHIN_TARGET_NOT_MATCHES_ON_IS_RECORDED_IN] = {
            content: $localize `:@@messages.import.error.liesWithinRecordedInMismatch:\'parent\' zeigt auf Resource einer anderen Maßnahme. Bezeichner: \'[0]\'.`,
            level: 'danger'
        };
        this.msgs[M.IMPORT_PARENT_ASSIGNMENT_TO_OPERATIONS_NOT_ALLOWED] = {
            content: $localize `:@@messages.importerrors.parentassignmenttooperationnotallowed:Wenn der Modus \'Daten einer Maßnahme zuordnen gewählt ist\', dürfen keine Zuordnungen zu Maßnahmen per \'parent\' vorgenommen werden.`,
            level: 'danger'
        };
        this.msgs[M.IMPORT_PARENT_MUST_NOT_BE_ARRAY] = {
            content: $localize `:@@messages.Import.ImportErrors.parentMustNotBeArray:Fehler bei Ressource mit Bezeichner \'[0]\'. Die \'parent\'-Relation darf kein Array sein.`,
            level: 'danger'
        };
        this.msgs[M.IMPORT_MUST_BE_ARRAY] = {
            content: $localize `:@@messages.Import.ImportErrors.relationMustBeArray:Fehler bei Ressource mit Bezeichner \'[0]\'. Relationen ausser \'isChildOf\' müssen Arrays sein.`,
            level: 'danger'
        };
        this.msgs[M.IMPORT_PREVALIDATION_MISSING_RELATION_TARGET] = {
            content: $localize `:@@messages.import.error.prevalidation.missingRelationTarget:Beim Import ist ein Fehler aufgetreten: Die als Ziel einer Relation angegebene Ressource mit dem Bezeichner \'[0]\' konnte nicht gefunden werden.`,
            level: 'danger'
        };
        this.msgs[M.IMPORT_NO_OPERATION_ASSIGNABLE] = {
            content: $localize `:@@messages.import.error.noOperationAssignable:Beim Import ist ein Fehler aufgetreten: Eine Ressource konnte keiner Maßnahme mit dem Bezeichner \'[0]\' zugeordnet werden.`,
            level: 'danger'
        };
        this.msgs[M.IMPORT_NO_FEATURE_ASSIGNABLE] = {
            content: $localize `:@@messages.import.error.noFeatureAssignable:Beim Import ist ein Fehler aufgetreten: Eine Ressource konnte keiner stratigraphischen Einheit zugeordnet werden. Ziel-Bezeichner oder Fehler: \'[0]\'`,
            level: 'danger'
        };
        this.msgs[M.IMPORT_READER_SHAPEFILE_READ_ERROR] = {
            content: $localize `:@@messages.import.error.shapefile.readError:Beim Import ist ein Fehler aufgetreten: Die Datei konnte nicht gelesen werden. Bitte wählen Sie ein gültiges Shapefile (.shp) aus.`,
            level: 'danger'
        };
        this.msgs[M.IMPORT_PARSER_CATALOG_GENERIC] = {
            content: $localize `:@@messages.import.error.catalog.generic:Beim Import ist ein Fehler aufgetreten: Der Katalog konnte nicht importiert werden.`,
            level: 'danger'
        };
        this.msgs[M.IMPORT_VALIDATION_INVALID_CATEGORY] = {
            content: $localize `:@@messages.import.validation.error.invalidCategory:Ungültige Kategoriedefinition: \'[0]\'`,
            level: 'danger'
        };
        this.msgs[M.IMPORT_ERROR_MUST_LIE_WITHIN_OTHER_NON_OPERATON_RESOURCE] = {
            content: $localize `:@@messages.import.validation.error.mustHaveLiesWithin:Ressourcen der Kategorie \'[0]\' müssen innerhalb von anderen Ressourcen angelegt werden. Betroffen ist: \'[1]\'.`,
            level: 'danger'
        };
        this.msgs[M.IMPORT_ERROR_TARGET_CATEGORY_RANGE_MISMATCH] = {
            content: $localize `:@@messages.import.validation.error.targetCategoryRangeMismatch:Eine Ressource der Kategorie \'[2]\' darf nicht mittels \'[1]\' mit \'[0]\' verknüpft werden.`,
            level: 'danger'
        };
        this.msgs[M.IMPORT_VALIDATION_ERROR_INVALID_FIELD] = {
            content: $localize `:@@messages.import.validation.error.invalidField:Fehlende Felddefinition für das Feld \'[1]\' einer Ressource der Kategorie \'[0]\'.`,
            level: 'danger'
        };
        this.msgs[M.IMPORT_VALIDATION_ERROR_INVALID_FIELDS] = {
            content: $localize `:@@messages.import.validation.error.invalidFields:Fehlende Felddefinitionen für die Felder \'[1]\' einer Ressource der Kategorie \'[0]\'.`,
            level: 'danger'
        };
        this.msgs[M.IMPORT_VALIDATION_ERROR_INVALID_RELATION_FIELD] = {
            content: $localize `:@@messages.import.validation.error.invalidRelationField:Fehlende Definition für die Relation \'[1]\' einer Ressource der Kategorie \'[0]\'.`,
            level: 'danger'
        };
        this.msgs[M.IMPORT_VALIDATION_ERROR_INVALID_RELATION_FIELDS] = {
            content: $localize `:@@messages.import.validation.error.invalidRelationFields:Fehlende Definitionen für die Relationen \'[1]\' einer Ressource der Kategorie \'[0]\'.`,
            level: 'danger'
        };
        this.msgs[M.IMPORT_VALIDATION_ERROR_INVALID_NUMERIC_VALUE] = {
            content: $localize `:@@messages.import.validation.error.invalidNumericValue:Ungültiger Zahlenwert im Feld \'[1]\' einer Ressource der Kategorie \'[0]\'.`,
            level: 'danger'
        };
        this.msgs[M.IMPORT_VALIDATION_ERROR_INVALID_NUMERIC_VALUES] = {
            content: $localize `:@@messages.import.validation.error.invalidNumericValues:Ungültige Zahlenwerte in den folgenden Feldern einer Ressource der Kategorie \'[0]\': [1].`,
            level: 'danger'
        };
        this.msgs[M.IMPORT_VALIDATION_ERROR_INVALID_URL] = {
            content: $localize `:@@messages.import.validation.error.invalidUrl:Ungültige URL im Feld \'[1]\' einer Ressource der Kategorie \'[0]\'.`,
            level: 'danger'
        };
        this.msgs[M.IMPORT_VALIDATION_ERROR_INVALID_URLS] = {
            content: $localize `:@@messages.import.validation.error.invalidUrls:Ungültige URLs in den folgenden Feldern einer Ressource der Kategorie \'[0]\': [1].`,
            level: 'danger'
        };
        this.msgs[M.IMPORT_VALIDATION_ERROR_INVALID_DATE] = {
            content: $localize `:@@messages.import.validation.error.invalidDate:Ungültige Datumsangabe im Feld \'[1]\' einer Ressource der Kategorie \'[0]\'. Format für Datumsangaben: "Tag.Monat.Jahr", z. B.: 01.01.2010`,
            level: 'danger'
        };
        this.msgs[M.IMPORT_VALIDATION_ERROR_INVALID_DATES] = {
            content: $localize `:@@messages.import.validation.error.invalidDates:Ungültige Datumsangaben in den folgenden Feldern einer Ressource der Kategorie \'[0]\': [1]. Format für Datumsangaben: "Tag.Monat.Jahr", z. B.: 01.01.2010`,
            level: 'danger'
        };
        this.msgs[M.IMPORT_VALIDATION_ERROR_INVALID_DATING_VALUE] = {
            content: $localize `:@@messages.import.validation.error.invalidDatingValue:Ungültige Datierung im Feld \'[1]\' einer Ressource der Kategorie \'[0]\'.`,
            level: 'danger'
        };
        this.msgs[M.IMPORT_VALIDATION_ERROR_INVALID_DATING_VALUES] = {
            content: $localize `:@@messages.import.validation.error.invalidDatingValues:Ungültige Datierungen in den folgenden Feldern einer Ressource der Kategorie \'[0]\': [1].`,
            level: 'danger'
        };
        this.msgs[M.IMPORT_VALIDATION_ERROR_INVALID_DIMENSION_VALUE] = {
            content: $localize `:@@messages.import.validation.error.invalidDimensionValue:Ungültige Maßangabe im Feld \'[1]\' einer Ressource der Kategorie \'[0]\'.`,
            level: 'danger'
        };
        this.msgs[M.IMPORT_VALIDATION_ERROR_INVALID_DIMENSION_VALUES] = {
            content: $localize `:@@messages.import.validation.error.invalidDimensionValues:Ungültige Maßangaben in den folgenden Feldern einer Ressource der Kategorie \'[0]\': [1].`,
            level: 'danger'
        };
        this.msgs[M.IMPORT_VALIDATION_ERROR_INVALID_LITERATURE_VALUE] = {
            content: $localize `:@@messages.import.validation.error.invalidLiteratureValue:Ungültiger Literaturverweis im Feld \'[1]\' einer Ressource der Kategorie \'[0]\'.`,
            level: 'danger'
        };
        this.msgs[M.IMPORT_VALIDATION_ERROR_INVALID_LITERATURE_VALUES] = {
            content: $localize `:@@messages.import.validation.error.invalidLiteratureValues:Ungültige Literaturverweise in den folgenden Feldern einer Ressource der Kategorie \'[0]\': [1].`,
            level: 'danger'
        };
        this.msgs[M.IMPORT_VALIDATION_ERROR_INVALID_COMPOSITE_VALUE] = {
            content: $localize `:@@messages.import.validation.error.invalidCompositeValue:Ungültiger Kompositfeld-Eintrag im Feld \'[1]\' einer Ressource der Kategorie \'[0]\'.`,
            level: 'danger'
        };
        this.msgs[M.IMPORT_VALIDATION_ERROR_INVALID_COMPOSITE_VALUES] = {
            content: $localize `:@@messages.import.validation.error.invalidCompositeValues:Ungültige Kompositfeld-Einträge in den folgenden Feldern einer Ressource der Kategorie \'[0]\': [1].`,
            level: 'danger'
        };
        this.msgs[M.IMPORT_VALIDATION_ERROR_INVALID_DROPDOWN_RANGE_VALUES] = {
            content: $localize `:@@messages.import.validation.error.invalidDropdownValues:Ungültiger Bereich im Feld \'[1]\' einer Ressource der Kategorie \'[0]\'.`,
            level: 'danger'
        };
        this.msgs[M.IMPORT_VALIDATION_ERROR_INVALID_MAP_LAYER_RELATION_TARGETS] = {
            content: $localize `:@@messages.import.validation.error.invalidMapLayerRelationTargets:Die Relation \'hasDefaultMapLayer\' einer Ressource der Kategorie \'[0]\' verweist auf eine oder mehrere Ressourcen, auf die nicht in der Relation \'hasMapLayer\' verwiesen wird.`,
            level: 'danger'
        };
        this.msgs[M.IMPORT_VALIDATION_ERROR_END_DATE_BEFORE_BEGINNING_DATE] = {
            content: $localize `:@@messages.import.validation.error.endDateBeforeBeginningDate:Das Enddatum einer Ressource der Kategorie \'[0]\' liegt vor dem Startdatum.`,
            level: 'danger'
        };
        this.msgs[M.IMPORT_VALIDATION_MISSING_PROPERTY] = {
            content: $localize `:@@messages.import.validation.error.missingProperty:Eigenschaft(en) einer Ressource der Kategorie \'[0]\' müssen vorhanden sein: \'[1]\'.`,
            level: 'danger'
        };
        this.msgs[M.IMPORT_VALIDATION_ERROR_MAX_CHARACTERS_EXCEEDED] = {
            content: $localize `:@@messages.import.validation.error.maxCharactersExceeded:Im Feld \'[1]\' der Kategorie \'[0]\' dürfen maximal [2] Zeichen eingetragen werden.`,
            level: 'danger'
        };
        this.msgs[M.IMPORT_VALIDATION_ERROR_RESOURCE_LIMIT_EXCEEDED] = {
            content: $localize `:@@messages.import.validation.error.resourceLimitExceeded:In diesem Projekt dürfen maximal [1] Ressourcen der Kategorie \'[0]\' angelegt werden.`,
            level: 'danger'
        };
        this.msgs[M.IMPORT_ERROR_CATEGORY_NOT_ALLOWED] = {
            content: $localize `:@@messages.import.error.categoryNotAllowed:Ressourcen der folgenden Kategorie sind beim Import nicht erlaubt: \'[0]\'`,
            level: 'danger'
        };
        this.msgs[M.IMPORT_ERROR_CATEGORY_ONLY_ALLOWED_ON_UPDATE] = {
            content: $localize `:@@messages.import.error.categoryOnlyAllowedOnUpdate:Ressourcen der folgenden Kategorie sind beim Import nur im Ergänzungsmodus erlaubt: \'[0]\'`,
            level: 'danger'
        };
        this.msgs[M.IMPORT_MUST_BE_IN_SAME_OPERATION] = {
            content: $localize `:@@messages.import.error.mustBeInSameOperation:Ressourcen liegen in unterschiedlichen Maßnahmen: \'[0]\', \'[1]\'`,
            level: 'danger'
        };
        this.msgs[M.IMPORT_ERROR_CATEGORY_CANNOT_BE_CHANGED] = {
            content: $localize `:@@messages.import.error.categoryCannotBeChanged:Die Kategorie kann beim Import nicht geändert werden. Betroffen ist: \'[0]\'`,
            level: 'danger'
        };
        this.msgs[M.IMPORT_ERROR_EMPTY_SLOTS_IN_ARRAYS_FORBIDDEN] = {
            content: $localize `:@@messages.import.error.emptySlotsInArraysForbidden:Leere Array-Felder sind nicht erlaubt. Betroffen ist: \'[0]\'`,
            level: 'danger'
        };
        this.msgs[M.IMPORT_ERROR_ARRAY_OF_HETEROGENEOUS_TYPES] = {
            content: $localize `:@@messages.import.error.arrayOfHeterogeneousTypes:Arrays müssen konsistent Felder vom gleichen Typ beinhalten. Betroffen ist: \'[0]\'`,
            level: 'danger'
        };
        this.msgs[M.IMPORT_ERROR_MUST_NOT_BE_EMPTY_STRING] = {
            content: $localize `:@@messages.import.error.mustNotBeEmptyString:Leere Strings sind nicht als Werte in Importdatensätzen erlaubt.`,
            level: 'danger'
        };
        this.msgs[M.IMPORT_ERROR_INVALID_FILE_FORMAT] = {
            content: $localize `:@@messages.import.error.invalidFileFormat:Die ausgewählte Datei kann nicht importiert werden. Gültige Dateiendungen sind: [0]`,
            level: 'danger'
        };
        this.msgs[M.IMPORT_ERROR_EMPTY_OBJECT_IN_RESOURCE] = {
            content: $localize `:@@messages.import.error.emptyObjectInResource:Leere Objekte sind in Importdatensätzen nicht erlaubt (Ausnahme: Feld "relations").`,
            level: 'danger'
        };
        this.msgs[M.IMPORT_CATALOG_ERROR_CONNECTED_TYPE_DELETED] = {
            content: $localize `:@@messages.import.catalog.error.connected_type_deleted:Update eines bestehenden Katalogs abgebrochen. Die bestehende Version enthält mit Funden verknüpfte Typen, die in der Import-Datei nicht mehr vorhanden sind. Bitte entfernen Sie die Verknüpfungen und starten den Import anschließend erneut. Betroffene Typen: [0]`,
            level: 'danger'
        };
        this.msgs[M.IMPORT_CATALOG_ERROR_IDENTIFIER_CLASH] = {
            content: $localize `:@@messages.import.catalog.error.identifier_clash:Katalogimport abgebrochen. Identifier-Konflikte mit Dokumenten der Datenbank. Identifier: [0]`,
            level: 'danger'
        };
        this.msgs[M.IMPORT_CATALOG_ERROR_OWNER_MUST_NOT_REIMPORT_CATALOG] = {
            content: $localize `:@@messages.import.catalog.error.owner_must_not_reimport_catalog:Katalogimport abgebrochen. Löschen Sie den Katalog \'[0]\', bevor Sie ihn erneut importieren.`,
            level: 'danger'
        };
        this.msgs[M.IMPORT_CATALOG_ERROR_OWNER_MUST_NOT_OVERWRITE_EXISTING_IMAGES] = {
            content: $localize `:@@messages.import.catalog.error.owner_must_not_overwrite_existing_images:Katalogimport abgebrochen. Importdatei beinhaltet Bilder, die bereits in der Datenbank vorhanden sind.`,
            level: 'danger'
        };
        this.msgs[M.IMPORT_CATALOG_ERROR_DIFFERENT_PROJECT_ENTRIES] = {
            content: $localize `:@@messages.import.catalog.error.differentProjectEntries:Katalogimport abgebrochen. Alle zu importierenden Dokumente müssen den gleichen Projekt-Eintrag haben.`,
            level: 'danger'
        };
        this.msgs[M.IMPORT_CATALOG_ERROR_NO_OR_TOO_MANY_TYPE_CATALOG_DOCUMENTS] = {
            content: $localize `:@@messages.import.catalog.error.noOrTooManyTypeCatalogDocuments:Katalogimport abgebrochen. Keine oder zu viele TypeCatalog-Dokumente.`,
            level: 'danger'
        };
        this.msgs[M.IMPORT_CATALOG_ERROR_INVALID_RELATIONS] = {
            content: $localize `:@@messages.import.catalog.error.invalidRelations:Katalogimport abgebrochen. Ungültige Relationen.`,
            level: 'danger'
        };
        this.msgs[M.IMPORT_VALIDATION_ERROR_NO_RECORDEDIN] = {
            content: $localize `:@@messages.import.validation.error.noRecordedIn:Fehlende Definition von \'Aufgenommen in Maßnahme\'. Eine Zuordnung muss vorgenommen werden.`,
            level: 'danger'
        };
        this.msgs[M.IMPORT_VALIDATION_ERROR_NO_RECORDEDIN_TARGET] = {
            content: $localize `:@@messages.import.validation.error.noRecordedInTarget:Fehlendes Ziel einer Relation vom Typ \'Aufgenommen in Maßnahme\'. Ziel-ID: [0].`,
            level: 'danger'
        };
        this.msgs[M.EXPORT_SUCCESS] = {
            content: $localize `:@@messages.export.success:Die Exportdatei wurde erfolgreich erstellt.`,
            level: 'success'
        };
        this.msgs[M.EXPORT_ERROR_GENERIC] = {
            content: $localize `:@@messages.export.error.generic:Beim Export ist ein Fehler aufgetreten.`,
            level: 'danger'
        };
        this.msgs[M.EXPORT_GEOJSON_ERROR_WRITE] = {
            content: $localize `:@@messages.export.geojson.error.write:Beim Export ist ein Fehler aufgetreten: Die GeoJSON-Datei konnte nicht geschrieben werden.`,
            level: 'danger'
        };
        this.msgs[M.EXPORT_CATALOG_IMAGES_NOT_EXCLUSIVE_TO_CATALOG] = {
            content: $localize `:@@messages.export.error.catalog.images-not-exclusive-to-catalog:Beim Export ist ein Fehler aufgetreten: Bilder des Kataloges dürfen nicht gleichzeitig mit anderen Ressourcen verbunden sein. Bilder: [0]`,
            level: 'danger'
        };
        this.msgs[M.EXPORT_CATALOG_FAILED_TO_COPY_IMAGES] = {
            content: $localize `:@@messages.export.error.catalog.failedToCopyImages:Beim Export ist ein Fehler aufgetreten: Die mit dem Katalog verknüpften Bilder konnten nicht exportiert werden. Bitte prüfen Sie, ob die Original-Bilddateien im Bilderverzeichnis vorhanden sind.`,
            level: 'danger'
        };
        this.msgs[M.EXPORT_SHAPEFILE_ERROR_WRITE] = {
            content: $localize `:@@messages.export.shapefile.error.write:Beim Export ist ein Fehler aufgetreten: Das Shapefile konnte nicht geschrieben werden.`,
            level: 'danger'
        };
        this.msgs[M.EXPORT_SHAPEFILE_ERROR_ZIP_FILE_CREATION] = {
            content: $localize `:@@messages.export.shapefile.error.zipFileCreation:Beim Export ist ein Fehler aufgetreten: Die ZIP-Datei [0] konnte nicht erstellt werden.`,
            level: 'danger'
        };
        this.msgs[M.EXPORT_CSV_WARNING_INVALID_FIELD_DATA_SINGLE] = {
            content: $localize `:@@messages.export.csv.warning.invalidFieldData.single:Das Feld "[0]" der Ressoure [1] wurde beim Export ignoriert, weil die eingetragenen Felddaten nicht dem konfigurierten Eingabetyp entsprechen.`,
            level: 'warning'
        };
        this.msgs[M.EXPORT_CSV_WARNING_INVALID_FIELD_DATA_MULTIPLE] = {
            content: $localize `:@@messages.export.csv.warning.invalidFieldData.multiple:Mehrere Felder wurden beim Export ignoriert, weil die eingetragenen Felddaten nicht dem konfigurierten Eingabetyp entsprechen (vollständige Auflistung unten).`,
            level: 'warning'
        };
        this.msgs[M.DATASTORE_ERROR_NOT_FOUND] = {
            content: $localize `:@@messages.datastore.error.notFound:Die Ressource konnte nicht gefunden werden.`,
            level: 'danger'
        };
        this.msgs[M.DOCEDIT_WARNING_SAVE_CONFLICT] = {
            content: $localize `:@@messages.docedit.warning.saveConflict:Beim Speichern der Ressource ist ein Konflikt aufgetreten.`,
            level: 'warning'
        };
        this.msgs[M.DOCEDIT_WARNING_CATEGORY_CHANGE_FIELDS] = {
            content: $localize `:@@messages.docedit.warning.categoryChange.fields:Bitte beachten Sie, dass die Daten der folgenden Felder beim Speichern verloren gehen: [0]`,
            level: 'warning'
        };
        this.msgs[M.DOCEDIT_WARNING_CATEGORY_CHANGE_RELATIONS] = {
            content: $localize `:@@messages.docedit.warning.categoryChange.relations:Bitte beachten Sie, dass die Relationen der folgenden Relationstypen beim Speichern verloren gehen: [0]`,
            level: 'warning'
        };
        this.msgs[M.DOCEDIT_ERROR_SAVE] = {
            content: $localize `:@@messages.docedit.error.save:Beim Speichern der Ressource ist ein Fehler aufgetreten.`,
            level: 'danger'
        };
        this.msgs[M.DOCEDIT_ERROR_DELETE] = {
            content: $localize `:@@messages.docedit.error.delete:Beim Löschen der Ressource ist ein Fehler aufgetreten.`,
            level: 'danger'
        };
        this.msgs[M.DOCEDIT_ERROR_RESOLVE_CONFLICT] = {
            content: $localize `:@@messages.docedit.error.resolveConflict:Der Konflikt konnte nicht gelöst werden. Bitte prüfen Sie, ob der Konflikt bereits von einem anderen Benutzer bzw. einer anderen Benutzerin gelöst wurde.`,
            level: 'danger'
        };
        this.msgs[M.DOCEDIT_VALIDATION_ERROR_INVALID_NUMERIC_VALUE] = {
            content: $localize `:@@messages.docedit.validation.error.invalidNumericValue:Bitte tragen Sie im Feld \'[1]\' einen gültigen Zahlenwert ein.`,
            level: 'danger'
        };
        this.msgs[M.DOCEDIT_VALIDATION_ERROR_INVALID_NUMERIC_VALUES] = {
            content: $localize `:@@messages.docedit.validation.error.invalidNumericValues:Bitte tragen Sie in den folgenden Feldern gültige Zahlenwerte ein: [1].`,
            level: 'danger'
        };
        this.msgs[M.DOCEDIT_VALIDATION_ERROR_INVALID_URL] = {
            content: $localize `:@@messages.docedit.validation.error.invalidUrl:Bitte tragen Sie im Feld \'[1]\' eine gültige URL ein.`,
            level: 'danger'
        };
        this.msgs[M.DOCEDIT_VALIDATION_ERROR_INVALID_URLS] = {
            content: $localize `:@@messages.docedit.validation.error.invalidUrls:Bitte tragen Sie in den folgenden Feldern gültige URLs ein: [1].`,
            level: 'danger'
        };
        this.msgs[M.DOCEDIT_VALIDATION_ERROR_INVALID_DATING_VALUE] = {
            content: $localize `:@@messages.docedit.validation.error.invalidDatingValue:Bitte tragen Sie im Feld \'[1]\' eine gültige Datierung ein.`,
            level: 'danger'
        };
        this.msgs[M.DOCEDIT_VALIDATION_ERROR_INVALID_DATING_VALUES] = {
            content: $localize `:@@messages.docedit.validation.error.invalidDatingValues:Bitte tragen Sie in den folgenden Feldern gültige Datierungen ein: [1].`,
            level: 'danger'
        };
        this.msgs[M.DOCEDIT_VALIDATION_ERROR_INVALID_DIMENSION_VALUE] = {
            content: $localize `:@@messages.docedit.validation.error.invalidDimensionValue:Bitte tragen Sie im Feld \'[1]\' eine gültige Maßangabe ein.`,
            level: 'danger'
        };
        this.msgs[M.DOCEDIT_VALIDATION_ERROR_INVALID_DIMENSION_VALUES] = {
            content: $localize `:@@messages.docedit.validation.error.invalidDimensionValues:Bitte tragen Sie in den folgenden Feldern gültige Maßangaben ein: [1].`,
            level: 'danger'
        };
        this.msgs[M.DOCEDIT_VALIDATION_ERROR_INVALID_DECIMAL_SEPARATOR] = {
            content: $localize `:@@messages.docedit.validation.error.invalidDecimalSeparator:Bitte verwenden Sie im Feld \'[1]\' den Punkt als Dezimaltrennzeichen.`,
            level: 'danger'
        };
        this.msgs[M.DOCEDIT_VALIDATION_ERROR_INVALID_DECIMAL_SEPARATORS] = {
            content: $localize `:@@messages.docedit.validation.error.invalidDecimalSeparators:Bitte verwenden Sie in den folgenden Feldern den Punkt als Dezimaltrennzeichen: [1].`,
            level: 'danger'
        };
        this.msgs[M.DOCEDIT_VALIDATION_ERROR_MISSING_PROPERTY] = {
            content: $localize `:@@messages.docedit.validation.error.missingProperty:Bitte füllen Sie das Feld \'[1]\' aus.`,
            level: 'danger'
        };
        this.msgs[M.DOCEDIT_VALIDATION_ERROR_MAX_CHARACTERS_EXCEEDED] = {
            content: $localize `:@@messages.docedit.validation.error.maxCharactersExceeded:Im Feld \'[1]\' dürfen maximal [2] Zeichen eingetragen werden.`,
            level: 'danger'
        };
        this.msgs[M.DOCEDIT_VALIDATION_ERROR_NO_RECORDEDIN] = {
            content: $localize `:@@messages.docedit.validation.error.noRecordedIn:Bitte wählen Sie eine Zielressource für die Relation \'Aufgenommen in Maßnahme\' aus.`,
            level: 'danger'
        };
        this.msgs[M.DOCEDIT_VALIDATION_ERROR_NO_RECORDEDIN_TARGET] = {
            content: $localize `:@@messages.docedit.validation.error.noRecordedInTarget:Die Zielressource [0] der Relation \'Aufgenommen in Maßnahme\' konnte nicht gefunden werden.`,
            level: 'danger'
        };
        this.msgs[M.DOCEDIT_VALIDATION_ERROR_END_DATE_BEFORE_BEGINNING_DATE] = {
            content: $localize `:@@messages.docedit.validation.error.endDateBeforeBeginningDate:Das angegebene Enddatum liegt vor dem Startdatum. Bitte prüfen Sie die eingetragenen Daten.`,
            level: 'danger'
        };
        this.msgs[M.IMAGES_SUCCESS_IMAGES_UPLOADED] = {
            content: $localize `:@@messages.images.success.imagesUploaded:[0] Bilder wurden erfolgreich importiert.`,
            level: 'success'
        };
        this.msgs[M.IMAGES_SUCCESS_WLD_FILE_UPLOADED] = {
            content: $localize `:@@messages.images.success.wldFileUploaded:Zu einem Bild wurden Georeferenzdaten aus einem World-File importiert.`,
            level: 'success'
        };
        this.msgs[M.IMAGES_SUCCESS_WLD_FILES_UPLOADED] = {
            content: $localize `:@@messages.images.success.wldFilesUploaded:Zu [0] Bildern wurden Georeferenzdaten aus World-Files importiert.`,
            level: 'success'
        };
        this.msgs[M.IMAGES_ERROR_FILEREADER] = {
            content: $localize `:@@messages.images.error.fileReader:Datei \'[0]\' konnte nicht vom lokalen Dateisystem gelesen werden.`,
            level: 'danger'
        };
        this.msgs[M.IMAGES_ERROR_DUPLICATE_FILENAME] = {
            content: $localize `:@@messages.images.error.duplicateFilename:Die Bilddatei \'[0]\' konnte nicht hinzugefügt werden. Ein Bild mit dem gleichen Dateinamen existiert bereits.`,
            level: 'danger'
        };
        this.msgs[M.IMAGES_ERROR_DUPLICATE_FILENAMES] = {
            content: $localize `:@@messages.images.error.duplicateFilenames:Die folgenden Bilddateien konnten nicht hinzugefügt werden, da Bilder mit identischen Dateinamen bereits existieren: [0]`,
            level: 'danger'
        };
        this.msgs[M.IMAGES_ERROR_UNMATCHED_WLD_FILES] = {
            content: $localize `:@@messages.images.error.unmachtedWldFiles:Die folgenden World-Files konnten nicht geladen werden, da die entsprechenden Bilddateien nicht gefunden wurden: [0]`,
            level: 'danger'
        };
        this.msgs[M.IMAGESTORE_ERROR_INVALID_PATH] = {
            content: $localize `:@@messages.imagestore.error.invalidPath:Das Bilderverzeichnis konnte nicht gefunden werden. Der Verzeichnispfad \'[0]\' ist ungültig.`,
            level: 'warning'
        };
        this.msgs[M.IMAGESTORE_ERROR_INVALID_PATH_READ] = {
            content: $localize `:@@messages.imagestore.error.invalidPath.read:Es können keine Dateien aus dem Bilderverzeichnis gelesen werden. Bitte geben Sie einen gültigen Verzeichnispfad in den Einstellungen an.`,
            level: 'warning'
        };
        this.msgs[M.IMAGESTORE_ERROR_INVALID_PATH_WRITE] = {
            content: $localize `:@@messages.imagestore.error.invalidPath.write:Es können keine Dateien im Bilderverzeichnis gespeichert werden. Bitte geben Sie einen gültigen Verzeichnispfad in den Einstellungen an.`,
            level: 'danger'
        };
        this.msgs[M.IMAGESTORE_ERROR_INVALID_PATH_DELETE] = {
            content: $localize `:@@messages.imagestore.error.invalidPath.delete:Es können keine Dateien aus dem Bilderverzeichnis gelöscht werden. Bitte geben Sie einen gültigen Verzeichnispfad in den Einstellungen an.`,
            level: 'danger'
        };
        this.msgs[M.IMAGESTORE_ERROR_UPLOAD] = {
            content: $localize `:@@messages.imagestore.error.upload:Die Datei \'[0]\' konnte nicht gelesen werden.`,
            level: 'danger'
        };
        this.msgs[M.IMAGESTORE_ERROR_UPLOAD_PIXEL_LIMIT_EXCEEDED] = {
            content: $localize `:@@messages.imagestore.error.upload.pixelLimitExceeded:Die Datei \'[0]\' konnte nicht gelesen werden: Die maximale Pixelanzahl von [1] wurde überschritten. Bitte verringern Sie die Auflösung des Bildes und versuchen Sie es erneut.`,
            level: 'danger'
        };
        this.msgs[M.IMAGESTORE_ERROR_WRITE] = {
            content: $localize `:@@messages.imagestore.error.write:Die Datei \'[0]\' konnte nicht im Bilderverzeichnis gespeichert werden.`,
            level: 'danger'
        };
        this.msgs[M.IMAGESTORE_ERROR_DELETE] = {
            content: $localize `:@@messages.imagestore.error.delete:Fehler beim Löschen des Bilds \'[0]\'.`,
            level: 'danger'
        };
        this.msgs[M.IMAGESTORE_ERROR_INVALID_WORLDFILE] = {
            content: $localize `:@@messages.imagestore.error.invalidWorldfile:Die Datei \'[0]\' ist kein gültiges World-File.`,
            level: 'danger'
        };
        this.msgs[M.IMAGESTORE_DROP_AREA_ERROR_UNSUPPORTED_EXTENSIONS] = {
            content: $localize `:@@messages.imagestore.dropArea.error.unsupportedExtensions:Dateien mit nicht unterstützten Formaten ([0]) werden ignoriert. Gültige Dateiendungen sind: [1]`,
            level: 'danger'
        };
        this.msgs[M.REMOTEIMAGESTORE_WARNING_LARGE_FILE_UPLOAD_BLOCKED_BY_PEER] = {
            content: $localize `:@@remoteimagestore.warning.largeFileUploadBlockedByPeer:Ihr aktuelles Synchronisationsziel blockiert den Empfang von Originalbildern. Sie können entweder in Ihren Synchronisations-Einstellungen das Hochladen von Originalbildern deaktivieren, oder Sie sorgen beim Synchronisationsziel dafür, dass die Option zur Annahme von Originalbildern angepasst wird.`,
            level: 'warning'
        };
        this.msgs[M.RESOURCES_SUCCESS_IMAGES_UPLOADED] = {
            content: $localize `:@@messages.resources.success.imagesUploaded:[0] Bilder wurden erfolgreich importiert und mit der Ressource [1] verknüpft.`,
            level: 'success'
        };
        this.msgs[M.RESOURCES_SUCCESS_STORAGE_PLACE_SAVED_SINGLE] = {
            content: $localize `:@@messages.resources.success.storagePlaceSaved.single:Für die Ressource [0] wurde erfolgreich der Aufbewahrungsort [1] gespeichert.`,
            level: 'success',
            extendedTimeout: true
        };
        this.msgs[M.RESOURCES_SUCCESS_STORAGE_PLACE_SAVED_MULTIPLE] = {
            content: $localize `:@@messages.resources.success.storagePlaceSaved.multiple:Für [0] Ressourcen wurde erfolgreich der Aufbewahrungsort [1] gespeichert.`,
            level: 'success',
            extendedTimeout: true
        };
        this.msgs[M.RESOURCES_SUCCESS_GENERATED_QR_CODE_SAVED] = {
            content: $localize `:@@messages.resources.success.qrCodeSaved:Der neu generierte QR-Code wurde erfolgreich gespeichert.`,
            level: 'success'
        };
        this.msgs[M.RESOURCES_SUCCESS_EXISTING_QR_CODE_SAVED] = {
            content: $localize `:@@messages.resources.success.existingQrCodeSaved:Der eingescannte QR-Code wurde erfolgreich gespeichert.`,
            level: 'success'
        };
        this.msgs[M.RESOURCES_SUCCESS_QR_CODE_DELETED] = {
            content: $localize `:@@messages.resources.success.qrCodeDeleted:Der QR-Code wurde erfolgreich gelöscht.`,
            level: 'success',
        };
        this.msgs[M.RESOURCES_INFO_STORAGE_PLACE_ALREADY_SET_SINGLE] = {
            content: $localize `:@@messages.resources.info.storagePlaceAlreadySet.single:Der Aufbewahrungsort [1] ist für die Ressource [0] bereits gesetzt.`,
            level: 'info',
            extendedTimeout: true
        };
        this.msgs[M.RESOURCES_INFO_STORAGE_PLACE_ALREADY_SET_MULTIPLE] = {
            content: $localize `:@@messages.resources.info.storagePlaceAlreadySet.multiple:Der Aufbewahrungsort [1] ist für die ausgewählten [0] Ressourcen bereits gesetzt.`,
            level: 'info',
            extendedTimeout: true
        };
        this.msgs[M.RESOURCES_ERROR_NO_STORAGE_PLACE_CATEGORY] = {
            content: $localize `:@@messages.resources.error.noStoragePlaceCategory:Die Ressource [0] der Kategorie [1] ist kein gültiger Aufbewahrungsort.`,
            level: 'danger',
            extendedTimeout: true
        };
        this.msgs[M.RESOURCES_WARNING_PROJECT_IDENTIFIER_NOT_SAME] = {
            content: $localize `:@@messages.resources.warning.projectIdentifierNotSame:Die Projektkennungen stimmen nicht miteinander überein. Das Projekt wird nicht gelöscht.`,
            level: 'warning'
        };
        this.msgs[M.RESOURCES_ERROR_ONE_PROJECT_MUST_EXIST] = {
            content: $localize `:@@messages.resources.error.oneProjectMustExist:Das Projekt kann nicht gelöscht werden. Es muss mindestens ein Projekt vorhanden sein.`,
            level: 'danger'
        };
        this.msgs[M.RESOURCES_ERROR_RESOURCE_DELETED] = {
            content: $localize `:@@messages.resources.error.resourceDeleted:Die Ressource \'[0]\' kann nicht aufgerufen werden, da sie in der Zwischenzeit von einem anderen Benutzer bzw. einer anderen Benutzerin gelöscht wurde.`,
            level: 'danger'
        };
        this.msgs[M.RESOURCES_ERROR_UNKNOWN_RESOURCE_DELETED] = {
            content: $localize `:@@messages.resources.error.unknownResourceDeleted:Die Ressource kann nicht aufgerufen werden, da sie in der Zwischenzeit von einem anderen Benutzer bzw. einer anderen Benutzerin gelöscht wurde.`,
            level: 'danger'
        };
        this.msgs[M.RESOURCES_ERROR_RESOURCE_MISSING_DURING_SYNCING] = {
            content: $localize `:@@messages.resources.error.resourceMissingDuringSyncing:Die Ressource kann nicht aufgerufen werden. Bitte warten Sie, bis die Synchronisierung abgeschlossen ist, und versuchen es anschließend erneut.`,
            level: 'danger'
        };
        this.msgs[M.RESOURCES_ERROR_CANNOT_MOVE_WITH_SAME_OPERATION_RELATIONS] = {
            content: $localize `:@@messages.resources.error.cannotMoveWithSameOperationRelations:Die Ressource [0] kann nicht in eine andere Maßnahme verschoben werden, da Relationen gesetzt sind, die nur zwischen Ressourcen innerhalb der gleichen Maßnahme gesetzt werden dürfen. Entfernen Sie die Relationen und versuchen Sie es anschließend erneut.`,
            level: 'danger'
        };
        this.msgs[M.RESOURCES_ERROR_CANNOT_MOVE_CHILDREN] = {
            content: $localize `:@@messages.resources.error.cannotMoveChildren:Die Ressource [0] kann nicht verschoben werden, weil eine oder mehrere der ihr untergeordneten Ressourcen nicht innerhalb der Zielmaßnahme liegen dürfen.`,
            level: 'danger'
        };
        this.msgs[M.RESOURCES_ERROR_QR_CODE_SCANNING_FAILURE] = {
            content: $localize `:@@messages.resources.error.qrCodeScanningFailure:Beim Scannen eines QR-Codes ist ein Fehler aufgetreten.`,
            level: 'danger'
        };
        this.msgs[M.RESOURCES_ERROR_QR_CODE_RESOURCE_NOT_FOUND] = {
            content: $localize `:@@messages.resources.error.qrCodeResourceNotFound:Für diesen QR-Code konnte keine Ressource gefunden werden.`,
            level: 'danger'
        };
        this.msgs[M.RESOURCES_ERROR_QR_CODE_ALREADY_ASSIGNED] = {
            content: $localize `:@@messages.resources.error.qrCodeAlreadyAssigned:Der gescannte QR-Code ist bereits einer anderen Ressource zugeordnet.`,
            level: 'danger'
        };
        this.msgs[M.RESOURCES_ERROR_PARENT_RESOURCE_DELETED] = {
            content: $localize `:@@messages.resources.error.parentResourceDeleted:Die Ressource kann nicht angelegt werden, da die übergeordnete Ressource in der Zwischenzeit von einem anderen Benutzer bzw. einer anderen Benutzerin gelöscht wurde.`,
            level: 'danger'
        };
        this.msgs[M.PROJECT_CREATION_ERROR_MISSING_IDENTIFIER] = {
            content: $localize `:@@messages.projectCreation.error.missingIdentifier:Bitte geben Sie eine Kennung für das neue Projekt ein.`,
            level: 'danger'
        };
        this.msgs[M.PROJECT_CREATION_ERROR_IDENTIFIER_EXISTS] = {
            content: $localize `:@@messages.projectCreation.error.identifierExists:Ein Projekt mit der Kennung \'[0]\' existiert bereits.`,
            level: 'danger'
        };
        this.msgs[M.PROJECT_CREATION_ERROR_IDENTIFIER_LENGTH] = {
            content: $localize `:@@messages.projectCreation.error.identifierLength:Die angegebene Projektkennung ist um [0] Zeichen zu lang.`,
            level: 'danger'
        };
        this.msgs[M.PROJECT_CREATION_ERROR_IDENTIFIER_CHARACTERS] = {
            content: $localize `:@@messages.projectCreation.error.identifierCharacters:Die angegebene Projektkennung enthält nicht erlaubte Zeichen.`,
            level: 'danger'
        };
        this.msgs[M.PROJECT_CREATION_ERROR_IDENTIFIER_STARTING_CHARACTER] = {
            content: $localize `:@@messages.projectCreation.error.identifierStartingCharacter:Die Projektkennung muss mit einem Kleinbuchstaben beginnen.`,
            level: 'danger'
        };
        this.msgs[M.PROJECT_CREATION_ERROR_NAME_LENGTH] = {
            content: $localize `:@@messages.projectCreation.error.nameLength:Der angegebene Projektname für die Sprache [0] ist um [1] Zeichen zu lang.`,
            level: 'danger'
        };
        this.msgs[M.CONFIGURATION_SUCCESS_IMPORT] = {
            content: $localize `:@@messages.configuration.success.import:Die Projektkonfiguration wurde erfolgreich importiert.`,
            level: 'success'
        };
        this.msgs[M.CONFIGURATION_ERROR_NO_VALUES_IN_VALUELIST] = {
            content: $localize `:@@messages.configuration.error.noValuesInValuelist:Bitte tragen Sie mindestens einen Wert ein.`,
            level: 'danger'
        };
        this.msgs[M.CONFIGURATION_ERROR_NO_VALUELIST] = {
            content: $localize `:@@messages.configuration.error.noValuelist:Bitte wählen Sie eine Werteliste aus oder wechseln Sie den Eingabetyp des Feldes.`,
            level: 'danger'
        };
        this.msgs[M.CONFIGURATION_ERROR_NO_SUBFIELDS] = {
            content: $localize `:@@messages.configuration.error.noSubfields:Bitte legen Sie mindestens zwei Unterfelder an oder wechseln Sie den Eingabetyp des Feldes.`,
            level: 'danger'
        };
        this.msgs[M.CONFIGURATION_ERROR_SUBFIELD_CONDITION_VIOLATION_VALUELISTS] = {
            content: $localize `:@@messages.configuration.error.subfieldConditionViolation.valuelists:Die Werteliste dieses Unterfeldes kann nicht entfernt oder ausgetauscht werden, da es als Bedingungsfeld für das Unterfeld "[0]" konfiguriert wurde.`,
            level: 'danger'
        };
        this.msgs[M.CONFIGURATION_ERROR_SUBFIELD_CONDITION_VIOLATION_INPUT_TYPE] = {
            content: $localize `:@@messages.configuration.error.subfieldConditionViolation.inputType:Der Eingabetyp dieses Unterfeldes kann nicht geändert werden, da es als Bedingungsfeld für das Unterfeld "[0]" konfiguriert wurde.`,
            level: 'danger'
        };
        this.msgs[M.CONFIGURATION_ERROR_VALUE_USED_IN_SUBFIELD_CONDITION] = {
            content: $localize `:@@messages.configuration.error.valueUsedInSubfieldCondition:Der Wert "[0]" kann nicht gelöscht werden, solange er als Bedingungswert für das Unterfeld "[1]" des Feldes "[2]" von Kategorie "[3]" konfiguriert ist.`,
            level: 'danger'
        };
        this.msgs[M.CONFIGURATION_ERROR_INVALID_REFERENCE] = {
            content: $localize `:@@messages.configuration.error.invalidReference:"[0]" ist keine gültige URL. Bitte geben Sie als Verweise ausschließlich URLs an.`,
            level: 'danger'
        };
        this.msgs[M.CONFIGURATION_ERROR_INVALID_RESOURCE_LIMIT_NOT_A_NUMBER] = {
            content: $localize `:@@messages.configuration.error.invalidResourceLimit.notANumber:Bitte geben Sie einen Zahlenwert als Ressourcenlimit an.`,
            level: 'danger'
        };
        this.msgs[M.CONFIGURATION_ERROR_INVALID_RESOURCE_LIMIT_TOO_LOW] = {
            content: $localize `:@@messages.configuration.error.invalidResourceLimit.tooLow:Bitte geben Sie als Ressourcenlimit eine Zahl an, die größer ist als 0.`,
            level: 'danger'
        };
        this.msgs[M.CONFIGURATION_ERROR_IMPORT_FAILURE] = {
            content: $localize `:@@messages.configuration.error.importFailure:Die Projektkonfiguration konnte nicht importiert werden.`,
            level: 'danger'
        };
        this.msgs[M.CONFIGURATION_ERROR_IMPORT_UNSUPPORTED_VERSION] = {
            content: $localize `:@@messages.configuration.error.unsupportedVersion:Die Konfigurationsdatei wurde mit einer aktuelleren Version von Field Desktop (Version [0]) erstellt und kann daher nicht geladen werden. Bitte aktualisieren Sie die Anwendung und starten Sie den Importvorgang anschließend erneut.`,
            level: 'danger'
        };
        this.msgs[M.CONFIGURATION_ERROR_NO_PROJECT_LANGUAGES] = {
            content: $localize `:@@messages.configuration.error.noProjectLanguages:Bitte wählen Sie mindestens eine Projektsprache aus.`,
            level: 'danger'
        };
        this.msgs[M.CONFIGURATION_ERROR_NO_ALLOWED_TARGET_CATEGORIES] = {
            content: $localize `:@@configuration.error.noAllowedTargetCategories:Bitte wählen Sie mindestens eine Kategorie als erlaubte Zielkategorie aus.`,
            level: 'danger'
        };
        this.msgs[M.MATRIX_ERROR_GENERIC] = {
            content: $localize `:@@messages.matrix.error.generic:Bei der Generierung der Matrix ist ein Fehler aufgetreten.`,
            level: 'danger'
        };
    }
}
