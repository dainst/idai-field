import { ImageDocument, ImageStore, ImageVariant } from 'idai-field-core';

import { electronCrypto as crypto, electronFs as fs, electronRemote as remote } from 'src/app/electron/electron';

const ERROR_ORIGINAL_IMAGE_FILE_NOT_FOUND: string = 'exportImages.error.originalImageFileNotFound';
export const FIELDWORK_IMAGE_EXPORT_MANIFEST_VERSION = 2;
export const FIELDWORK_IMAGE_EXPORT_MANIFEST_FILENAME = 'fieldwork-image-export-manifest.json';
export const FIELDWORK_IMAGE_EXPORT_CSV_MANIFEST_FILENAME = 'fieldwork-image-export-manifest.csv';
export const FIELDWORK_IMAGE_EXPORT_README_FILENAME = 'fieldwork-image-export-readme.txt';
const UTF8_BOM = '\uFEFF';
const INVALID_EXPORT_FILENAME_CHARACTERS = /[<>:"/\\|?*\u0000-\u001F]/g;
const RESERVED_WINDOWS_FILENAME_PATTERN = /^(con|prn|aux|nul|com[1-9]|lpt[1-9])(\..*)?$/i;

type ManifestValue = string|number|boolean|any[]|Record<string, any>;

export interface FieldworkImageExportManifest {
    manifestVersion: number;
    generatedAt: string;
    desktopAppVersion?: string;
    project: string;
    projectContext: Record<string, ManifestValue>;
    imageCount: number;
    images: FieldworkImageExportManifestEntry[];
}

export interface FieldworkImageExportManifestEntry {
    id: string;
    identifier: string;
    category: string;
    exportedFilename: string;
    exportedFileSizeBytes?: number;
    exportedFileMd5?: string;
    exportedFileSha256?: string;
    sourceFileSizeBytes?: number;
    sourceFileMd5?: string;
    sourceFileSha256?: string;
    tabletUploadMd5MatchesSourceFile?: boolean;
    tabletUploadSizeMatchesSourceFile?: boolean;
    fieldHubStoredMd5MatchesSourceFile?: boolean;
    fieldHubStoredSizeMatchesSourceFile?: boolean;
    fieldHubStoredSha256MatchesSourceFile?: boolean;
    originalFilename?: string;
    relations?: Record<string, string[]>;
    relatedDocuments?: FieldworkImageExportRelatedDocument[];
    fieldContext: Record<string, ManifestValue>;
}

export interface FieldworkImageExportRelatedDocument {
    relation: string;
    id: string;
    identifier: string;
    category: string;
    recordRelations?: Record<string, string[]>;
    recordContext?: Record<string, ManifestValue>;
}

export type FieldworkImageExportRelatedDocumentIndex = Record<string, {
    id: string;
    identifier: string;
    category: string;
    resource?: Record<string, any>;
}>;

const FIELD_CONTEXT_FIELDS: string[] = [
    'fieldworkPhotoUri',
    'fieldworkPhotoCapturedAt',
    'fieldworkPhotoSizeHintKb',
    'fieldworkPhotoQuality',
    'soilProfilePhotoUri',
    'soilProfilePhotoCapturedAt',
    'soilProfilePhotoSizeHintKb',
    'soilProfilePhotoQuality',
    'fieldworkImageUploadStatus',
    'fieldworkImageUploadedAt',
    'fieldworkImageUploadedUri',
    'fieldworkImageUploadTarget',
    'fieldworkImageUploadedProject',
    'fieldworkImageUploadedSizeBytes',
    'fieldworkImageUploadedMd5',
    'fieldworkImageStoredSizeBytes',
    'fieldworkImageStoredMd5',
    'fieldworkImageStoredSha256',
    'digitalSourcePreservation',
    'mediaEvidenceRole',
    'mediaQualityCheck',
    'reportCrossCheck',
    'photoCaptureSafetyReview',
    'artifactPhotoCaptureStandard',
    'artifactPhotoLightingControl',
    'artifactPhotoViewPlan',
    'soilProfileLayerMarkers',
    'soilProfileLayerIds',
    'soilColorCaptureCondition',
    'soilColorAssistCandidates',
    'soilColorAssistStatus',
    'soilProfileColorSwatches',
    'soilProfileColorNote',
    'soilProfileCaptureNote',
    'width',
    'height',
    'georeference'
];

const PROJECT_CONTEXT_FIELDS: string[] = [
    'shortName',
    'shortDescription',
    'projectInvestigationMode',
    'projectBoundarySetupState',
    'projectBoundarySummary',
    'coordinateReferenceSystem',
    'projectBoundary',
    'geometry'
];

const CSV_MANIFEST_FIELDS: string[] = [
    'project',
    'generatedAt',
    'desktopAppVersion',
    'projectShortName',
    'projectShortDescription',
    'projectInvestigationMode',
    'projectBoundarySetupState',
    'projectBoundarySummary',
    'projectCoordinateReferenceSystem',
    'projectBoundary',
    'projectGeometry',
    'id',
    'identifier',
    'category',
    'exportedFilename',
    'sourceFileSizeBytes',
    'originalFilename',
    'relations',
    'relatedDocuments',
    'relatedDocumentContexts',
    ...FIELD_CONTEXT_FIELDS,
    'sourceFileMd5',
    'sourceFileSha256',
    'tabletUploadMd5MatchesSourceFile',
    'tabletUploadSizeMatchesSourceFile',
    'fieldHubStoredMd5MatchesSourceFile',
    'fieldHubStoredSizeMatchesSourceFile',
    'fieldHubStoredSha256MatchesSourceFile',
    'exportedFileSizeBytes',
    'exportedFileMd5',
    'exportedFileSha256'
];

const RELATED_DOCUMENT_CONTEXT_FIELDS: string[] = [
    'shortDescription',
    'date',
    'period',
    'dating',
    'fieldIdentifier',
    'reportIdentifier',
    'identifierRevisionHistory',
    'identifierRevisionNote',
    'featureType',
    'featureRecordingStatus',
    'featureInvestigationChecklist',
    'featureGeometryReferenceLayerId',
    'featureGeometryEditStatus',
    'featureGeometryRevisionHistory',
    'longAxisOrientation',
    'orientationReference',
    'orientationNote',
    'interpretationArgument',
    'layerSequenceNumber',
    'layerSequenceMeaning',
    'layerThicknessApprox',
    'layerBoundaryDescription',
    'layerBoundarySurfaceRecord',
    'layerNamingSystem',
    'paleolithicCulturalLayerReview',
    'alluvialLayerConceptAudit',
    'samplePurpose',
    'artifactLabelRegisterLink',
    'geometry'
];


/**
 * 
 * @author Thomas Kleinke
 */
export function exportImages(imageStore: ImageStore, imageDocuments: Array<ImageDocument>,
                             targetDirectoryPath: string, project: string,
                             useOriginalFilenames: boolean,
                             relatedDocumentsById: FieldworkImageExportRelatedDocumentIndex = {},
                             projectContextResource: Record<string, any> = {}):
                             FieldworkImageExportManifest {

    const exportedFiles = copyImageFiles(imageStore, imageDocuments, targetDirectoryPath, project, useOriginalFilenames);
    const manifest = buildFieldworkImageExportManifest(
        project,
        exportedFiles,
        relatedDocumentsById,
        projectContextResource
    );
    writeFieldworkImageExportManifest(targetDirectoryPath, manifest);

    return manifest;
}


function copyImageFiles(imageStore: ImageStore, imageDocuments: Array<ImageDocument>,
                        targetDirectoryPath: string, project: string,
                        useOriginalFilenames: boolean): Array<{ imageDocument: ImageDocument,
                            exportedFilename: string, exportedFileSizeBytes?: number, exportedFileMd5?: string,
                            exportedFileSha256?: string, sourceFileSizeBytes?: number, sourceFileMd5?: string,
                            sourceFileSha256?: string }> {

    const imagesDirectoryPath: string = imageStore.getDirectoryPath(project, ImageVariant.ORIGINAL);
    const usedFilenames: Set<string> = new Set();

    return imageDocuments.map(imageDocument => {
        const exportedFilename = getUniqueExportFileName(
            getTargetFileName(imageDocument, useOriginalFilenames),
            usedFilenames
        );
        const sourceFilePath = imagesDirectoryPath + imageDocument.resource.id;
        const exportedFilePath = getExportedFilePath(targetDirectoryPath, exportedFilename);
        const sourceFileMetadata = getExistingSourceFileMetadata(sourceFilePath, imageDocument);

        copyImageFile(sourceFilePath, exportedFilePath);
        const exportedFileMetadata = getExportedFileMetadata(exportedFilePath);

        return { imageDocument, exportedFilename, ...sourceFileMetadata, ...exportedFileMetadata };
    });
}


function getExistingSourceFileMetadata(sourceFilePath: string, imageDocument: ImageDocument):
        { sourceFileSizeBytes?: number, sourceFileMd5?: string, sourceFileSha256?: string } {

    if (!fs.existsSync(sourceFilePath)) {
        throw [ERROR_ORIGINAL_IMAGE_FILE_NOT_FOUND, imageDocument.resource.identifier];
    }

    const fileMetadata = getFileMetadata(sourceFilePath);

    return {
        sourceFileSizeBytes: fileMetadata.fileSizeBytes,
        sourceFileMd5: fileMetadata.fileMd5,
        sourceFileSha256: fileMetadata.fileSha256
    };
}


function getExportedFileMetadata(exportedFilePath: string):
        { exportedFileSizeBytes?: number, exportedFileMd5?: string, exportedFileSha256?: string } {

    const fileMetadata = getFileMetadata(exportedFilePath);

    return {
        exportedFileSizeBytes: fileMetadata.fileSizeBytes,
        exportedFileMd5: fileMetadata.fileMd5,
        exportedFileSha256: fileMetadata.fileSha256
    };
}


function getFileMetadata(filePath: string): { fileSizeBytes?: number, fileMd5?: string, fileSha256?: string } {

    const fileData = getFileData(filePath);

    return {
        fileSizeBytes: typeof fs.statSync === 'function'
            ? fs.statSync(filePath).size
            : undefined,
        fileMd5: fileData ? getFileHash(fileData, 'md5') : undefined,
        fileSha256: fileData ? getFileHash(fileData, 'sha256') : undefined
    };
}


function getFileData(filePath: string): any|undefined {

    return typeof fs.readFileSync === 'function' && typeof crypto?.createHash === 'function'
        ? fs.readFileSync(filePath)
        : undefined;
}


function getFileHash(fileData: any, algorithm: 'md5'|'sha256'): string {

    return crypto.createHash(algorithm)
        .update(fileData)
        .digest('hex');
}


function copyImageFile(sourceFilePath: string, exportedFilePath: string) {

    fs.copyFileSync(
        sourceFilePath,
        exportedFilePath
    );
}


function getExportedFilePath(targetDirectoryPath: string, targetFileName: string): string {

    return targetDirectoryPath + '/' + targetFileName;
}


function getTargetFileName(imageDocument: ImageDocument, useOriginalFilename: boolean): string {

    if (useOriginalFilename) {
        return sanitizeExportFileName(
            imageDocument.resource.originalFilename
                || imageDocument.resource.identifier
                || imageDocument.resource.id,
            imageDocument.resource.id
        );
    } else {
        let targetFileName: string = imageDocument.resource.identifier || imageDocument.resource.id;
        const fileExtension: string = ImageDocument.getOriginalFileExtension(imageDocument);
        if (fileExtension && !targetFileName.toLowerCase().endsWith('.' + fileExtension)) {
            targetFileName += '.' + fileExtension;
        }
        return sanitizeExportFileName(targetFileName, imageDocument.resource.id);
    }
}


function sanitizeExportFileName(fileName: string|undefined, fallback: string): string {

    return sanitizeExportFileNameCandidate(fileName)
        || sanitizeExportFileNameCandidate(fallback)
        || 'image';
}


function sanitizeExportFileNameCandidate(fileName: string|undefined): string|undefined {

    if (!fileName) return undefined;

    let sanitized = fileName
        .replace(INVALID_EXPORT_FILENAME_CHARACTERS, '_')
        .replace(/\s+/g, ' ')
        .trim()
        .replace(/[. ]+$/g, '');

    if (!sanitized) return undefined;
    if (RESERVED_WINDOWS_FILENAME_PATTERN.test(sanitized)) sanitized = '_' + sanitized;

    return sanitized;
}


function getUniqueExportFileName(fileName: string, usedFilenames: Set<string>): string {

    let uniqueFileName = fileName;
    let suffix = 2;

    while (usedFilenames.has(uniqueFileName.toLowerCase())) {
        uniqueFileName = appendFileNameSuffix(fileName, `_${suffix}`);
        suffix++;
    }

    usedFilenames.add(uniqueFileName.toLowerCase());

    return uniqueFileName;
}


function appendFileNameSuffix(fileName: string, suffix: string): string {

    const extensionStart = fileName.lastIndexOf('.');

    return extensionStart > 0
        ? fileName.substring(0, extensionStart) + suffix + fileName.substring(extensionStart)
        : fileName + suffix;
}


function buildFieldworkImageExportManifest(project: string,
                                           exportedFiles: Array<{ imageDocument: ImageDocument,
                                               exportedFilename: string, exportedFileSizeBytes?: number,
                                               exportedFileMd5?: string, exportedFileSha256?: string,
                                               sourceFileSizeBytes?: number, sourceFileMd5?: string,
                                               sourceFileSha256?: string }>,
                                           relatedDocumentsById: FieldworkImageExportRelatedDocumentIndex,
                                           projectContextResource: Record<string, any>):
                                           FieldworkImageExportManifest {

    return {
        manifestVersion: FIELDWORK_IMAGE_EXPORT_MANIFEST_VERSION,
        generatedAt: new Date().toISOString(),
        ...getDesktopAppVersionEntry(),
        project,
        projectContext: getProjectContext(projectContextResource),
        imageCount: exportedFiles.length,
        images: exportedFiles.map(({ imageDocument, exportedFilename, exportedFileSizeBytes, exportedFileMd5,
            exportedFileSha256, sourceFileSizeBytes, sourceFileMd5, sourceFileSha256 }) => ({
            id: imageDocument.resource.id,
            identifier: getResourceIdentifier(imageDocument.resource),
            category: imageDocument.resource.category,
            exportedFilename,
            ...(exportedFileSizeBytes !== undefined ? { exportedFileSizeBytes } : {}),
            ...(exportedFileMd5 ? { exportedFileMd5 } : {}),
            ...(exportedFileSha256 ? { exportedFileSha256 } : {}),
            ...(sourceFileSizeBytes !== undefined ? { sourceFileSizeBytes } : {}),
            ...(sourceFileMd5 ? { sourceFileMd5 } : {}),
            ...(sourceFileSha256 ? { sourceFileSha256 } : {}),
            ...getTabletUploadMd5MatchEntry(imageDocument, sourceFileMd5),
            ...getTabletUploadSizeMatchEntry(imageDocument, sourceFileSizeBytes),
            ...getFieldHubStoredMetadataMatchEntries(
                imageDocument,
                sourceFileSizeBytes,
                sourceFileMd5,
                sourceFileSha256
            ),
            ...(imageDocument.resource.originalFilename
                ? { originalFilename: imageDocument.resource.originalFilename }
                : {}),
            ...(hasExportableRelations(imageDocument.resource.relations)
                ? { relations: copyRelations(imageDocument.resource.relations) }
                : {}),
            ...getRelatedDocumentsEntry(imageDocument, relatedDocumentsById),
            fieldContext: getFieldContext(imageDocument)
        }))
    };
}


function getTabletUploadMd5MatchEntry(imageDocument: ImageDocument,
                                      sourceFileMd5: string|undefined): { tabletUploadMd5MatchesSourceFile?: boolean } {

    const uploadedMd5 = getTextValue((imageDocument.resource as Record<string, any>).fieldworkImageUploadedMd5);

    return uploadedMd5 && sourceFileMd5
        ? { tabletUploadMd5MatchesSourceFile: uploadedMd5.toLowerCase() === sourceFileMd5.toLowerCase() }
        : {};
}


function getDesktopAppVersionEntry(): { desktopAppVersion?: string } {

    const version = getTextValue(remote?.app?.getVersion?.());

    return version ? { desktopAppVersion: version } : {};
}


function getTabletUploadSizeMatchEntry(imageDocument: ImageDocument,
                                       sourceFileSizeBytes: number|undefined):
        { tabletUploadSizeMatchesSourceFile?: boolean } {

    const uploadedSizeBytes = getNumberValue(
        (imageDocument.resource as Record<string, any>).fieldworkImageUploadedSizeBytes
    );

    return uploadedSizeBytes !== undefined && sourceFileSizeBytes !== undefined
        ? { tabletUploadSizeMatchesSourceFile: uploadedSizeBytes === sourceFileSizeBytes }
        : {};
}


function getFieldHubStoredMetadataMatchEntries(imageDocument: ImageDocument,
                                               sourceFileSizeBytes: number|undefined,
                                               sourceFileMd5: string|undefined,
                                               sourceFileSha256: string|undefined):
        { fieldHubStoredMd5MatchesSourceFile?: boolean, fieldHubStoredSizeMatchesSourceFile?: boolean,
            fieldHubStoredSha256MatchesSourceFile?: boolean } {

    const resource = imageDocument.resource as Record<string, any>;
    const storedSizeBytes = getNumberValue(resource.fieldworkImageStoredSizeBytes);
    const storedMd5 = getTextValue(resource.fieldworkImageStoredMd5);
    const storedSha256 = getTextValue(resource.fieldworkImageStoredSha256);

    return {
        ...(storedMd5 && sourceFileMd5
            ? { fieldHubStoredMd5MatchesSourceFile: storedMd5.toLowerCase() === sourceFileMd5.toLowerCase() }
            : {}),
        ...(storedSizeBytes !== undefined && sourceFileSizeBytes !== undefined
            ? { fieldHubStoredSizeMatchesSourceFile: storedSizeBytes === sourceFileSizeBytes }
            : {}),
        ...(storedSha256 && sourceFileSha256
            ? { fieldHubStoredSha256MatchesSourceFile: storedSha256.toLowerCase() === sourceFileSha256.toLowerCase() }
            : {})
    };
}


function writeFieldworkImageExportManifest(targetDirectoryPath: string, manifest: FieldworkImageExportManifest) {

    fs.writeFileSync(
        targetDirectoryPath + '/' + FIELDWORK_IMAGE_EXPORT_MANIFEST_FILENAME,
        JSON.stringify(manifest, null, 2),
        'utf8'
    );
    fs.writeFileSync(
        targetDirectoryPath + '/' + FIELDWORK_IMAGE_EXPORT_CSV_MANIFEST_FILENAME,
        buildFieldworkImageExportCsvManifest(manifest),
        'utf8'
    );
    fs.writeFileSync(
        targetDirectoryPath + '/' + FIELDWORK_IMAGE_EXPORT_README_FILENAME,
        buildFieldworkImageExportReadme(manifest),
        'utf8'
    );
}


function buildFieldworkImageExportReadme(manifest: FieldworkImageExportManifest): string {

    return UTF8_BOM + [
        '한국 현장조사 이미지 인계 메모',
        '',
        `프로젝트: ${manifest.project}`,
        `생성 시각: ${manifest.generatedAt}`,
        `Field Desktop version(desktopAppVersion): ${formatReadmeValue(manifest.desktopAppVersion)}`,
        `이미지 수: ${manifest.imageCount}`,
        '',
        '프로젝트 현장 맥락',
        `- 조사 방식(projectInvestigationMode): ${formatReadmeValue(manifest.projectContext.projectInvestigationMode)}`,
        `- 경계 상태(projectBoundarySetupState): ${formatReadmeValue(manifest.projectContext.projectBoundarySetupState)}`,
        `- 경계 요약(projectBoundarySummary): ${formatReadmeValue(manifest.projectContext.projectBoundarySummary)}`,
        `- 좌표계(coordinateReferenceSystem): ${formatReadmeValue(manifest.projectContext.coordinateReferenceSystem)}`,
        '',
        '함께 생성된 파일',
        `- ${FIELDWORK_IMAGE_EXPORT_MANIFEST_FILENAME}: 장기 보존용 전체 JSON manifest입니다.`,
        `- ${FIELDWORK_IMAGE_EXPORT_CSV_MANIFEST_FILENAME}: 스프레드시트 확인용 CSV manifest입니다.`,
        '- 내보낸 이미지 파일: 데스크톱 이미지 저장소에서 복사한 원본 파일입니다.',
        '',
        '무결성 확인',
        '- fieldworkImageUploadedMd5: 태블릿에서 Field Hub로 업로드할 때 기록한 원본 MD5입니다.',
        '- sourceFileMd5: 내보내기 시점 데스크톱 원본 파일의 MD5입니다.',
        '- tabletUploadMd5MatchesSourceFile: 태블릿 업로드 MD5와 데스크톱 원본 MD5의 일치 여부입니다.',
        '- tabletUploadSizeMatchesSourceFile: 태블릿 업로드 원본 크기와 데스크톱 원본 파일 크기의 일치 여부입니다.',
        '- fieldHubStoredSha256MatchesSourceFile: Field Hub 저장본 SHA-256과 데스크톱 원본 SHA-256의 일치 여부입니다.',
        '- exportedFileSha256: 이 폴더에 복사된 파일을 장기 보존용으로 재확인할 SHA-256입니다.',
        '',
        '이미지 색인',
        ...manifest.images.map(getReadmeImageLine)
    ].join('\n') + '\n';
}


function buildFieldworkImageExportCsvManifest(manifest: FieldworkImageExportManifest): string {

    const rows = [
        CSV_MANIFEST_FIELDS,
        ...manifest.images.map(entry => CSV_MANIFEST_FIELDS.map(fieldName => {
            return getCsvManifestValue(manifest, entry, fieldName);
        }))
    ];

    return UTF8_BOM + rows
        .map(row => row.map(escapeCsvValue).join(','))
        .join('\n') + '\n';
}


function getCsvManifestValue(manifest: FieldworkImageExportManifest,
                             entry: FieldworkImageExportManifestEntry,
                             fieldName: string): string {

    switch (fieldName) {
        case 'project':
            return manifest.project;
        case 'generatedAt':
            return manifest.generatedAt;
        case 'desktopAppVersion':
            return formatManifestValue(manifest.desktopAppVersion);
        case 'projectShortName':
            return formatManifestValue(manifest.projectContext.shortName);
        case 'projectShortDescription':
            return formatManifestValue(manifest.projectContext.shortDescription);
        case 'projectInvestigationMode':
            return formatManifestValue(manifest.projectContext.projectInvestigationMode);
        case 'projectBoundarySetupState':
            return formatManifestValue(manifest.projectContext.projectBoundarySetupState);
        case 'projectBoundarySummary':
            return formatManifestValue(manifest.projectContext.projectBoundarySummary);
        case 'projectCoordinateReferenceSystem':
            return formatManifestValue(manifest.projectContext.coordinateReferenceSystem);
        case 'projectBoundary':
            return formatManifestValue(manifest.projectContext.projectBoundary);
        case 'projectGeometry':
            return formatManifestValue(manifest.projectContext.geometry);
        case 'id':
            return entry.id;
        case 'identifier':
            return entry.identifier;
        case 'category':
            return entry.category;
        case 'exportedFilename':
            return entry.exportedFilename;
        case 'exportedFileSizeBytes':
            return entry.exportedFileSizeBytes?.toString() ?? '';
        case 'exportedFileMd5':
            return entry.exportedFileMd5 ?? '';
        case 'exportedFileSha256':
            return entry.exportedFileSha256 ?? '';
        case 'sourceFileSizeBytes':
            return entry.sourceFileSizeBytes?.toString() ?? '';
        case 'sourceFileMd5':
            return entry.sourceFileMd5 ?? '';
        case 'sourceFileSha256':
            return entry.sourceFileSha256 ?? '';
        case 'tabletUploadMd5MatchesSourceFile':
            return entry.tabletUploadMd5MatchesSourceFile === undefined
                ? ''
                : entry.tabletUploadMd5MatchesSourceFile.toString();
        case 'tabletUploadSizeMatchesSourceFile':
            return entry.tabletUploadSizeMatchesSourceFile === undefined
                ? ''
                : entry.tabletUploadSizeMatchesSourceFile.toString();
        case 'fieldHubStoredMd5MatchesSourceFile':
            return entry.fieldHubStoredMd5MatchesSourceFile === undefined
                ? ''
                : entry.fieldHubStoredMd5MatchesSourceFile.toString();
        case 'fieldHubStoredSizeMatchesSourceFile':
            return entry.fieldHubStoredSizeMatchesSourceFile === undefined
                ? ''
                : entry.fieldHubStoredSizeMatchesSourceFile.toString();
        case 'fieldHubStoredSha256MatchesSourceFile':
            return entry.fieldHubStoredSha256MatchesSourceFile === undefined
                ? ''
                : entry.fieldHubStoredSha256MatchesSourceFile.toString();
        case 'originalFilename':
            return entry.originalFilename ?? '';
        case 'relations':
            return entry.relations ? formatRelations(entry.relations) : '';
        case 'relatedDocuments':
            return entry.relatedDocuments ? formatRelatedDocuments(entry.relatedDocuments) : '';
        case 'relatedDocumentContexts':
            return entry.relatedDocuments ? formatRelatedDocumentContexts(entry.relatedDocuments) : '';
        default:
            return formatManifestValue(entry.fieldContext[fieldName]);
    }
}


function formatRelations(relations: Record<string, string[]>): string {

    return Object.entries(relations)
        .map(([relationName, targets]) => `${relationName}:${targets.join('|')}`)
        .join('; ');
}


function formatRelatedDocuments(relatedDocuments: FieldworkImageExportRelatedDocument[]): string {

    return relatedDocuments
        .map(document => `${document.relation}:${document.category}/${document.identifier}(${document.id})`)
        .join('; ');
}


function formatRelatedDocumentContexts(relatedDocuments: FieldworkImageExportRelatedDocument[]): string {

    return relatedDocuments
        .filter(document => hasExportableRelations(document.recordRelations) || hasExportableRecordContext(document))
        .map(document => {
            const details = [
                document.recordRelations ? `relations=${formatRelations(document.recordRelations)}` : '',
                document.recordContext ? formatContext(document.recordContext) : ''
            ].filter(hasExportableValue).join('; ');

            return `${document.relation}:${document.category}/${document.identifier}(${document.id}){${details}}`;
        })
        .join(' | ');
}


function formatContext(context: Record<string, ManifestValue>): string {

    return Object.entries(context)
        .map(([fieldName, value]) => `${fieldName}=${formatManifestValue(value)}`)
        .join('; ');
}


function formatManifestValue(value: ManifestValue|undefined): string {

    if (value === undefined || value === null) return '';
    if (Array.isArray(value)) {
        return value.map(entry => typeof entry === 'object'
            ? JSON.stringify(entry)
            : entry.toString()
        ).join('; ');
    }
    if (typeof value === 'object') return JSON.stringify(value);

    return value.toString();
}


function formatReadmeValue(value: ManifestValue|undefined): string {

    const formattedValue = formatManifestValue(value)
        .replace(/\s+/g, ' ')
        .trim();

    return formattedValue || '-';
}


function getReadmeImageLine(entry: FieldworkImageExportManifestEntry): string {

    const details = [
        entry.relatedDocuments?.length
            ? `관련 기록: ${formatReadmeValue(formatRelatedDocuments(entry.relatedDocuments))}`
            : '',
        entry.tabletUploadMd5MatchesSourceFile !== undefined
            ? `태블릿 MD5 일치: ${entry.tabletUploadMd5MatchesSourceFile}`
            : '',
        entry.tabletUploadSizeMatchesSourceFile !== undefined
            ? `태블릿 크기 일치: ${entry.tabletUploadSizeMatchesSourceFile}`
            : '',
        entry.fieldHubStoredSha256MatchesSourceFile !== undefined
            ? `Field Hub SHA-256 일치: ${entry.fieldHubStoredSha256MatchesSourceFile}`
            : ''
    ].filter(hasExportableValue).join('; ');

    return [
        `- ${formatReadmeValue(entry.exportedFilename)}: ${entry.category}/${formatReadmeValue(entry.identifier)} (${entry.id})`,
        details ? `; ${details}` : ''
    ].join('');
}


function escapeCsvValue(value: string): string {

    const spreadsheetSafeValue = neutralizeSpreadsheetFormula(value);

    return /[",\n\r]/.test(spreadsheetSafeValue)
        ? `"${spreadsheetSafeValue.replace(/"/g, '""')}"`
        : spreadsheetSafeValue;
}


function neutralizeSpreadsheetFormula(value: string): string {

    return /^[\s]*[=+\-@]/.test(value)
        ? `'${value}`
        : value;
}


function getFieldContext(imageDocument: ImageDocument): Record<string, ManifestValue> {

    return getContext(imageDocument.resource as Record<string, any>, FIELD_CONTEXT_FIELDS);
}


function getProjectContext(projectContextResource: Record<string, any>): Record<string, ManifestValue> {

    return getContext(projectContextResource, PROJECT_CONTEXT_FIELDS);
}


function getTextValue(value: unknown): string|undefined {

    return typeof value === 'string' && value.trim().length > 0
        ? value.trim()
        : undefined;
}


function getNumberValue(value: unknown): number|undefined {

    if (typeof value === 'number' && Number.isFinite(value)) return value;

    if (typeof value === 'string' && value.trim().length > 0) {
        const parsed = Number(value);
        if (Number.isFinite(parsed)) return parsed;
    }

    return undefined;
}


function getContext(resource: Record<string, any>, fieldNames: string[]): Record<string, ManifestValue> {

    const context: Record<string, ManifestValue> = {};

    fieldNames.forEach(fieldName => {
        if (!hasExportableValue(resource[fieldName])) return;

        context[fieldName] = copyManifestValue(resource[fieldName]);
    });

    return context;
}


function getRelatedDocumentsEntry(imageDocument: ImageDocument,
                                  relatedDocumentsById: FieldworkImageExportRelatedDocumentIndex):
                                  { relatedDocuments?: FieldworkImageExportRelatedDocument[] } {

    const relatedDocuments = Object.entries(imageDocument.resource.relations ?? {})
        .flatMap(([relation, targetIds]) => targetIds.map(targetId => {
            const relatedDocument = relatedDocumentsById[targetId];
            if (!relatedDocument) return undefined;

            return {
                relation,
                id: relatedDocument.id,
                identifier: getResourceIdentifier(relatedDocument),
                category: relatedDocument.category,
                ...getRelatedDocumentRecordRelationsEntry(relatedDocument.resource),
                ...getRelatedDocumentRecordContextEntry(relatedDocument.resource)
            };
        }))
        .filter((document): document is FieldworkImageExportRelatedDocument => !!document);

    return relatedDocuments.length > 0
        ? { relatedDocuments }
        : {};
}


function getRelatedDocumentRecordRelationsEntry(resource: Record<string, any>|undefined):
        { recordRelations?: Record<string, string[]> } {

    return resource && hasExportableRelations(resource.relations)
        ? { recordRelations: copyRelations(resource.relations) }
        : {};
}


function getRelatedDocumentRecordContextEntry(resource: Record<string, any>|undefined):
        { recordContext?: Record<string, ManifestValue> } {

    if (!resource) return {};

    const recordContext = getContext(resource, RELATED_DOCUMENT_CONTEXT_FIELDS);

    return Object.keys(recordContext).length > 0
        ? { recordContext }
        : {};
}


function getResourceIdentifier(resource: { id: string, identifier?: string }): string {

    return getTextValue(resource.identifier) ?? resource.id;
}


function hasExportableRelations(relations: Record<string, string[]>|undefined): boolean {

    return !!relations && Object.values(relations).some(hasExportableValue);
}


function copyRelations(relations: Record<string, string[]>): Record<string, string[]> {

    return Object.entries(relations).reduce((result: Record<string, string[]>, [relationName, targets]) => {
        if (hasExportableValue(targets)) result[relationName] = [...targets];

        return result;
    }, {});
}


function hasExportableValue(value: any): boolean {

    return value !== undefined
        && value !== null
        && value !== ''
        && (!Array.isArray(value) || value.length > 0);
}


function copyManifestValue(value: ManifestValue): ManifestValue {

    if (typeof value === 'object') return JSON.parse(JSON.stringify(value));

    return value;
}


function hasExportableRecordContext(document: FieldworkImageExportRelatedDocument): boolean {

    return !!document.recordContext && Object.keys(document.recordContext).length > 0;
}
