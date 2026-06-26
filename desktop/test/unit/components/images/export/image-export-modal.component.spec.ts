jest.mock('src/app/electron/electron', () => ({
    electronFs: { promises: {} },
    electronPath: { sep: '/' },
    electronRemote: {
        dialog: {
            showOpenDialog: jest.fn()
        },
        getCurrentWindow: jest.fn(),
        getGlobal: (key: string) => key === 'os'
            ? 'Windows_NT'
            : undefined
    }
}), { virtual: true });

jest.mock('../../../../../src/app/services/imagestore/export-images', () => ({
    exportImages: jest.fn()
}));

import { exportImages } from '../../../../../src/app/services/imagestore/export-images';
import { ImageExportModalComponent } from '../../../../../src/app/components/image/export/image-export-modal.component';


describe('ImageExportModalComponent', () => {

    beforeEach(() => {
        jest.clearAllMocks();
    });


    it('passes related records and project fieldwork context into image export', async () => {

        const activeModal = { close: jest.fn(), dismiss: jest.fn() };
        const datastore = {
            get: jest.fn(async (id: string) => {
                if (id === 'project') {
                    return {
                        resource: {
                            id: 'project',
                            identifier: 'fieldwork',
                            category: 'Project',
                            projectInvestigationMode: 'trialTrench',
                            projectBoundarySetupState: 'draftBoundary',
                            projectBoundarySummary: '1구역 북쪽 능선부터 남쪽 농로까지',
                            shortDescription: '북쪽 능선 조사',
                            coordinateReferenceSystem: 'EPSG:5186',
                            relations: {}
                        }
                    };
                }
                if (id === 'feature-1') {
                    return {
                        resource: {
                            id: 'feature-1',
                            identifier: '수혈 1',
                            category: 'Feature',
                            shortDescription: 'pit fill',
                            relations: {}
                        }
                    };
                }

                throw new Error('missing document');
            })
        };
        const imageStore = {};
        const imageDocument = {
            resource: {
                id: 'photo-1',
                identifier: 'P-001',
                category: 'Photo',
                relations: {
                    depicts: ['feature-1'],
                    isRecordedIn: ['missing-record']
                }
            }
        } as any;
        const component = createComponent({
            activeModal,
            datastore,
            imageStore,
            selectedProject: 'fieldwork'
        });
        component.images = [imageDocument];
        component.targetDirectoryPath = 'C:/export';

        await component.startExport();

        expect(datastore.get).toHaveBeenCalledWith('project');
        expect(datastore.get).toHaveBeenCalledWith('feature-1');
        expect(datastore.get).toHaveBeenCalledWith('missing-record');
        expect(exportImages).toHaveBeenCalledWith(
            imageStore,
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
                        shortDescription: 'pit fill',
                        relations: {}
                    }
                }
            },
            {
                id: 'project',
                identifier: 'fieldwork',
                category: 'Project',
                projectInvestigationMode: 'trialTrench',
                projectBoundarySetupState: 'draftBoundary',
                projectBoundarySummary: '1구역 북쪽 능선부터 남쪽 농로까지',
                shortDescription: '북쪽 능선 조사',
                coordinateReferenceSystem: 'EPSG:5186',
                relations: {}
            }
        );
        expect(activeModal.close).toHaveBeenCalled();
    });


    it('still exports images when the project document cannot be read', async () => {

        const imageStore = {};
        const imageDocument = {
            resource: {
                id: 'photo-1',
                identifier: 'P-001',
                category: 'Photo',
                relations: {}
            }
        } as any;
        const component = createComponent({
            datastore: {
                get: jest.fn(async () => {
                    throw new Error('project missing');
                })
            },
            imageStore,
            selectedProject: 'fieldwork'
        });
        component.images = [imageDocument];
        component.targetDirectoryPath = 'C:/export';

        await component.startExport();

        expect(exportImages).toHaveBeenCalledWith(
            imageStore,
            [imageDocument],
            'C:/export',
            'fieldwork',
            false,
            {},
            {}
        );
    });


    it('uses related record ids as export context fallback when identifiers are missing', async () => {

        const imageStore = {};
        const imageDocument = {
            resource: {
                id: 'photo-1',
                identifier: 'P-001',
                category: 'Photo',
                relations: {
                    depicts: ['feature-1']
                }
            }
        } as any;
        const component = createComponent({
            datastore: {
                get: jest.fn(async (id: string) => {
                    if (id === 'project') {
                        return { resource: { id: 'project', category: 'Project', relations: {} } };
                    }
                    if (id === 'feature-1') {
                        return {
                            resource: {
                                id: 'feature-1',
                                category: 'Feature',
                                relations: {}
                            }
                        };
                    }

                    throw new Error('missing document');
                })
            },
            imageStore,
            selectedProject: 'fieldwork'
        });
        component.images = [imageDocument];
        component.targetDirectoryPath = 'C:/export';

        await component.startExport();

        expect(exportImages).toHaveBeenCalledWith(
            imageStore,
            [imageDocument],
            'C:/export',
            'fieldwork',
            false,
            {
                'feature-1': {
                    id: 'feature-1',
                    identifier: 'feature-1',
                    category: 'Feature',
                    resource: {
                        id: 'feature-1',
                        category: 'Feature',
                        relations: {}
                    }
                }
            },
            {
                id: 'project',
                category: 'Project',
                relations: {}
            }
        );
    });
});


const createComponent = ({
    activeModal = { close: jest.fn(), dismiss: jest.fn() },
    datastore = { get: jest.fn() },
    imageStore = {},
    selectedProject = 'fieldwork'
}: {
    activeModal?: any;
    datastore?: any;
    imageStore?: any;
    selectedProject?: string;
} = {}) => new ImageExportModalComponent(
    activeModal,
    { getFolderPath: jest.fn(), setFolderPath: jest.fn() } as any,
    imageStore as any,
    {
        getSettings: () => ({ selectedProject })
    } as any,
    { add: jest.fn() } as any,
    { getContext: jest.fn() } as any,
    {
        getCategory: jest.fn()
    } as any,
    {
        getFieldLabel: jest.fn()
    } as any,
    datastore as any
);
