#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const repoRoot = path.resolve(__dirname, '..');
const findings = [];
const FIELDWORK_IMAGE_UPLOAD_AUDIT_FIELDS = [
  'fieldworkImageUploadStatus',
  'fieldworkImageUploadedAt',
  'fieldworkImageUploadedUri',
  'fieldworkImageUploadTarget',
  'fieldworkImageUploadedProject',
  'fieldworkImageUploadedSizeBytes',
  'fieldworkImageUploadedMd5',
  'fieldworkImageStoredSizeBytes',
  'fieldworkImageStoredMd5',
  'fieldworkImageStoredSha256'
];

const files = {
  coreImageStore: readTextFile('core/src/datastore/image/image-store.ts'),
  coreImageIndex: readTextFile('core/src/datastore/image/index.ts'),
  coreFieldHubFileUrl: readTextFile('core/src/datastore/image/field-hub-file-url.ts'),
  coreFieldHubFileUrlSpec: readTextFile('core/test/datastore/image/field-hub-file-url.spec.ts'),
  coreImageDocument: readTextFile('core/src/model/document/image-document.ts'),
  coreImageDocumentSpec: readTextFile('core/test/model/image-document.spec.ts'),
  coreReadiness: readTextFile('core/src/tools/korean-fieldwork-readiness.ts'),
  coreReadinessSpec: readTextFile('core/test/tools/korean-fieldwork-readiness.spec.ts'),
  koreanConfig: readJsonFile('core/config/Config-KoreanFieldwork.json'),
  koreanConfigSpec: readTextFile('core/test/configuration/korean-fieldwork-configuration.spec.ts'),
  mobileHook: readTextFile('mobile/hooks/use-fieldwork-image-sync.ts'),
  mobileHookSpec: readTextFile('mobile/hooks/use-fieldwork-image-sync.spec.ts'),
  mobilePreferences: readTextFile('mobile/hooks/use-preferences.ts'),
  mobilePreferencesSpec: readTextFile('mobile/hooks/use-preferences.spec.ts'),
  mobileCloseout: readTextFile('mobile/components/Project/korean-fieldwork-closeout.ts'),
  mobileCloseoutSpec: readTextFile('mobile/components/Project/korean-fieldwork-closeout.spec.ts'),
  desktopRemoteStore: readTextFile('desktop/src/app/services/imagestore/remote-image-store.ts'),
  desktopRemoteStoreSpec: readTextFile('desktop/test/unit/services/imagestore/remote-image-store.spec.ts'),
  desktopExpressServer: readTextFile('desktop/src/app/services/express-server/express-server.ts'),
  desktopExpressServerSpec: readTextFile('desktop/test/unit/services/express-server.spec.ts'),
  desktopExportImages: readTextFile('desktop/src/app/services/imagestore/export-images.ts'),
  desktopExportImagesSpec: readTextFile('desktop/test/unit/services/imagestore/export-images.spec.ts'),
  desktopImageExportModal: readTextFile('desktop/src/app/components/image/export/image-export-modal.component.ts'),
  desktopImageExportModalSpec:
    readTextFile('desktop/test/unit/components/images/export/image-export-modal.component.spec.ts'),
  desktopDownload: readTextFile('desktop/src/app/components/project/download-project.component.ts'),
  desktopDownloadSpec: readTextFile('desktop/test/unit/components/project/download-project.component.spec.ts'),
  desktopCloseout: readTextFile('desktop/src/app/util/korean-fieldwork-closeout.ts'),
  desktopCloseoutSpec: readTextFile('desktop/test/unit/util/korean-fieldwork-closeout.spec.ts'),
  serverRouter: readTextFile('server/lib/field_hub_web/router.ex'),
  serverFileController: readTextFile('server/lib/field_hub_web/rest/api/file.ex'),
  serverFileStore: readTextFile('server/lib/field_hub/file_store.ex'),
  serverFileControllerSpec:
    readTextFile('server/test/field_hub_web/controllers/api/file_controller_test.exs')
};

checkCoreImageVariantContract();
checkCoreImageDocumentContract();
checkCoreFieldHubFileUrlContract();
checkMobileUploadContract();
checkMobileSecurePreferencesContract();
checkDesktopRemoteStoreContract();
checkDesktopImageExportContract();
checkDesktopDownloadContract();
checkCoreReadinessAndConfigContract();
checkCloseoutUserTextContract();
checkFieldHubServerContract();
checkContractCoverage();

if (findings.length > 0) {
  console.error('Korean fieldwork media contract check failed:');
  findings.forEach((finding) => console.error(`- ${finding}`));
  process.exitCode = 1;
} else {
  console.log('Korean fieldwork media contract check passed.');
  console.log(
    'Verified tablet upload, secure sync settings, desktop download, Field Hub file API, media backup audit fields, and JSON/CSV/README export handover files.'
  );
}

function checkCoreImageVariantContract() {
  requireIncludes(
    files.coreImageStore,
    "ORIGINAL = 'original_image'",
    'core ImageVariant.ORIGINAL must stay aligned with Field Hub original_image query values'
  );
  requireIncludes(
    files.coreImageStore,
    "THUMBNAIL = 'thumbnail_image'",
    'core ImageVariant.THUMBNAIL must stay aligned with Field Hub thumbnail_image query values'
  );
}

function checkCoreImageDocumentContract() {
  requireIncludes(
    files.coreImageDocument,
    "originalFilename.lastIndexOf('.')",
    'core image document helper must inspect the last extension separator'
  );
  requireIncludes(
    files.coreImageDocument,
    'extensionSeparatorIndex === originalFilename.length - 1',
    'core image document helper must not fabricate extensions from names ending with a dot'
  );
  requireIncludes(
    files.coreImageDocumentSpec,
    'returns an empty extension if original filename has no extension',
    'core image document tests must cover extensionless original file names'
  );
  requireIncludes(
    files.coreImageDocumentSpec,
    'returns an empty extension if original filename ends with a dot',
    'core image document tests must cover trailing-dot original file names'
  );
}

function checkCoreFieldHubFileUrlContract() {
  const source = files.coreFieldHubFileUrl;

  requireIncludes(source, 'export function getFieldHubBaseUrl', 'core must own Field Hub base URL normalization');
  requireIncludes(source, '`/db/${project}`', 'core Field Hub URL helper must strip /db/<project>');
  requireIncludes(
    source,
    '`/db/${encodeURIComponent(project)}`',
    'core Field Hub URL helper must strip encoded /db/<project>'
  );
  requireIncludes(source, "'/db'", 'core Field Hub URL helper must strip /db');
  requireIncludes(source, 'export function buildFieldHubFileUrl', 'core must own Field Hub file URL construction');
  requireIncludes(source, "'files'", 'core Field Hub file URL helper must include the files path segment');
  requireIncludes(source, 'encodeURIComponent(project)', 'core Field Hub file URL helper must encode project path segments');
  requireIncludes(source, 'encodeURIComponent(uuid)', 'core Field Hub file URL helper must encode resource id path segments');
  requireIncludes(
    source,
    'export function buildFieldHubFileUrlWithType',
    'core must expose typed Field Hub file URLs for direct binary clients'
  );
  requireIncludes(source, 'encodeURIComponent(type)', 'core typed Field Hub file URL helper must encode type query values');
  requireIncludes(
    files.coreImageIndex,
    "export { buildFieldHubFileUrl, buildFieldHubFileUrlWithType, getFieldHubBaseUrl } from './field-hub-file-url'",
    'core image module must publicly export Field Hub file URL helpers'
  );
}

function checkMobileUploadContract() {
  const source = files.mobileHook;

  requireIncludes(source, 'FileSystem.uploadAsync', 'tablet media sync must use Expo file uploads');
  requireIncludes(
    source,
    'buildFieldHubFileUrlWithType',
    'tablet upload must use the core Field Hub typed file URL helper'
  );
  requireIncludes(
    source,
    'ImageVariant.ORIGINAL',
    'tablet upload URL must target the Field Hub original_image file endpoint through ImageVariant.ORIGINAL'
  );
  requireIncludes(source, "httpMethod: 'PUT'", 'tablet upload must use PUT');
  requireIncludes(
    source,
    'FileSystem.FileSystemUploadType.BINARY_CONTENT',
    'tablet upload must send raw binary content'
  );
  requireIncludes(
    source,
    "'Content-Type': 'application/octet-stream'",
    'tablet upload must use an octet-stream content type'
  );
  requireIncludes(
    source,
    "Authorization: `Basic ${base64Encode(project + ':' + projectSettings.password)}`",
    'tablet upload must use project-scoped Basic auth without embedding the password in the URL'
  );
  requireIncludes(
    source,
    'getCoreFieldHubBaseUrl(syncUrl, project)',
    'tablet base URL helper must delegate to the core Field Hub URL helper'
  );
  requireIncludes(source, "Image: ['imageUri', 'fieldworkPhotoUri', 'fileUri']", 'tablet sync must include legacy Image URI fields');
  requireIncludes(source, "Photo: ['fieldworkPhotoUri', 'imageUri', 'fileUri']", 'tablet sync must include Photo tablet URI fields');
  requireIncludes(source, "Drawing: ['fieldworkPhotoUri', 'imageUri', 'fileUri']", 'tablet sync must include Drawing tablet URI fields');
  requireIncludes(
    source,
    "SoilProfilePhoto: ['soilProfilePhotoUri', 'imageUri', 'fieldworkPhotoUri']",
    'tablet sync must include SoilProfilePhoto tablet URI fields'
  );
  requireIncludes(source, "/^(file|content):\\/\\//", 'tablet sync must upload local file:// and content:// URIs');
  requireIncludes(
    source,
    'fieldworkImageUploadStatus: FIELDWORK_IMAGE_UPLOAD_STATUS_UPLOADED',
    'tablet upload must record uploaded status on the document'
  );
  requireIncludes(source, 'fieldworkImageUploadedAt:', 'tablet upload must record upload time');
  requireIncludes(source, 'fieldworkImageUploadedUri: target.uri', 'tablet upload must record original tablet URI');
  requireIncludes(source, 'fieldworkImageUploadTarget: target.uploadUrl', 'tablet upload must record Field Hub target URL');
  requireIncludes(source, 'fieldworkImageUploadedProject: project', 'tablet upload must record project identifier');
  requireIncludes(
    source,
    'fieldworkImageUploadedSizeBytes',
    'tablet upload must record uploaded source byte sizes when file info is available'
  );
  requireIncludes(source, '{ md5: true }', 'tablet upload must request local MD5 hashes for file URI originals');
  requireIncludes(
    source,
    'fieldworkImageUploadedMd5',
    'tablet upload must record local file MD5 hashes when file info is available'
  );
  requireIncludes(
    source,
    'getFieldworkImageStoredMetadata',
    'tablet upload must parse Field Hub stored-file metadata from upload responses'
  );
  requireIncludes(
    source,
    'fieldworkImageStoredSizeBytes',
    'tablet upload must record Field Hub stored byte sizes from upload responses'
  );
  requireIncludes(
    source,
    'fieldworkImageStoredMd5',
    'tablet upload must record Field Hub stored MD5 hashes from upload responses'
  );
  requireIncludes(
    source,
    'fieldworkImageStoredSha256',
    'tablet upload must record Field Hub stored SHA-256 hashes from upload responses'
  );
  requireIncludes(source, 'parsedResponseBody.size_bytes', 'tablet upload must parse server size_bytes metadata');
  requireIncludes(source, 'parsedResponseBody.sha256', 'tablet upload must parse server SHA-256 metadata');
  requireIncludes(source, 'digitalSourcePreservation:', 'tablet upload must update preservation metadata');
  requireIncludes(source, "'originalDrawing'", 'tablet Drawing uploads must mark originalDrawing preservation');
  requireIncludes(source, "'originalPhoto'", 'tablet Photo uploads must mark originalPhoto preservation');
  requireIncludes(source, "'originalImage'", 'tablet Photo uploads must mark originalImage preservation');
  requireIncludes(source, "'webOrServerBackup'", 'tablet uploads must mark webOrServerBackup preservation');
  requireIncludes(source, "'backupVerified'", 'tablet uploads must mark backupVerified preservation');
  requireIncludes(
    source,
    'isFieldworkImageUploadRecordComplete',
    'tablet sync must avoid rewriting records that already have complete upload audit metadata'
  );
  requireIncludes(
    source,
    'isLatestDocumentStillMatchingUploadTarget',
    'tablet sync must not write stale upload audit metadata after a local image URI changes'
  );
  requireIncludes(
    source,
    'hasUploadTimestamp',
    'tablet sync must require upload timestamps before treating audit records as complete'
  );
  requireIncludes(
    source,
    'hasCompleteUploadSizeMetadata',
    'tablet sync must require file:// upload size metadata before treating audit records as complete'
  );
  requireIncludes(
    source,
    'isFileUploadMetadataMissing',
    'tablet sync must backfill missing file:// upload size and checksum metadata without binary reupload'
  );
  requireIncludes(
    source,
    'hasCompleteServerStoredMetadata',
    'tablet sync must require server-stored size and checksum metadata before treating audit records as complete'
  );
  requireIncludes(
    source,
    'isServerUploadMetadataMissing',
    'tablet sync must reupload older records that lack Field Hub stored-file metadata'
  );
}

function checkMobileSecurePreferencesContract() {
  const source = files.mobilePreferences;
  const spec = files.mobilePreferencesSpec;

  requireIncludes(
    source,
    "PROJECT_PASSWORDS_SECURE_STORAGE_KEY = 'preferences.projectPasswords'",
    'tablet preferences must store project sync passwords under a stable SecureStore key'
  );
  requireIncludes(
    source,
    "MAP_PROVIDER_SETTINGS_SECURE_STORAGE_KEY = 'preferences.mapProviderSettings'",
    'tablet preferences must store map provider API keys under a stable SecureStore key'
  );
  requireIncludes(
    source,
    'stripProjectPasswords: projectPasswordsSavedSecurely',
    'tablet preferences must only strip project passwords from AsyncStorage after SecureStore saves them'
  );
  requireIncludes(
    source,
    'stripMapProviderSettings: mapProviderSettingsSavedSecurely',
    'tablet preferences must only strip map provider keys from AsyncStorage after SecureStore saves them'
  );
  requireIncludes(
    source,
    'const saveSecureJson = async (key: string, value: unknown): Promise<boolean>',
    'tablet secure preference persistence must report failure instead of aborting AsyncStorage fallback saves'
  );
  requireIncludes(
    source,
    'return false;',
    'tablet secure preference persistence must allow fallback persistence when SecureStore fails'
  );
  requireIncludes(
    spec,
    'should preserve updated project passwords in AsyncStorage when secure persistence fails',
    'tablet preference tests must cover project password fallback when SecureStore fails'
  );
  requireIncludes(
    spec,
    'should preserve updated map provider keys in AsyncStorage when secure persistence fails',
    'tablet preference tests must cover map provider key fallback when SecureStore fails'
  );
}

function checkDesktopRemoteStoreContract() {
  const source = files.desktopRemoteStore;
  const expressSource = files.desktopExpressServer;

  requireIncludes(source, "method: 'put'", 'desktop remote image store must upload files with PUT');
  requireIncludes(source, 'buildFieldHubFileUrl(address, project, uuid)', 'desktop upload must use the core Field Hub file URL helper');
  requireIncludes(source, 'const params = type ? { type } : {};', 'desktop upload must send image variants as query params');
  requireIncludes(
    source,
    "'Content-Type': 'application/octet-stream'",
    'desktop upload must use an octet-stream content type'
  );
  requireIncludes(
    source,
    "Authorization: `Basic ${base64Encode(project + ':' + password)}`",
    'desktop upload must use Basic auth without embedding credentials in URLs'
  );
  requireIncludes(source, "params: { types }", 'desktop file listing must query Field Hub variant lists with types');
  requireIncludes(source, "responseType: 'arraybuffer'", 'desktop downloads must request binary image data');
  requireIncludes(source, "params: { type }", 'desktop downloads must query the requested image variant');
  requireIncludes(
    source,
    'buildFieldHubFileUrl(url, project)',
    'desktop file listing must use the core Field Hub file URL helper'
  );
  requireIncludes(
    source,
    'buildFieldHubFileUrl(url, project, uuid)',
    'desktop downloads must use the core Field Hub file URL helper'
  );
  requireIncludes(
    expressSource,
    'res.status(200).send(getStoredFileMetadata(req.body))',
    'desktop embedded Field Hub file API must return stored-file metadata for tablet upload audits'
  );
  requireIncludes(
    expressSource,
    'size_bytes: data.byteLength',
    'desktop embedded Field Hub file API must return uploaded byte sizes'
  );
  requireIncludes(
    expressSource,
    "getFileHash(data, 'sha256')",
    'desktop embedded Field Hub file API must return uploaded SHA-256 hashes'
  );
}

function checkDesktopImageExportContract() {
  const source = files.desktopExportImages;

  requireIncludes(
    source,
    'FIELDWORK_IMAGE_EXPORT_MANIFEST_FILENAME',
    'desktop image export must write a stable fieldwork manifest sidecar'
  );
  requireIncludes(
    source,
    'FIELDWORK_IMAGE_EXPORT_MANIFEST_VERSION = 2',
    'desktop image export manifest must version schema changes for long-term report handover'
  );
  requireIncludes(
    source,
    'desktopAppVersion',
    'desktop image export manifest must preserve the Field Desktop version that generated the handover package'
  );
  requireIncludes(
    source,
    'fieldwork-image-export-manifest.json',
    'desktop image export manifest must use a predictable filename for report handover'
  );
  requireIncludes(
    source,
    'FIELDWORK_IMAGE_EXPORT_CSV_MANIFEST_FILENAME',
    'desktop image export must write a stable CSV fieldwork manifest sidecar'
  );
  requireIncludes(
    source,
    'FIELDWORK_IMAGE_EXPORT_README_FILENAME',
    'desktop image export must write a human-readable fieldwork handover README sidecar'
  );
  requireIncludes(
    source,
    'fieldwork-image-export-manifest.csv',
    'desktop image export CSV manifest must use a predictable filename for spreadsheet handover'
  );
  requireIncludes(
    source,
    'fieldwork-image-export-readme.txt',
    'desktop image export README must use a predictable filename for report handover'
  );
  requireIncludes(
    source,
    'return UTF8_BOM + [',
    'desktop image export README must include a UTF-8 BOM for Korean text editor compatibility'
  );
  requireIncludes(
    source,
    'buildFieldworkImageExportCsvManifest',
    'desktop image export must generate a spreadsheet-readable CSV manifest'
  );
  requireIncludes(
    source,
    'buildFieldworkImageExportReadme',
    'desktop image export must generate a human-readable handover README'
  );
  requireIncludes(
    source,
    "UTF8_BOM = '\\uFEFF'",
    'desktop image export CSV manifest must include a UTF-8 BOM for Korean spreadsheet compatibility'
  );
  requireIncludes(
    source,
    'exportedFilename',
    'desktop image export manifest must map exported files back to image records'
  );
  requireIncludes(
    source,
    'imageDocument.resource.identifier || imageDocument.resource.id',
    'desktop image export must fall back to stable resource ids when image identifiers are missing'
  );
  requireIncludes(
    source,
    'getResourceIdentifier',
    'desktop image export manifest must use stable resource id fallbacks for image and related-record identifiers'
  );
  requireIncludes(
    source,
    'exportedFileSizeBytes',
    'desktop image export manifest must preserve exported file sizes for long-term integrity checks'
  );
  requireIncludes(
    source,
    'exportedFileMd5',
    'desktop image export manifest must preserve exported file MD5 hashes for tablet-upload comparisons'
  );
  requireIncludes(
    source,
    'exportedFileSha256',
    'desktop image export manifest must preserve exported file SHA-256 hashes for long-term integrity checks'
  );
  requireIncludes(
    source,
    'sourceFileSizeBytes',
    'desktop image export manifest must preserve original file sizes for later integrity checks'
  );
  requireIncludes(
    source,
    'sourceFileMd5',
    'desktop image export manifest must preserve source file MD5 hashes for tablet-upload comparisons'
  );
  requireIncludes(
    source,
    'sourceFileSha256',
    'desktop image export manifest must preserve source file SHA-256 hashes for later integrity checks'
  );
  requireIncludes(
    source,
    'tabletUploadMd5MatchesSourceFile',
    'desktop image export manifest must record whether tablet upload MD5 matches the desktop source file'
  );
  requireIncludes(
    source,
    'tabletUploadSizeMatchesSourceFile',
    'desktop image export manifest must record whether tablet upload size matches the desktop source file'
  );
  requireIncludes(
    source,
    'fieldHubStoredMd5MatchesSourceFile',
    'desktop image export manifest must record whether Field Hub stored MD5 matches the desktop source file'
  );
  requireIncludes(
    source,
    'fieldHubStoredSizeMatchesSourceFile',
    'desktop image export manifest must record whether Field Hub stored size matches the desktop source file'
  );
  requireIncludes(
    source,
    'fieldHubStoredSha256MatchesSourceFile',
    'desktop image export manifest must record whether Field Hub stored SHA-256 matches the desktop source file'
  );
  requireIncludes(
    source,
    'getFieldHubStoredMetadataMatchEntries',
    'desktop image export manifest must derive Field Hub stored-file comparisons from source metadata'
  );
  requireIncludes(
    source,
    'getTabletUploadSizeMatchEntry',
    'desktop image export manifest must derive tablet upload size comparisons from source metadata'
  );
  requireIncludes(
    source,
    "'md5'|'sha256'",
    'desktop image export manifest must calculate MD5 hashes for tablet upload comparisons'
  );
  requireIncludes(
    source,
    'createHash(algorithm)',
    'desktop image export manifest must calculate SHA-256 hashes from source file bytes'
  );
  requireIncludes(
    source,
    "'fieldworkPhotoCapturedAt'",
    'desktop image export manifest must preserve Photo capture times'
  );
  requireIncludes(
    source,
    "'soilProfilePhotoCapturedAt'",
    'desktop image export manifest must preserve soil profile capture times'
  );
  requireIncludes(
    source,
    "'fieldworkImageUploadTarget'",
    'desktop image export manifest must preserve Field Hub upload targets'
  );
  requireIncludes(
    source,
    "'fieldworkImageUploadedSizeBytes'",
    'desktop image export manifest must preserve uploaded source byte sizes'
  );
  requireIncludes(
    source,
    "'fieldworkImageStoredSizeBytes'",
    'desktop image export manifest must preserve Field Hub stored byte sizes'
  );
  requireIncludes(
    source,
    "'fieldworkImageStoredMd5'",
    'desktop image export manifest must preserve Field Hub stored MD5 hashes'
  );
  requireIncludes(
    source,
    "'fieldworkImageStoredSha256'",
    'desktop image export manifest must preserve Field Hub stored SHA-256 hashes'
  );
  requireIncludes(
    source,
    "'fieldworkImageUploadedUri'",
    'desktop image export manifest must preserve original tablet source URIs'
  );
  requireIncludes(
    source,
    "'digitalSourcePreservation'",
    'desktop image export manifest must preserve source preservation metadata'
  );
  requireIncludes(
    source,
    "'reportCrossCheck'",
    'desktop image export manifest must preserve report cross-check metadata'
  );
  requireIncludes(
    source,
    'copyRelations',
    'desktop image export manifest must preserve image relations to field records'
  );
  requireIncludes(
    source,
    'relatedDocuments',
    'desktop image export manifest must preserve related record identifiers and categories'
  );
  requireIncludes(
    source,
    'recordContext',
    'desktop image export manifest must preserve selected related field-record context'
  );
  requireIncludes(
    source,
    'RELATED_DOCUMENT_CONTEXT_FIELDS',
    'desktop image export manifest must whitelist related record context fields'
  );
  requireIncludes(
    source,
    'recordRelations',
    'desktop image export manifest must preserve related field-record relations'
  );
  requireIncludes(
    source,
    'formatRelations',
    'desktop image export CSV manifest must preserve relation names and targets in readable cells'
  );
  requireIncludes(
    source,
    'formatRelatedDocuments',
    'desktop image export CSV manifest must preserve readable related record summaries'
  );
  requireIncludes(
    source,
    'formatRelatedDocumentContexts',
    'desktop image export CSV manifest must preserve readable related record context'
  );
  requireIncludes(
    source,
    'projectContext',
    'desktop image export manifest must preserve project-level fieldwork context'
  );
  requireIncludes(
    source,
    'Field Desktop version(desktopAppVersion)',
    'desktop image export README must show the Field Desktop version used to generate the handover package'
  );
  requireIncludes(
    source,
    'PROJECT_CONTEXT_FIELDS',
    'desktop image export manifest must whitelist project-level fieldwork context fields'
  );
  requireIncludes(
    source,
    "'projectInvestigationMode'",
    'desktop image export manifest must preserve the Korean fieldwork investigation mode'
  );
  requireIncludes(
    source,
    "'projectBoundarySummary'",
    'desktop image export manifest must preserve the Korean fieldwork boundary summary'
  );
  requireIncludes(
    source,
    'neutralizeSpreadsheetFormula',
    'desktop image export CSV manifest must neutralize spreadsheet formulas in user-controlled cells'
  );
  requireIncludes(
    source,
    'tabletUploadMd5MatchesSourceFile',
    'desktop image export README must explain tablet-to-desktop checksum matching'
  );
  requireIncludes(
    source,
    'tabletUploadSizeMatchesSourceFile',
    'desktop image export README must explain tablet-to-desktop file size matching'
  );
  requireIncludes(
    source,
    'fieldHubStoredSha256MatchesSourceFile',
    'desktop image export README must explain Field Hub stored SHA-256 matching'
  );
  requireIncludes(
    source,
    'exportedFileSha256',
    'desktop image export README must explain long-term exported-file SHA-256 checks'
  );
  requireIncludes(
    source,
    'fs.writeFileSync',
    'desktop image export must write the manifest with the exported images'
  );
  requireIncludes(
    source,
    'sanitizeExportFileName',
    'desktop image export must sanitize field identifiers and original filenames before writing files'
  );
  requireIncludes(
    source,
    'INVALID_EXPORT_FILENAME_CHARACTERS',
    'desktop image export must guard against invalid Windows filename characters'
  );
  requireIncludes(
    source,
    'getUniqueExportFileName',
    'desktop image export must prevent duplicate filenames from overwriting earlier exports'
  );

  const modalSource = files.desktopImageExportModal;
  requireIncludes(
    modalSource,
    'private datastore: Datastore',
    'desktop image export modal must be able to resolve related field records'
  );
  requireIncludes(
    modalSource,
    'getRelatedDocumentsById',
    'desktop image export modal must load related records for report handover'
  );
  requireIncludes(
    modalSource,
    'relatedDocumentsById',
    'desktop image export modal must pass related record summaries into image export'
  );
  requireIncludes(
    modalSource,
    'document.resource.identifier || document.resource.id',
    'desktop image export modal must pass stable related-record id fallbacks into image export'
  );
  requireIncludes(
    modalSource,
    'getProjectContext',
    'desktop image export modal must load the Project document for report handover context'
  );
  requireIncludes(
    modalSource,
    "this.datastore.get('project')",
    'desktop image export modal must read project-level fieldwork context from the Project document'
  );
}

function checkDesktopDownloadContract() {
  const source = files.desktopDownload;

  requireIncludes(
    source,
    'ImageSyncService.getRemoteQueryTypes(preferences)',
    'desktop project download must ask Field Hub for original variants when thumbnail fallback may be needed'
  );
  requireIncludes(
    source,
    'for (const variant of this.getDownloadVariants(files[uuid], selectedVariants))',
    'desktop project download must resolve download variants before fetching files'
  );
  requireIncludes(
    source,
    'this.remoteImageStore.getDataUsingCredentials',
    'desktop project download must fetch images through the Field Hub remote image store'
  );
  requireIncludes(
    source,
    'await this.imageStore.store(uuid, data, this.getProjectIdentifier(), variant)',
    'desktop project download must persist fetched variants locally'
  );
  requireIncludes(
    source,
    'variant === ImageVariant.ORIGINAL',
    'desktop project download must recognize original fallback downloads'
  );
  requireIncludes(
    source,
    'selectedVariants.includes(ImageVariant.THUMBNAIL)',
    'desktop project download must generate thumbnails when thumbnails were requested'
  );
  requireIncludes(
    source,
    '!DownloadProjectComponent.hasVariant(files[uuid], ImageVariant.THUMBNAIL)',
    'desktop project download must detect missing remote thumbnails'
  );
  requireIncludes(
    source,
    'await this.imageStore.getData(uuid, ImageVariant.THUMBNAIL, this.getProjectIdentifier())',
    'desktop project download must generate local thumbnails from remote originals'
  );
  requireIncludes(
    source,
    'DownloadProjectComponent.hasVariant(fileInfo, ImageVariant.ORIGINAL)',
    'desktop project download must fall back to originals when only originals exist on Field Hub'
  );
  requireIncludes(
    source,
    'await Promise.allSettled(batchDownloadPromises)',
    'desktop download retries must wait for in-flight batch file promises before retrying'
  );
}

function checkCoreReadinessAndConfigContract() {
  const source = files.coreReadiness;
  const config = files.koreanConfig;

  requireIncludes(source, "category: 'Photo'", 'readiness rules must evaluate Photo records');
  requireIncludes(source, "category: 'SoilProfilePhoto'", 'readiness rules must evaluate SoilProfilePhoto records');
  requireIncludes(source, "category: 'Drawing'", 'readiness rules must evaluate Drawing records');
  requireIncludes(source, "ruleId: 'fieldwork-photo-upload-missing'", 'readiness rules must warn for unbacked tablet photos');
  requireIncludes(
    source,
    "ruleId: 'soil-profile-photo-upload-missing'",
    'readiness rules must warn for unbacked soil profile photos'
  );
  requireIncludes(source, "ruleId: 'fieldwork-drawing-upload-missing'", 'readiness rules must warn for unbacked tablet drawings');
  requireIncludes(source, 'fieldworkImageUploadStatus === \'uploaded\'', 'readiness rules must require uploaded status');
  requireIncludes(source, 'hasValue(resource.fieldworkImageUploadedAt)', 'readiness rules must require upload timestamp');
  requireIncludes(source, 'getTextValue(resource.fieldworkImageUploadedUri)', 'readiness rules must require upload source URI');
  requireIncludes(source, 'uploadedUri === sourceUri', 'readiness rules must require upload source URI to match the local source');
  requireIncludes(source, 'getTextValue(resource.fieldworkImageUploadTarget)', 'readiness rules must require upload target');
  requireIncludes(
    source,
    'isConfirmedFieldHubOriginalImageTarget(uploadTarget, uploadedProject, resourceId)',
    'readiness rules must require upload targets to match the uploaded project and resource id'
  );
  requireIncludes(source, 'encodeURIComponent(project)', 'readiness rules must encode upload target project path segments');
  requireIncludes(source, 'encodeURIComponent(resourceId)', 'readiness rules must encode upload target resource id path segments');
  requireIncludes(source, "endsWith(expectedTargetSuffix)", 'readiness rules must compare the Field Hub file URL suffix');
  requireIncludes(source, 'getTextValue(resource.fieldworkImageUploadedProject)', 'readiness rules must require upload project');
  requireIncludes(source, 'hasConfirmedUploadSize', 'readiness rules must require upload size evidence for file URI upload audits');
  requireIncludes(source, 'fieldworkImageUploadedMd5', 'readiness rules must require MD5 evidence for file URI upload audits');
  requireIncludes(
    source,
    'hasConfirmedStoredFileMetadata',
    'readiness rules must require Field Hub stored size and checksum evidence for all upload audits'
  );
  requireIncludes(source, 'fieldworkImageStoredSha256', 'readiness rules must require server SHA-256 evidence');
  requireIncludes(source, 'hasConfirmedDigitalSourcePreservation', 'readiness rules must require source preservation fields');
  requireIncludes(source, "'originalDrawing'", 'readiness rules must require originalDrawing for uploaded drawings');
  requireIncludes(source, "'originalPhoto'", 'readiness rules must require originalPhoto for uploaded photos');
  requireIncludes(source, "'originalImage'", 'readiness rules must require originalImage for uploaded photos');
  requireIncludes(source, "'webOrServerBackup'", 'readiness rules must require webOrServerBackup preservation');
  requireIncludes(source, "'backupVerified'", 'readiness rules must require backupVerified preservation');

  for (const [label, closeoutSource] of [
    ['tablet closeout', files.mobileCloseout],
    ['desktop closeout', files.desktopCloseout]
  ]) {
    requireIncludes(
      closeoutSource,
      'hasConfirmedKoreanFieldworkImageUpload',
      `${label} must use the core Field Hub backup completion rule`
    );
    requireIncludes(
      closeoutSource,
      'fieldworkImageUploadedUri',
      `${label} must expose missing upload URI as a review field`
    );
    requireIncludes(
      closeoutSource,
      'fieldworkImageUploadedProject',
      `${label} must expose missing upload project as a review field`
    );
    requireIncludes(
      closeoutSource,
      'fieldworkImageUploadedSizeBytes',
      `${label} must expose missing upload size as a review field`
    );
    requireIncludes(
      closeoutSource,
      'fieldworkImageStoredSizeBytes',
      `${label} must expose missing Field Hub stored size as a review field`
    );
    requireIncludes(
      closeoutSource,
      'fieldworkImageStoredSha256',
      `${label} must expose missing Field Hub stored SHA-256 as a review field`
    );
  }

  for (const formName of ['Drawing:default', 'Photo:default', 'SoilProfilePhoto']) {
    const form = config.forms[formName];
    if (!form) {
      findings.push(`Korean fieldwork config is missing ${formName}`);
      continue;
    }

    for (const fieldName of FIELDWORK_IMAGE_UPLOAD_AUDIT_FIELDS) {
      if (!form.fields || !form.fields[fieldName]) {
        findings.push(`Korean fieldwork config ${formName} is missing ${fieldName}`);
        continue;
      }

      if (form.fields[fieldName].editable !== false) {
        findings.push(`Korean fieldwork config ${formName}.${fieldName} must be system-managed and non-editable`);
      }

      const expectedInputType = fieldName.endsWith('SizeBytes') ? 'unsignedInt' : 'input';
      if (form.fields[fieldName].inputType !== expectedInputType) {
        findings.push(`Korean fieldwork config ${formName}.${fieldName} must use inputType ${expectedInputType}`);
      }
    }

    const koreanGroup = Array.isArray(form.groups)
      ? form.groups.find((group) => group.name === 'koreanFieldwork')
      : undefined;
    if (!koreanGroup) {
      findings.push(`Korean fieldwork config ${formName} is missing the koreanFieldwork group`);
      continue;
    }

    for (const fieldName of FIELDWORK_IMAGE_UPLOAD_AUDIT_FIELDS) {
      if (!koreanGroup.fields.includes(fieldName)) {
        findings.push(`Korean fieldwork config ${formName} koreanFieldwork group omits ${fieldName}`);
      }
    }
  }
}

function checkCloseoutUserTextContract() {
  for (const [label, source] of [
    ['desktop image export', files.desktopExportImages],
    ['desktop image export tests', files.desktopExportImagesSpec],
    ['desktop image export modal tests', files.desktopImageExportModalSpec]
  ]) {
    rejectMojibakeSuspects(source, label);
  }

  requireIncludes(
    files.desktopExportImages,
    '한국 현장조사 이미지 인계 메모',
    'desktop image export README must keep Korean handover text readable'
  );
  requireIncludes(
    files.desktopExportImages,
    '태블릿 MD5 일치',
    'desktop image export README must keep tablet checksum text readable'
  );
  requireIncludes(
    files.desktopExportImages,
    '태블릿 크기 일치',
    'desktop image export README must keep tablet size comparison text readable'
  );

  for (const [label, source] of [
    ['tablet closeout', files.mobileCloseout],
    ['desktop closeout', files.desktopCloseout],
    ['tablet closeout tests', files.mobileCloseoutSpec],
    ['desktop closeout tests', files.desktopCloseoutSpec]
  ]) {
    requireIncludes(
      source,
      '도면 원본의 Field Hub 백업이 아직 확인되지 않았습니다.',
      `${label} must keep the Drawing backup warning readable for Korean field teams`
    );
    rejectMojibakeSuspects(source, label);
  }
}

function checkFieldHubServerContract() {
  requireIncludes(
    files.serverRouter,
    'resources "/files/:project", Rest.File, only: [:index, :update, :show, :delete]',
    'Field Hub router must expose the project-scoped files REST resource'
  );
  requireIncludes(
    files.serverRouter,
    'pipe_through :api_require_project_authorization',
    'Field Hub files API must remain protected by project authorization'
  );

  const controller = files.serverFileController;
  requireIncludes(
    controller,
    'def update(conn, %{"project" => project, "id" => uuid, "type" => type})',
    'Field Hub file controller must accept PUT /files/:project/:uuid?type=... updates'
  );
  requireIncludes(controller, 'parse_expected_content_length(conn)', 'Field Hub uploads must validate Content-Length');
  requireIncludes(
    controller,
    '{value, ""} when value >= 0',
    'Field Hub upload Content-Length validation must reject negative lengths before writing files'
  );
  requireIncludes(
    controller,
    '{:error, :invalid_content_length_header}',
    'Field Hub upload Content-Length validation must reject malformed or duplicate length headers'
  );
  requireIncludes(
    controller,
    'FileStore.create_write_io_device(sanitized_uuid, sanitized_project, parsed_type)',
    'Field Hub uploads must stream to a temporary write device'
  );
  requireIncludes(controller, 'start_body_streaming', 'Field Hub uploads must stream request bodies');
  requireIncludes(controller, 'FileStore.store_by_moving', 'Field Hub uploads must move completed temporary files into storage');
  requireIncludes(
    controller,
    'get_stored_file_metadata(sanitized_uuid, sanitized_project, parsed_type)',
    'Field Hub uploads must return stored-file metadata after moving files into storage'
  );
  requireIncludes(controller, 'size_bytes: size', 'Field Hub upload responses must include stored file sizes');
  requireIncludes(controller, 'md5: md5', 'Field Hub upload responses must include stored file MD5 hashes');
  requireIncludes(controller, 'sha256: sha256', 'Field Hub upload responses must include stored file SHA-256 hashes');
  requireIncludes(controller, ':crypto.hash_init(algorithm)', 'Field Hub upload responses must hash stored files by streaming bytes');
  requireIncludes(controller, 'File.rm(tmp_file_path)', 'Field Hub uploads must clean up failed temporary files');
  requireIncludes(controller, 'defp parse_type("original_image")', 'Field Hub must accept original_image file variants');
  requireIncludes(controller, 'defp parse_type("thumbnail_image")', 'Field Hub must accept thumbnail_image file variants');

  const fileStore = files.serverFileStore;
  requireIncludes(fileStore, 'def store_by_moving', 'Field Hub file store must expose atomic move storage');
  requireIncludes(fileStore, '#{uuid}.writing', 'Field Hub file store must write uploads to .writing temporary files');
  requireIncludes(fileStore, 'defp get_variant_directory(project, :original_image)', 'Field Hub must store original_image variants');
  requireIncludes(fileStore, 'defp get_variant_directory(project, :thumbnail_image)', 'Field Hub must store thumbnail_image variants');

  const controllerSpec = files.serverFileControllerSpec;
  requireIncludes(
    controllerSpec,
    'with negative Content-Length throws 400',
    'Field Hub server tests must cover negative Content-Length rejection'
  );
  requireIncludes(
    controllerSpec,
    'with duplicate Content-Length throws 400',
    'Field Hub server tests must cover duplicate Content-Length rejection'
  );
  requireIncludes(
    controllerSpec,
    'Map.update!(:req_headers',
    'Field Hub duplicate Content-Length test must create duplicate request headers explicitly'
  );
  requireIncludes(
    controllerSpec,
    '"size_bytes" => @example_file_stats.size',
    'Field Hub server tests must assert upload responses include stored file sizes'
  );
  requireIncludes(
    controllerSpec,
    '"md5" => @example_file_md5',
    'Field Hub server tests must assert upload responses include stored MD5 hashes'
  );
  requireIncludes(
    controllerSpec,
    '"sha256" => @example_file_sha256',
    'Field Hub server tests must assert upload responses include stored SHA-256 hashes'
  );
}

function checkContractCoverage() {
  const mobileSpec = files.mobileHookSpec;
  requireIncludes(
    mobileSpec,
    'uploads local photo records to the Field Hub original image store',
    'tablet tests must cover local photo upload to Field Hub'
  );
  requireIncludes(
    mobileSpec,
    'https://field.example/files/fieldwork/photo-1?type=original_image',
    'tablet tests must assert the Field Hub original image upload URL'
  );
  requireIncludes(mobileSpec, "httpMethod: 'PUT'", 'tablet tests must assert PUT upload semantics');
  requireIncludes(
    mobileSpec,
    'FileSystem.FileSystemUploadType.BINARY_CONTENT',
    'tablet tests must assert raw binary upload semantics'
  );
  requireIncludes(
    mobileSpec,
    'uploads content URI drawings without requiring local file info preflight',
    'tablet tests must cover content:// Drawing uploads'
  );
  requireIncludes(
    mobileSpec,
    'records successful uploads on the document for later report work',
    'tablet tests must cover upload audit fields'
  );
  requireIncludes(
    mobileSpec,
    'does not record stale upload audit data when the latest document points to another local file',
    'tablet tests must cover stale local image URI protection before recording upload audit data'
  );
  requireIncludes(
    mobileSpec,
    'fieldworkImageUploadedSizeBytes: 481516',
    'tablet tests must assert uploaded source byte sizes are recorded'
  );
  requireIncludes(
    mobileSpec,
    'fieldworkImageUploadedMd5',
    'tablet tests must assert uploaded local checksums are recorded'
  );
  requireIncludes(
    mobileSpec,
    'backfills upload file metadata without reuploading already recorded originals',
    'tablet tests must cover checksum and size backfill without binary reupload'
  );
  requireIncludes(
    mobileSpec,
    'backfills upload sizes without reuploading already checksummed originals',
    'tablet tests must cover upload size backfill without binary reupload'
  );
  requireIncludes(
    mobileSpec,
    'records Field Hub stored metadata for content URI uploads',
    'tablet tests must cover content:// upload audits with server-stored metadata'
  );
  requireIncludes(
    mobileSpec,
    'parses Field Hub stored metadata from upload responses',
    'tablet tests must cover upload response metadata parsing'
  );
  requireIncludes(
    mobileSpec,
    'fieldworkImageStoredSha256: \'server-sha256\'',
    'tablet tests must assert server-stored SHA-256 hashes are recorded'
  );

  const remoteStoreSpec = files.desktopRemoteStoreSpec;
  requireIncludes(
    remoteStoreSpec,
    'uploads an image variant using basic auth without adding the password to the URL',
    'desktop remote store tests must cover credential-safe upload requests'
  );
  requireIncludes(
    remoteStoreSpec,
    "request.url).toBe('http://fieldhub.test/files/fieldwork/image-1')",
    'desktop remote store tests must assert the Field Hub file upload URL'
  );
  requireIncludes(
    remoteStoreSpec,
    "request.params).toEqual({ type: ImageVariant.ORIGINAL })",
    'desktop remote store tests must assert variant query params'
  );
  requireIncludes(
    remoteStoreSpec,
    "request.headers['Content-Type']).toBe('application/octet-stream')",
    'desktop remote store tests must assert octet-stream uploads'
  );
  requireIncludes(
    remoteStoreSpec,
    'normalizes database sync URLs before querying Field Hub files',
    'desktop remote store tests must cover /db URL normalization'
  );
  requireIncludes(
    remoteStoreSpec,
    'encodes file URL path segments when downloading image data',
    'desktop remote store tests must cover encoded Field Hub file path segments'
  );
  requireIncludes(
    files.desktopExpressServerSpec,
    'tablet-style original upload can be listed and downloaded by the desktop remote image store',
    'desktop server tests must cover the tablet-upload to desktop-download bridge'
  );
  requireIncludes(
    files.desktopExpressServerSpec,
    'buildFieldHubFileUrlWithType',
    'desktop server bridge test must use the shared Field Hub typed URL helper'
  );
  requireIncludes(
    files.desktopExpressServerSpec,
    'downloadedImage.equals(mockImage)',
    'desktop server bridge test must verify downloaded original bytes'
  );
  requireIncludes(
    files.desktopExpressServerSpec,
    'uploadResponse.data).toEqual(mockImageStoredMetadata)',
    'desktop server bridge test must verify tablet upload response stored-file metadata'
  );
  requireIncludes(
    files.desktopExpressServerSpec,
    "getHash(mockImage, 'sha256')",
    'desktop server tests must calculate expected stored SHA-256 metadata from uploaded bytes'
  );

  const exportImagesSpec = files.desktopExportImagesSpec;
  requireIncludes(
    exportImagesSpec,
    'exports a report handover manifest with field capture and upload context',
    'desktop image export tests must cover report handover manifest generation'
  );
  requireIncludes(
    exportImagesSpec,
    'FIELDWORK_IMAGE_EXPORT_CSV_MANIFEST_FILENAME',
    'desktop image export tests must cover CSV manifest sidecar generation'
  );
  requireIncludes(
    exportImagesSpec,
    'FIELDWORK_IMAGE_EXPORT_README_FILENAME',
    'desktop image export tests must cover README handover sidecar generation'
  );
  requireIncludes(
    exportImagesSpec,
    'FIELDWORK_IMAGE_EXPORT_MANIFEST_VERSION',
    'desktop image export tests must assert manifest schema version metadata'
  );
  requireIncludes(
    exportImagesSpec,
    "desktopAppVersion: '3.8.0-test'",
    'desktop image export tests must assert the generating Field Desktop version in the manifest'
  );
  requireIncludes(
    exportImagesSpec,
    'Field Desktop version(desktopAppVersion): 3.8.0-test',
    'desktop image export tests must assert the generating Field Desktop version in the README'
  );
  requireIncludes(
    exportImagesSpec,
    'projectContext',
    'desktop image export tests must assert project-level fieldwork context in the manifest'
  );
  requireIncludes(
    exportImagesSpec,
    'projectInvestigationMode',
    'desktop image export tests must assert investigation mode handover metadata'
  );
  requireIncludes(
    exportImagesSpec,
    'projectBoundarySummary',
    'desktop image export tests must assert project boundary summary handover metadata'
  );
  requireIncludes(
    exportImagesSpec,
    "not.toContain('syncPassword')",
    'desktop image export tests must assert project context is whitelisted'
  );
  requireIncludes(
    exportImagesSpec,
    '한국 현장조사 이미지 인계 메모',
    'desktop image export tests must assert the README is human-readable for Korean report handover'
  );
  requireIncludes(
    exportImagesSpec,
    '태블릿 MD5 일치: true',
    'desktop image export tests must assert README checksum match summaries'
  );
  requireIncludes(
    exportImagesSpec,
    'exportedFileSizeBytes: 481516',
    'desktop image export tests must assert exported file size handover metadata'
  );
  requireIncludes(
    exportImagesSpec,
    'exportedFileSha256',
    'desktop image export tests must assert exported file SHA-256 handover metadata'
  );
  requireIncludes(
    exportImagesSpec,
    'exportedFileMd5',
    'desktop image export tests must assert exported file MD5 handover metadata'
  );
  requireIncludes(
    exportImagesSpec,
    'sourceFileSizeBytes: 481516',
    'desktop image export tests must assert original file size handover metadata'
  );
  requireIncludes(
    exportImagesSpec,
    'sourceFileSha256',
    'desktop image export tests must assert source file SHA-256 handover metadata'
  );
  requireIncludes(
    exportImagesSpec,
    'sourceFileMd5',
    'desktop image export tests must assert source file MD5 handover metadata'
  );
  requireIncludes(
    exportImagesSpec,
    'tabletUploadMd5MatchesSourceFile',
    'desktop image export tests must assert tablet upload checksum match results'
  );
  requireIncludes(
    exportImagesSpec,
    'tabletUploadSizeMatchesSourceFile',
    'desktop image export tests must assert tablet upload size match results'
  );
  requireIncludes(
    exportImagesSpec,
    'fieldHubStoredSha256MatchesSourceFile',
    'desktop image export tests must assert Field Hub stored SHA-256 match results'
  );
  requireIncludes(
    exportImagesSpec,
    'fieldworkImageStoredSha256',
    'desktop image export tests must assert Field Hub stored checksum context in the manifest'
  );
  requireIncludes(
    exportImagesSpec,
    'Field Hub SHA-256',
    'desktop image export tests must assert README Field Hub SHA-256 summaries'
  );
  requireIncludes(
    exportImagesSpec,
    'records tablet upload size mismatches in the report handover manifest',
    'desktop image export tests must cover tablet upload size mismatch handover warnings'
  );
  requireIncludes(
    exportImagesSpec,
    'getExpectedSha256',
    'desktop image export tests must calculate the expected SHA-256 from source bytes'
  );
  requireIncludes(
    exportImagesSpec,
    "writtenCsv.startsWith('\\uFEFF')",
    'desktop image export tests must assert the CSV manifest is UTF-8 BOM-prefixed'
  );
  requireIncludes(
    exportImagesSpec,
    "writtenReadme.startsWith('\\uFEFF')",
    'desktop image export tests must assert the README is UTF-8 BOM-prefixed for Korean text editor compatibility'
  );
  requireIncludes(
    exportImagesSpec,
    'depicts:feature-1',
    'desktop image export tests must assert readable relation context in the CSV manifest'
  );
  requireIncludes(
    exportImagesSpec,
    'depicts:Feature/수혈 1(feature-1)',
    'desktop image export tests must assert readable related record summaries in the CSV manifest'
  );
  requireIncludes(
    exportImagesSpec,
    'featureType=pit',
    'desktop image export tests must assert readable related record context in the CSV manifest'
  );
  requireIncludes(
    exportImagesSpec,
    'internalDraftNote',
    'desktop image export tests must assert related record context is whitelisted'
  );
  requireIncludes(
    exportImagesSpec,
    'sanitizes identifier-based filenames and avoids overwriting duplicate exports',
    'desktop image export tests must cover filename sanitizing and duplicate export names'
  );
  requireIncludes(
    exportImagesSpec,
    'uses the resource id as export filename fallback when an image has no identifier',
    'desktop image export tests must cover stable resource-id filename fallback'
  );
  requireIncludes(
    exportImagesSpec,
    "manifest.images[0].identifier).toBe('photo-1')",
    'desktop image export tests must assert image identifier fallback in the manifest'
  );
  requireIncludes(
    exportImagesSpec,
    "relatedDocuments?.[0].identifier).toBe('feature-1')",
    'desktop image export tests must assert related-record identifier fallback in the manifest'
  );
  requireIncludes(
    exportImagesSpec,
    'Feature_01_Photo__2.jpg',
    'desktop image export tests must assert duplicate filenames get stable suffixes'
  );
  requireIncludes(
    exportImagesSpec,
    'fieldworkImageUploadTarget',
    'desktop image export tests must assert Field Hub upload context in the manifest'
  );
  requireIncludes(
    exportImagesSpec,
    'fieldworkImageUploadedSizeBytes',
    'desktop image export tests must assert uploaded source byte sizes in the manifest'
  );
  requireIncludes(
    exportImagesSpec,
    'fieldworkImageUploadedMd5',
    'desktop image export tests must assert uploaded source MD5 hashes in the manifest'
  );
  requireIncludes(
    exportImagesSpec,
    'neutralizes spreadsheet formulas in the CSV manifest without changing the JSON manifest',
    'desktop image export tests must cover spreadsheet formula neutralization'
  );
  requireIncludes(
    exportImagesSpec,
    "'=HYPERLINK",
    'desktop image export tests must assert formula-like CSV cells are neutralized'
  );
  requireIncludes(
    exportImagesSpec,
    'digitalSourcePreservation',
    'desktop image export tests must assert source preservation metadata in the manifest'
  );
  requireIncludes(
    exportImagesSpec,
    'relations: {',
    'desktop image export tests must assert record relation context in the manifest'
  );

  const exportModalSpec = files.desktopImageExportModalSpec;
  requireIncludes(
    exportModalSpec,
    'passes related records and project fieldwork context into image export',
    'desktop image export modal tests must cover forwarding project fieldwork context into exportImages'
  );
  requireIncludes(
    exportModalSpec,
    'projectBoundarySummary',
    'desktop image export modal tests must assert project boundary summaries are passed to exportImages'
  );
  requireIncludes(
    exportModalSpec,
    'still exports images when the project document cannot be read',
    'desktop image export modal tests must cover project context lookup fallback'
  );
  requireIncludes(
    exportModalSpec,
    'uses related record ids as export context fallback when identifiers are missing',
    'desktop image export modal tests must cover related-record identifier fallback'
  );

  requireIncludes(
    files.desktopDownloadSpec,
    'downloads remote originals and generates local thumbnails when Field Hub has no thumbnail variant',
    'desktop download tests must cover original fallback and thumbnail generation'
  );
  requireIncludes(
    files.coreReadinessSpec,
    'reports local tablet media without confirmed Field Hub original backup',
    'core readiness tests must cover missing tablet media backups'
  );
  requireIncludes(
    files.coreReadinessSpec,
    'fieldwork-drawing-upload-missing',
    'core readiness tests must cover missing Drawing backups'
  );
  requireIncludes(
    files.coreReadinessSpec,
    'keeps reporting tablet media when upload audit fields are incomplete',
    'core readiness tests must cover incomplete upload audit records'
  );
  requireIncludes(
    files.coreReadinessSpec,
    'keeps reporting tablet media when the upload target points to another file',
    'core readiness tests must cover mismatched upload targets'
  );
  requireIncludes(
    files.coreReadinessSpec,
    'keeps reporting file URI tablet media when upload size metadata is missing',
    'core readiness tests must cover missing file URI upload size metadata'
  );
  requireIncludes(
    files.coreReadinessSpec,
    'keeps reporting content URI tablet media when Field Hub stored metadata is missing',
    'core readiness tests must cover missing server-stored metadata for content URI uploads'
  );
  requireIncludes(
    files.mobileCloseoutSpec,
    'keeps tablet media in closeout when upload audit fields are incomplete',
    'tablet closeout tests must cover incomplete upload audit records'
  );
  requireIncludes(
    files.mobileCloseoutSpec,
    'keeps tablet media in closeout when the upload target points to another file',
    'tablet closeout tests must cover mismatched upload targets'
  );
  requireIncludes(
    files.desktopCloseoutSpec,
    'keeps tablet media in closeout when upload audit fields are incomplete',
    'desktop closeout tests must cover incomplete upload audit records'
  );
  requireIncludes(
    files.desktopCloseoutSpec,
    'keeps tablet media in closeout when the upload target points to another file',
    'desktop closeout tests must cover mismatched upload targets'
  );
  requireIncludes(
    files.koreanConfigSpec,
    'fieldworkImageUploadedProject',
    'configuration tests must cover upload audit fields'
  );
  requireIncludes(
    files.koreanConfigSpec,
    'expect(form.fields[fieldName].editable).toBe(false)',
    'configuration tests must assert upload audit fields are system-managed'
  );
  requireIncludes(
    files.coreFieldHubFileUrlSpec,
    'builds typed file URLs for direct binary clients',
    'core tests must cover direct typed Field Hub file URLs'
  );
  requireIncludes(
    files.coreFieldHubFileUrlSpec,
    'https://field.example/files/fieldwork/photo-1?type=original_image',
    'core tests must assert original_image Field Hub file URLs'
  );

  const serverSpec = files.serverFileControllerSpec;
  requireIncludes(
    serverSpec,
    'PUT /files/:project/:uuid accepts the default project account used by field clients',
    'server tests must cover project-account tablet upload credentials'
  );
  requireIncludes(
    serverSpec,
    'put("/files/#{@project}/tablet-photo-1?type=original_image", @example_file)',
    'server tests must cover the tablet original_image upload endpoint'
  );
  requireIncludes(
    serverSpec,
    'put_req_header("content-length", "#{@example_file_stats.size}")',
    'server tests must cover Content-Length headers for uploads'
  );
}

function rejectMojibakeSuspects(text, label) {
  const suspectPatterns = [
    /�/,
    /[袁獄毓類녿援遺議寃醫硫吏蹂湲愿え]/,
    /\?꾨/,
    /\?쒕/,
    /\?쒓/,
    /\?먮/,
    /\?좎/,
    /\?댁/,
    /\?뺤/,
    /\?숆/,
    /\?대/,
    /\?앹/,
    /\?④/
  ];

  if (suspectPatterns.some((pattern) => pattern.test(text))) {
    findings.push(`${label} must not contain mojibake in Korean fieldwork user-facing or handover text`);
  }
}

function requireIncludes(text, substring, message) {
  if (!text.includes(substring)) findings.push(message);
}

function readTextFile(filePath) {
  return fs.readFileSync(path.join(repoRoot, filePath), 'utf8');
}

function readJsonFile(filePath) {
  return JSON.parse(readTextFile(filePath));
}
