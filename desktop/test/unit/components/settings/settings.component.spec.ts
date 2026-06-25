jest.mock('address', () => ({
    ip: () => '127.0.0.1'
}));

jest.mock('src/app/electron/electron', () => ({
    electronFs: { promises: {} },
    electronIpc: undefined,
    electronPath: { sep: '/' },
    electronRemote: {
        dialog: { showOpenDialog: jest.fn() },
        getCurrentWindow: jest.fn(),
        getGlobal: (key: string) => key === 'os'
            ? 'Windows_NT'
            : undefined
    }
}), { virtual: true });

jest.mock('../../../../src/app/services/settings/settings-service', () => ({
    SettingsService: class SettingsService {}
}));

import { M } from '../../../../src/app/components/messages/m';
import { SettingsComponent } from '../../../../src/app/components/settings/settings.component';


describe('SettingsComponent', () => {

    it('loads Korean fieldwork setup from the selected project document', async () => {

        const projectDocument = createProjectDocument({
            projectInvestigationMode: 'excavation',
            projectBoundarySummary: 'Area 1 boundary'
        });
        const component = createComponent({
            get: jest.fn().mockResolvedValue(projectDocument)
        });

        await component.ngOnInit();

        expect(component.isKoreanFieldworkProject()).toBe(true);
        expect(component.koreanInvestigationMode).toBe('excavation');
        expect(component.koreanBoundarySummary).toBe('Area 1 boundary');
        expect(component.hasKoreanProjectSetupChanges()).toBe(false);
    });


    it('falls back to the default mode when a tablet-synced project document has an invalid mode', async () => {

        const projectDocument = createProjectDocument({
            projectInvestigationMode: 'bad-mode',
            projectBoundarySummary: 'Area 1 boundary'
        });
        const component = createComponent({
            get: jest.fn().mockResolvedValue(projectDocument)
        });

        await component.ngOnInit();

        expect(component.koreanInvestigationMode).toBe('trialTrench');
        expect(component.koreanBoundarySummary).toBe('Area 1 boundary');
    });


    it('exposes tablet sync values in the Korean fieldwork settings section', async () => {

        const component = createComponent({
            get: jest.fn().mockResolvedValue(createProjectDocument({
                projectInvestigationMode: 'trialTrench',
                projectBoundarySummary: 'Area 1 boundary'
            }))
        });

        await component.ngOnInit();
        component.settings.hostPassword = 'field-secret';

        expect(component.getKoreanTabletSyncUrl()).toBe('http://127.0.0.1:3000');
        expect(component.hasKoreanTabletSyncPassword()).toBe(true);
        expect(component.getKoreanTabletSyncPassword()).toBe('field-secret');

        component.settings.hostPassword = '  ';

        expect(component.hasKoreanTabletSyncPassword()).toBe(false);
    });


    it('tracks Kakao map provider keys in the Korean fieldwork settings section', async () => {

        const component = createComponent({
            get: jest.fn().mockResolvedValue(createProjectDocument({
                projectInvestigationMode: 'trialTrench',
                projectBoundarySummary: 'Area 1 boundary'
            }))
        });

        await component.ngOnInit();

        expect(component.hasKoreanSatelliteMapDisplayKey()).toBe(false);
        expect(component.getKoreanMapProviderNotice()).toContain('REST 키만으로는 지도 화면을 표시할 수 없습니다');

        component.settings.mapProviderSettings.kakaoLocalRestApiKey = 'rest-key';

        expect(component.hasKoreanSatelliteMapDisplayKey()).toBe(false);
        expect(component.getKoreanMapProviderNotice()).toContain('주소 검색과 좌표 변환용');

        component.settings.mapProviderSettings.kakaoNativeAppKey = 'native-key';

        expect(component.hasKoreanSatelliteMapDisplayKey()).toBe(false);
        expect(component.getKoreanMapProviderNotice()).toContain('JavaScript 키 WebView 경로를 우선 사용');

        component.settings.mapProviderSettings.kakaoMapJavaScriptKey = 'js-key';

        expect(component.hasKoreanSatelliteMapDisplayKey()).toBe(true);
        expect(component.getKoreanMapProviderNotice()).toContain('JavaScript 키');
    });


    it('saves Korean fieldwork setup changes with general settings', async () => {

        const projectDocument = createProjectDocument({
            projectInvestigationMode: 'trialTrench',
            projectBoundarySummary: 'Area 1 boundary'
        });
        const datastore = {
            get: jest.fn().mockResolvedValue(projectDocument),
            update: jest.fn(async document => document)
        };
        const settingsService = {
            updateSettings: jest.fn().mockResolvedValue(undefined),
            setupSync: jest.fn().mockResolvedValue(undefined)
        };
        const messages = { add: jest.fn() };
        const component = createComponent(datastore, settingsService, messages);

        await component.ngOnInit();
        component.setKoreanInvestigationMode('surfaceSurvey');
        component.koreanBoundarySummary = '  Area 2 boundary  ';
        component.markKoreanProjectSetupChanged();

        await component.save();

        expect(settingsService.updateSettings).toHaveBeenCalled();
        expect(datastore.update).toHaveBeenCalledWith(expect.objectContaining({
            resource: expect.objectContaining({
                projectInvestigationMode: 'surfaceSurvey',
                projectBoundarySetupState: 'draftBoundary',
                projectBoundarySummary: 'Area 2 boundary',
                shortDescription: 'Area 2 boundary'
            })
        }));
        expect(settingsService.setupSync).toHaveBeenCalled();
        expect(messages.add).toHaveBeenCalledWith([M.SETTINGS_SUCCESS]);
        expect(component.koreanProjectSetupSaved).toBe(true);
    });


    it('blocks saving Korean fieldwork setup changes until required project basics are filled in', async () => {

        const projectDocument = createProjectDocument({
            projectInvestigationMode: 'trialTrench',
            projectBoundarySummary: 'Area 1 boundary'
        });
        const settingsService = {
            updateSettings: jest.fn(),
            setupSync: jest.fn()
        };
        const messages = { add: jest.fn() };
        const component = createComponent(
            { get: jest.fn().mockResolvedValue(projectDocument), update: jest.fn() },
            settingsService,
            messages
        );

        await component.ngOnInit();
        component.koreanBoundarySummary = '';
        component.markKoreanProjectSetupChanged();

        await component.save();

        expect(messages.add).toHaveBeenCalledWith([M.PROJECT_CREATION_ERROR_KOREAN_FIELDWORK_SETUP]);
        expect(settingsService.updateSettings).not.toHaveBeenCalled();
    });
});


const createComponent = (
    datastore: any,
    settingsService: any = {
        updateSettings: jest.fn().mockResolvedValue(undefined),
        setupSync: jest.fn().mockResolvedValue(undefined)
    },
    messages: any = { add: jest.fn() }
) => new SettingsComponent(
    {
        getSettings: () => createSettings(),
        settingsChangesNotifications: () => ({ subscribe: jest.fn() })
    } as any,
    settingsService,
    messages,
    { openActiveTab: jest.fn() } as any,
    { getContext: jest.fn() } as any,
    { transform: (value: number) => value.toString() } as any,
    datastore,
    createProjectConfiguration() as any
);


const createSettings = () => ({
    selectedProject: 'fieldwork-1',
    languages: ['ko'],
    username: 'tester',
    hostPassword: '',
    imagestorePath: '',
    backupDirectoryPath: '',
    allowLargeFileUploads: false,
    mapProviderSettings: {
        kakaoLocalRestApiKey: '',
        kakaoMapJavaScriptKey: '',
        kakaoNativeAppKey: ''
    },
    isAutoUpdateActive: false,
    keepBackups: {
        custom: 0,
        customInterval: 0,
        daily: 0,
        weekly: 0,
        monthly: 0
    }
});


const createProjectConfiguration = () => ({
    getCategory: (categoryName: string) => categoryName === 'Project'
        ? {
            groups: [
                {
                    name: 'stem',
                    fields: [
                        { name: 'projectInvestigationMode' },
                        { name: 'projectBoundarySummary' }
                    ]
                }
            ]
        }
        : undefined
});


const createProjectDocument = (fields: { [fieldName: string]: unknown }) => ({
    _id: 'project',
    resource: {
        id: 'project',
        category: 'Project',
        identifier: 'fieldwork-1',
        relations: {},
        ...fields
    },
    created: { user: 'tester', date: new Date() },
    modified: [{ user: 'tester', date: new Date() }]
});
