const mockElectronFs = {
    existsSync: jest.fn(),
    statSync: jest.fn(),
    readFileSync: jest.fn(),
    copyFileSync: jest.fn(),
    writeFileSync: jest.fn()
};

jest.mock('src/app/electron/electron', () => ({
    electronCrypto: require('crypto'),
    electronFs: mockElectronFs,
    electronRemote: {
        app: { getVersion: () => '3.8.0-test' }
    }
}), { virtual: true });

import {
    exportImages,
    FIELDWORK_IMAGE_EXPORT_CSV_MANIFEST_FILENAME,
    FIELDWORK_IMAGE_EXPORT_MANIFEST_FILENAME,
    FIELDWORK_IMAGE_EXPORT_README_FILENAME,
    FIELDWORK_IMAGE_EXPORT_MANIFEST_VERSION
} from '../../../../src/app/services/imagestore/export-images';
import { ImageVariant } from 'idai-field-core';


describe('exportImages', () => {

    beforeEach(() => {
        jest.clearAllMocks();
        mockElectronFs.existsSync.mockReturnValue(true);
        mockElectronFs.statSync.mockReturnValue({ size: 481516 });
        mockElectronFs.readFileSync.mockReturnValue(Buffer.from('tablet original bytes'));
    });


    it('exports a report handover manifest with field capture and upload context', () => {

        const isoStringSpy = jest.spyOn(Date.prototype, 'toISOString')
            .mockReturnValue('2026-06-25T00:00:00.000Z');
        const expectedMd5 = getExpectedMd5();
        const expectedSha256 = getExpectedSha256();

        try {
            const imageStore = {
                getDirectoryPath: jest.fn().mockReturnValue('C:/field/images/original/')
            };
            const imageDocument = {
                resource: {
                    id: 'photo-1',
                    identifier: 'P-001',
                    category: 'Photo',
                    originalFilename: 'tablet-photo-1.jpg',
                    relations: {
                        depicts: ['feature-1'],
                        isRecordedIn: []
                    },
                    fieldworkPhotoUri: 'file:///tablet/DCIM/tablet-photo-1.jpg',
                    fieldworkPhotoCapturedAt: '2026-06-23T08:31:00.000Z',
                    fieldworkImageUploadStatus: 'uploaded',
                    fieldworkImageUploadedAt: '2026-06-23T08:33:00.000Z',
                    fieldworkImageUploadedUri: 'file:///tablet/DCIM/tablet-photo-1.jpg',
                    fieldworkImageUploadTarget: 'https://field.example/files/fieldwork/photo-1?type=original_image',
                    fieldworkImageUploadedProject: 'fieldwork',
                    fieldworkImageUploadedSizeBytes: 481516,
                    fieldworkImageUploadedMd5: expectedMd5,
                    fieldworkImageStoredSizeBytes: 481516,
                    fieldworkImageStoredMd5: expectedMd5,
                    fieldworkImageStoredSha256: expectedSha256,
                    digitalSourcePreservation: ['originalPhoto', 'webOrServerBackup', 'backupVerified'],
                    mediaEvidenceRole: ['recordPhoto'],
                    mediaQualityCheck: ['inFocus'],
                    reportCrossCheck: ['linkedToFeature'],
                    width: 1600,
                    height: 1200
                }
            } as any;

            const manifest = exportImages(
                imageStore as any,
                [imageDocument],
                'C:/export',
                'fieldwork',
                false,
                {
                    'feature-1': {
                        id: 'feature-1',
                        identifier: '수혈 1',
                        category: 'Feature',
                        resource: {
                            id: 'feature-1',
                            identifier: '수혈 1',
                            category: 'Feature',
                            relations: {
                                liesWithin: ['operation-1']
                            },
                            shortDescription: 'pit fill',
                            period: 'Joseon',
                            featureType: 'pit',
                            featureRecordingStatus: 'confirmed',
                            featureInvestigationChecklist: ['completionPhotoTaken'],
                            longAxisOrientation: 'N-E 23',
                            geometry: { type: 'Point', coordinates: [1, 2] },
                            internalDraftNote: 'not exported'
                        }
                    }
                },
                {
                    shortName: { ko: '1구역 북쪽 조사' },
                    shortDescription: '북쪽 능선부터 남쪽 농로까지',
                    projectInvestigationMode: 'trialTrench',
                    projectBoundarySetupState: 'draftBoundary',
                    projectBoundarySummary: '1구역 북쪽 능선부터 남쪽 농로까지',
                    coordinateReferenceSystem: 'EPSG:5186',
                    projectBoundary: { type: 'Polygon', coordinates: [[[1, 2], [3, 4], [1, 2]]] },
                    geometry: { type: 'Point', coordinates: [127.1, 37.5] },
                    syncPassword: 'not exported'
                }
            );

            expect(imageStore.getDirectoryPath).toHaveBeenCalledWith('fieldwork', ImageVariant.ORIGINAL);
            expect(mockElectronFs.copyFileSync).toHaveBeenCalledWith(
                'C:/field/images/original/photo-1',
                'C:/export/P-001.jpg'
            );
            expect(mockElectronFs.writeFileSync).toHaveBeenCalledWith(
                `C:/export/${FIELDWORK_IMAGE_EXPORT_MANIFEST_FILENAME}`,
                expect.any(String),
                'utf8'
            );
            expect(mockElectronFs.writeFileSync).toHaveBeenCalledWith(
                `C:/export/${FIELDWORK_IMAGE_EXPORT_CSV_MANIFEST_FILENAME}`,
                expect.any(String),
                'utf8'
            );
            expect(mockElectronFs.writeFileSync).toHaveBeenCalledWith(
                `C:/export/${FIELDWORK_IMAGE_EXPORT_README_FILENAME}`,
                expect.any(String),
                'utf8'
            );

            const writtenManifest = JSON.parse(mockElectronFs.writeFileSync.mock.calls[0][1]);
            const csvWriteCall = mockElectronFs.writeFileSync.mock.calls.find(
                ([filePath]: string[]) => filePath === `C:/export/${FIELDWORK_IMAGE_EXPORT_CSV_MANIFEST_FILENAME}`
            );
            const writtenCsv = csvWriteCall?.[1];
            const readmeWriteCall = mockElectronFs.writeFileSync.mock.calls.find(
                ([filePath]: string[]) => filePath === `C:/export/${FIELDWORK_IMAGE_EXPORT_README_FILENAME}`
            );
            const writtenReadme = readmeWriteCall?.[1];

            expect(manifest).toEqual(writtenManifest);
            expect(writtenCsv.startsWith('\uFEFF')).toBe(true);
            expect(writtenReadme.startsWith('\uFEFF')).toBe(true);
            expect(writtenManifest).toMatchObject({
                manifestVersion: FIELDWORK_IMAGE_EXPORT_MANIFEST_VERSION,
                generatedAt: '2026-06-25T00:00:00.000Z',
                desktopAppVersion: '3.8.0-test',
                project: 'fieldwork',
                projectContext: {
                    shortName: { ko: '1구역 북쪽 조사' },
                    shortDescription: '북쪽 능선부터 남쪽 농로까지',
                    projectInvestigationMode: 'trialTrench',
                    projectBoundarySetupState: 'draftBoundary',
                    projectBoundarySummary: '1구역 북쪽 능선부터 남쪽 농로까지',
                    coordinateReferenceSystem: 'EPSG:5186',
                    projectBoundary: { type: 'Polygon', coordinates: [[[1, 2], [3, 4], [1, 2]]] },
                    geometry: { type: 'Point', coordinates: [127.1, 37.5] }
                },
                imageCount: 1,
                images: [
                    {
                        id: 'photo-1',
                        identifier: 'P-001',
                        category: 'Photo',
                        exportedFilename: 'P-001.jpg',
                        exportedFileSizeBytes: 481516,
                        exportedFileMd5: expectedMd5,
                        exportedFileSha256: expectedSha256,
                        sourceFileSizeBytes: 481516,
                        sourceFileMd5: expectedMd5,
                        sourceFileSha256: expectedSha256,
                        tabletUploadMd5MatchesSourceFile: true,
                        tabletUploadSizeMatchesSourceFile: true,
                        fieldHubStoredMd5MatchesSourceFile: true,
                        fieldHubStoredSizeMatchesSourceFile: true,
                        fieldHubStoredSha256MatchesSourceFile: true,
                        originalFilename: 'tablet-photo-1.jpg',
                        relations: {
                            depicts: ['feature-1']
                        },
                        relatedDocuments: [
                            {
                                relation: 'depicts',
                                id: 'feature-1',
                                identifier: '수혈 1',
                                category: 'Feature',
                                recordRelations: {
                                    liesWithin: ['operation-1']
                                },
                                recordContext: {
                                    shortDescription: 'pit fill',
                                    period: 'Joseon',
                                    featureType: 'pit',
                                    featureRecordingStatus: 'confirmed',
                                    featureInvestigationChecklist: ['completionPhotoTaken'],
                                    longAxisOrientation: 'N-E 23',
                                    geometry: { type: 'Point', coordinates: [1, 2] }
                                }
                            }
                        ],
                        fieldContext: {
                            fieldworkPhotoUri: 'file:///tablet/DCIM/tablet-photo-1.jpg',
                            fieldworkPhotoCapturedAt: '2026-06-23T08:31:00.000Z',
                            fieldworkImageUploadStatus: 'uploaded',
                            fieldworkImageUploadedAt: '2026-06-23T08:33:00.000Z',
                            fieldworkImageUploadedUri: 'file:///tablet/DCIM/tablet-photo-1.jpg',
                            fieldworkImageUploadTarget: 'https://field.example/files/fieldwork/photo-1?type=original_image',
                            fieldworkImageUploadedProject: 'fieldwork',
                            fieldworkImageUploadedSizeBytes: 481516,
                            fieldworkImageUploadedMd5: expectedMd5,
                            fieldworkImageStoredSizeBytes: 481516,
                            fieldworkImageStoredMd5: expectedMd5,
                            fieldworkImageStoredSha256: expectedSha256,
                            digitalSourcePreservation: ['originalPhoto', 'webOrServerBackup', 'backupVerified'],
                            mediaEvidenceRole: ['recordPhoto'],
                            mediaQualityCheck: ['inFocus'],
                            reportCrossCheck: ['linkedToFeature'],
                            width: 1600,
                            height: 1200
                        }
                    }
                ]
            });
            expect(JSON.stringify(writtenManifest)).not.toContain('syncPassword');
            expect(writtenCsv).toContain(
                'project,generatedAt,desktopAppVersion,projectShortName,projectShortDescription,projectInvestigationMode,projectBoundarySetupState,projectBoundarySummary,projectCoordinateReferenceSystem,projectBoundary,projectGeometry,id,identifier,category,exportedFilename,sourceFileSizeBytes,originalFilename,relations,relatedDocuments,relatedDocumentContexts,fieldworkPhotoUri'
            );
            expect(writtenCsv).toContain('fieldwork,2026-06-25T00:00:00.000Z,3.8.0-test,');
            expect(writtenCsv).toContain('북쪽 능선부터 남쪽 농로까지,trialTrench,draftBoundary,1구역 북쪽 능선부터 남쪽 농로까지,EPSG:5186');
            expect(writtenCsv).toContain(`,${expectedMd5}`);
            expect(writtenCsv).toContain(
                'sourceFileMd5,sourceFileSha256,tabletUploadMd5MatchesSourceFile,tabletUploadSizeMatchesSourceFile,fieldHubStoredMd5MatchesSourceFile,fieldHubStoredSizeMatchesSourceFile,fieldHubStoredSha256MatchesSourceFile,exportedFileSizeBytes,exportedFileMd5,exportedFileSha256'
            );
            expect(writtenCsv).toContain(`,${expectedMd5},${expectedSha256},true,true,true,true,true,481516,${expectedMd5},${expectedSha256}\n`);
            expect(writtenCsv).toContain(
                'photo-1,P-001,Photo,P-001.jpg,481516,tablet-photo-1.jpg,depicts:feature-1,depicts:Feature/수혈 1(feature-1)'
            );
            expect(writtenCsv).toContain('featureType=pit');
            expect(writtenCsv).toContain('relations=liesWithin:operation-1');
            expect(JSON.stringify(writtenManifest)).not.toContain('internalDraftNote');
            expect(writtenCsv).toContain('originalPhoto; webOrServerBackup; backupVerified');
            expect(writtenCsv).toContain('linkedToFeature');
            expect(writtenReadme).toContain('한국 현장조사 이미지 인계 메모');
            expect(writtenReadme).toContain('조사 방식(projectInvestigationMode): trialTrench');
            expect(writtenReadme).toContain('Field Desktop version(desktopAppVersion): 3.8.0-test');
            expect(writtenReadme).toContain('경계 요약(projectBoundarySummary): 1구역 북쪽 능선부터 남쪽 농로까지');
            expect(writtenReadme).toContain('tabletUploadMd5MatchesSourceFile');
            expect(writtenReadme).toContain('tabletUploadSizeMatchesSourceFile');
            expect(writtenReadme).toContain('fieldHubStoredSha256MatchesSourceFile');
            expect(writtenReadme).toContain('태블릿 MD5 일치: true');
            expect(writtenReadme).toContain('태블릿 크기 일치: true');
            expect(writtenReadme).toContain('Field Hub SHA-256 일치: true');
            expect(writtenReadme).toContain('P-001.jpg: Photo/P-001 (photo-1); 관련 기록: depicts:Feature/수혈 1(feature-1); 태블릿 MD5 일치: true; 태블릿 크기 일치: true; Field Hub SHA-256 일치: true');
        } finally {
            isoStringSpy.mockRestore();
        }
    });


    it('records tablet upload size mismatches in the report handover manifest', () => {

        const imageStore = {
            getDirectoryPath: jest.fn().mockReturnValue('C:/field/images/original/')
        };
        const imageDocument = {
            resource: {
                id: 'photo-1',
                identifier: 'P-001',
                category: 'Photo',
                originalFilename: 'tablet-photo-1.jpg',
                fieldworkImageUploadedSizeBytes: 123,
                relations: {}
            }
        } as any;

        const manifest = exportImages(
            imageStore as any,
            [imageDocument],
            'C:/export',
            'fieldwork',
            false
        );
        const readmeWriteCall = mockElectronFs.writeFileSync.mock.calls.find(
            ([filePath]: string[]) => filePath === `C:/export/${FIELDWORK_IMAGE_EXPORT_README_FILENAME}`
        );

        expect(manifest.images[0].sourceFileSizeBytes).toBe(481516);
        expect(manifest.images[0].tabletUploadSizeMatchesSourceFile).toBe(false);
        expect(readmeWriteCall?.[1]).toContain('태블릿 크기 일치: false');
    });


    it('uses original filenames in the manifest when requested', () => {

        const imageStore = {
            getDirectoryPath: jest.fn().mockReturnValue('C:/field/images/original/')
        };
        const imageDocument = {
            resource: {
                id: 'drawing-1',
                identifier: 'D-001',
                category: 'Drawing',
                originalFilename: 'tablet/drawing:1?.png',
                relations: {}
            }
        } as any;

        const manifest = exportImages(
            imageStore as any,
            [imageDocument],
            'C:/export',
            'fieldwork',
            true
        );

        expect(mockElectronFs.copyFileSync).toHaveBeenCalledWith(
            'C:/field/images/original/drawing-1',
            'C:/export/tablet_drawing_1_.png'
        );
        expect(manifest.images[0].exportedFilename).toBe('tablet_drawing_1_.png');
        expect(manifest.images[0].originalFilename).toBe('tablet/drawing:1?.png');
        expect(manifest.images[0].exportedFileSizeBytes).toBe(481516);
        expect(manifest.images[0].exportedFileMd5).toBe(getExpectedMd5());
        expect(manifest.images[0].exportedFileSha256).toBe(getExpectedSha256());
        expect(manifest.images[0].sourceFileMd5).toBe(getExpectedMd5());
        expect(manifest.images[0].sourceFileSha256).toBe(getExpectedSha256());
    });


    it('uses the resource id as export filename fallback when an image has no identifier', () => {

        const imageStore = {
            getDirectoryPath: jest.fn().mockReturnValue('C:/field/images/original/')
        };
        const imageDocument = {
            resource: {
                id: 'photo-1',
                category: 'Photo',
                originalFilename: 'tablet-photo',
                relations: {
                    depicts: ['feature-1']
                }
            }
        } as any;

        const manifest = exportImages(
            imageStore as any,
            [imageDocument],
            'C:/export',
            'fieldwork',
            false,
            {
                'feature-1': {
                    id: 'feature-1',
                    identifier: '',
                    category: 'Feature',
                    resource: {
                        id: 'feature-1',
                        category: 'Feature',
                        relations: {}
                    }
                }
            }
        );

        expect(mockElectronFs.copyFileSync).toHaveBeenCalledWith(
            'C:/field/images/original/photo-1',
            'C:/export/photo-1'
        );
        expect(manifest.images[0].exportedFilename).toBe('photo-1');
        expect(manifest.images[0].identifier).toBe('photo-1');
        expect(manifest.images[0].relatedDocuments?.[0].identifier).toBe('feature-1');
    });


    it('flags exported originals whose bytes do not match the tablet upload checksum', () => {

        const imageStore = {
            getDirectoryPath: jest.fn().mockReturnValue('C:/field/images/original/')
        };
        const imageDocument = {
            resource: {
                id: 'photo-1',
                identifier: 'P-001',
                category: 'Photo',
                originalFilename: 'photo.jpg',
                relations: {},
                fieldworkImageUploadedMd5: 'different-tablet-md5'
            }
        } as any;

        const manifest = exportImages(
            imageStore as any,
            [imageDocument],
            'C:/export',
            'fieldwork',
            false
        );

        expect(manifest.images[0].sourceFileMd5).toBe(getExpectedMd5());
        expect(manifest.images[0].tabletUploadMd5MatchesSourceFile).toBe(false);
    });


    it('sanitizes identifier-based filenames and avoids overwriting duplicate exports', () => {

        const imageStore = {
            getDirectoryPath: jest.fn().mockReturnValue('C:/field/images/original/')
        };
        const imageDocuments = [
            {
                resource: {
                    id: 'photo-1',
                    identifier: 'Feature:01/Photo?',
                    category: 'Photo',
                    originalFilename: 'photo.jpg',
                    relations: {}
                }
            },
            {
                resource: {
                    id: 'photo-2',
                    identifier: 'Feature:01/Photo?',
                    category: 'Photo',
                    originalFilename: 'photo.jpg',
                    relations: {}
                }
            }
        ] as any;

        const manifest = exportImages(
            imageStore as any,
            imageDocuments,
            'C:/export',
            'fieldwork',
            false
        );

        expect(mockElectronFs.copyFileSync).toHaveBeenCalledWith(
            'C:/field/images/original/photo-1',
            'C:/export/Feature_01_Photo_.jpg'
        );
        expect(mockElectronFs.copyFileSync).toHaveBeenCalledWith(
            'C:/field/images/original/photo-2',
            'C:/export/Feature_01_Photo__2.jpg'
        );
        expect(manifest.images.map(image => image.exportedFilename)).toEqual([
            'Feature_01_Photo_.jpg',
            'Feature_01_Photo__2.jpg'
        ]);
    });


    it('neutralizes spreadsheet formulas in the CSV manifest without changing the JSON manifest', () => {

        const imageStore = {
            getDirectoryPath: jest.fn().mockReturnValue('C:/field/images/original/')
        };
        const imageDocument = {
            resource: {
                id: 'photo-1',
                identifier: '=HYPERLINK("https://example.invalid","open")',
                category: 'Photo',
                originalFilename: '+tablet-photo.jpg',
                relations: {
                    depicts: ['feature-1']
                },
                fieldworkPhotoUri: '@tablet/DCIM/photo-1.jpg',
                reportCrossCheck: ['-needs review']
            }
        } as any;

        const manifest = exportImages(
            imageStore as any,
            [imageDocument],
            'C:/export',
            'fieldwork',
            true,
            {
                'feature-1': {
                    id: 'feature-1',
                    identifier: '@Feature 1',
                    category: 'Feature',
                    resource: {
                        id: 'feature-1',
                        identifier: '@Feature 1',
                        category: 'Feature',
                        shortDescription: '=needs review',
                        relations: {}
                    }
                }
            }
        );

        const csvWriteCall = mockElectronFs.writeFileSync.mock.calls.find(
            ([filePath]: string[]) => filePath === `C:/export/${FIELDWORK_IMAGE_EXPORT_CSV_MANIFEST_FILENAME}`
        );
        const writtenCsv = csvWriteCall?.[1];

        expect(manifest.images[0].identifier).toBe('=HYPERLINK("https://example.invalid","open")');
        expect(manifest.images[0].originalFilename).toBe('+tablet-photo.jpg');
        expect(writtenCsv).toContain('\'=HYPERLINK');
        expect(writtenCsv).toContain('\'+tablet-photo.jpg');
        expect(writtenCsv).toContain('\'@tablet/DCIM/photo-1.jpg');
        expect(writtenCsv).toContain('\'-needs review');
    });
});


const getExpectedSha256 = (): string =>
    require('crypto')
        .createHash('sha256')
        .update(Buffer.from('tablet original bytes'))
        .digest('hex');

const getExpectedMd5 = (): string =>
    require('crypto')
        .createHash('md5')
        .update(Buffer.from('tablet original bytes'))
        .digest('hex');
