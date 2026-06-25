jest.mock('src/app/electron/electron', () => ({
    electronFs: { promises: {} },
    electronIpc: undefined,
    electronPath: { sep: '/' },
    electronRemote: {
        getGlobal: (key: string) => key === 'config'
            ? { languages: ['de', 'en', 'ko'] }
            : undefined
    }
}), { virtual: true });

jest.mock('../../../../src/app/services/settings/settings-service', () => ({
    SettingsService: class SettingsService {}
}));
jest.mock('../../../../src/app/services/reload', () => ({
    reloadAndSwitchToHomeRoute: jest.fn()
}));

import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { KOREAN_FIELDWORK_TEMPLATE_ID } from 'idai-field-core';
import { M } from '../../../../src/app/components/messages/m';
import { CreateProjectModalComponent } from '../../../../src/app/components/project/create-project-modal.component';


/**
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 */
describe('CreateProjectModalComponent', () => {

    let createProjectModalComponent: CreateProjectModalComponent;
    let settingsProvider;
    let settingsService;
    let messages;


    beforeEach(() => {
        
        settingsProvider = {
            getSettings: jest.fn()
        };

        settingsService = {
            deleteProject: jest.fn()
        };

        messages = {
            add: jest.fn()
        };

        settingsService = {
            createProject: jest.fn().mockResolvedValue(undefined),
            deleteProject: jest.fn()
        };

        createProjectModalComponent = new CreateProjectModalComponent(
            { close: () => {} } as NgbActiveModal,
            settingsService,
            settingsProvider,
            messages,
            undefined,
            undefined,
            undefined,
            undefined
        );
    });


    test('cannot create project with existing identifier', async () => {

        settingsProvider.getSettings.mockReturnValue({ dbs: ['existing'], selectedProject: 'existing' });

        createProjectModalComponent.projectIdentifier = 'existing';

        await createProjectModalComponent.createProject();
        expect(messages.add).toHaveBeenCalledWith([M.PROJECT_CREATION_ERROR_IDENTIFIER_EXISTS, 'existing']);
    });


    test('requires Korean fieldwork setup before creating a Korean fieldwork project', async () => {

        settingsProvider.getSettings.mockReturnValue({ dbs: [] });
        selectKoreanFieldworkTemplate();
        createProjectModalComponent.page = 2;
        createProjectModalComponent.projectIdentifier = 'fieldwork';
        createProjectModalComponent.koreanBoundarySummary = '   ';

        expect(createProjectModalComponent.isFilledIn()).toBe(false);
        expect(createProjectModalComponent.getKoreanFieldworkSetupStatus()).toBe(
            '조사 방식을 선택해야 프로젝트를 만들 수 있습니다.'
        );

        await createProjectModalComponent.createProject();

        expect(settingsService.createProject).not.toHaveBeenCalled();
        expect(messages.add).toHaveBeenCalledWith([M.PROJECT_CREATION_ERROR_KOREAN_FIELDWORK_SETUP]);
    });


    test('requires a boundary after the investigation mode is explicitly selected', async () => {

        settingsProvider.getSettings.mockReturnValue({ dbs: [] });
        selectKoreanFieldworkTemplate();
        createProjectModalComponent.page = 2;
        createProjectModalComponent.projectIdentifier = 'fieldwork';
        createProjectModalComponent.koreanInvestigationMode = 'excavation';
        createProjectModalComponent.koreanBoundarySummary = '   ';

        expect(createProjectModalComponent.isFilledIn()).toBe(false);
        expect(createProjectModalComponent.getKoreanFieldworkSetupStatus()).toBe(
            '조사 경계를 입력해야 프로젝트를 만들 수 있습니다.'
        );

        await createProjectModalComponent.createProject();

        expect(settingsService.createProject).not.toHaveBeenCalled();
        expect(messages.add).toHaveBeenCalledWith([M.PROJECT_CREATION_ERROR_KOREAN_FIELDWORK_SETUP]);
    });


    test('passes Korean fieldwork project setup into project creation', async () => {

        settingsProvider.getSettings.mockReturnValue({ dbs: [] });
        selectKoreanFieldworkTemplate();
        createProjectModalComponent.page = 2;
        createProjectModalComponent.projectIdentifier = 'fieldwork';
        createProjectModalComponent.koreanInvestigationMode = 'excavation';
        createProjectModalComponent.koreanBoundarySummary = '  1구역 북쪽 능선부터 남쪽 농로까지  ';

        expect(createProjectModalComponent.isFilledIn()).toBe(true);
        expect(createProjectModalComponent.getKoreanFieldworkSetupStatus()).toBe(
            '프로젝트 생성 후 지도에서 조사 경계를 그리거나 가져와 확정하세요.'
        );

        await createProjectModalComponent.createProject();

        expect(settingsService.createProject).toHaveBeenCalledWith(
            'fieldwork',
            expect.objectContaining({ name: KOREAN_FIELDWORK_TEMPLATE_ID }),
            ['ko'],
            undefined,
            undefined,
            {
                projectInvestigationMode: 'excavation',
                projectBoundarySetupState: 'draftBoundary',
                projectBoundarySummary: '1구역 북쪽 능선부터 남쪽 농로까지'
            }
        );
    });


    test('shows the Korean fieldwork project start sequence', () => {

        expect(createProjectModalComponent.koreanFieldworkStartSteps).toEqual([
            '프로젝트 기본 조사 방식을 정합니다.',
            '조사 경계 기준을 문장으로 남깁니다.',
            '프로젝트 생성 후 지도에서 경계를 그리거나 가져옵니다.'
        ]);
    });


    function selectKoreanFieldworkTemplate() {

        createProjectModalComponent.selectedTemplate = { name: KOREAN_FIELDWORK_TEMPLATE_ID } as any;
        createProjectModalComponent.selectedLanguages = ['ko'];
        createProjectModalComponent.selectedLanguageObjects = [];
    }
});
