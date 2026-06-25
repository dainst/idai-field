jest.mock('src/app/electron/electron', () => ({
    electronRemote: undefined
}), { virtual: true });

jest.mock('../../../../../src/app/services/languages', () => ({
    Languages: {
        getAvailableLanguages: () => ({})
    }
}));

import { EditFormComponent } from '../../../../../src/app/components/docedit/core/edit-form.component';


describe('EditFormComponent Korean fieldwork detail visibility', () => {

    let component: EditFormComponent;


    beforeEach(() => {

        component = new EditFormComponent(
            { nativeElement: { getElementsByTagName: () => [] } } as any,
            { get: (item: any) => item.name } as any,
            { add: jest.fn() } as any
        );
        component.document = { resource: { category: 'Feature', relations: {} } } as any;
        component.fieldDefinitions = [
            { name: 'longAxisOrientation', editable: true },
            { name: 'freeDescription', editable: true }
        ] as any;
        component.groups = [
            {
                name: 'position',
                fields: [{ name: 'longAxisOrientation', editable: true }] as any
            },
            {
                name: 'description',
                fields: [{ name: 'freeDescription', editable: true }] as any
            }
        ] as any;
    });


    it('hides the generic detail tabs while Korean fieldwork panels are collapsed', () => {

        component.showKoreanFieldworkDetailedForm = false;

        expect(component.shouldShow('position')).toBe(false);
        expect(component.shouldShow('description')).toBe(false);
        expect(component.shouldShowGroupNavigation()).toBe(false);
        expect(component.shouldShowDetailedForm()).toBe(false);
        expect(component.shouldShowKoreanFieldworkRawStorageToggle()).toBe(false);
        expect(component.getHiddenFieldNames()).toContain('longAxisOrientation');
    });


    it('keeps empty raw storage groups hidden when the raw storage is expanded', () => {

        component.showKoreanFieldworkDetailedForm = true;

        expect(component.shouldShow('position')).toBe(false);
        expect(component.shouldShow('description')).toBe(false);
        expect(component.shouldShowGroupNavigation()).toBe(false);
        expect(component.shouldShowDetailedForm()).toBe(true);
        expect(component.shouldShowKoreanFieldworkRawStorageToggle()).toBe(true);
        expect(component.getHiddenFieldNames()).toEqual([]);
    });


    it('opens raw storage only when non-panel values exist', () => {

        component.document.resource.freeDescription = 'Legacy import note';
        component.groups = [{
            name: 'description',
            fields: [
                { name: 'freeDescription', editable: true },
                { name: 'emptyLegacyNote', editable: true }
            ] as any
        }] as any;
        component.fieldDefinitions.push({ name: 'emptyLegacyNote', editable: true } as any);

        expect(component.shouldShowKoreanFieldworkRawStorageToggle()).toBe(true);
        expect(component.shouldShowKoreanFieldworkRawStorageSummary()).toBe(true);

        component.showKoreanFieldworkDetailedForm = true;

        expect(component.shouldShow('description')).toBe(true);
        expect(component.getGroupFields('description').map(field => field.name)).toEqual([
            'freeDescription'
        ]);
        expect(component.shouldShowGroupNavigation()).toBe(true);
        expect(component.shouldShowKoreanFieldworkRawStorageSummary()).toBe(false);
    });


    it('uses auxiliary wording for Korean fieldwork raw storage', () => {

        component.document.resource.freeDescription = 'Legacy import note';

        expect(component.shouldShowKoreanFieldworkRawStorageToggle()).toBe(true);
        expect(component.shouldShowKoreanFieldworkRawStorageSummary()).toBe(true);
    });


    it('does not treat feature-specific guided values as raw storage', () => {

        component.groups = [{
            name: 'koreanFieldwork',
            fields: [{ name: 'potteryKilnPartInvestigation', editable: true }] as any
        }] as any;
        component.fieldDefinitions.push({ name: 'potteryKilnPartInvestigation', editable: true } as any);
        component.document.resource.potteryKilnPartInvestigation = ['combustionPartRecorded'];

        expect(component.shouldShowKoreanFieldworkRawStorageToggle()).toBe(false);

        component.showKoreanFieldworkDetailedForm = true;

        expect(component.shouldShow('koreanFieldwork')).toBe(false);
    });


    it('keeps ordinary non-Korean forms visible', () => {

        component.document.resource.category = 'Pottery';
        component.fieldDefinitions = [
            { name: 'identifier', editable: true },
            { name: 'freeDescription', editable: true }
        ] as any;
        component.groups = [{
            name: 'stem',
            fields: [
                { name: 'identifier', editable: true },
                { name: 'freeDescription', editable: true }
            ] as any
        }] as any;
        component.showKoreanFieldworkDetailedForm = false;

        expect(component.hasKoreanFieldworkPanelFields()).toBe(false);
        expect(component.shouldShow('stem')).toBe(true);
        expect(component.shouldShowDetailedForm()).toBe(true);
    });


    it('treats managed fieldwork categories as guided forms even without trigger fields', () => {

        component.fieldDefinitions = [
            { name: 'identifier', editable: true },
            { name: 'freeDescription', editable: true }
        ] as any;
        component.groups = [{
            name: 'stem',
            fields: [
                { name: 'identifier', editable: true },
                { name: 'freeDescription', editable: true }
            ] as any
        }] as any;
        component.showKoreanFieldworkDetailedForm = false;

        expect(component.hasKoreanFieldworkPanelFields()).toBe(true);
        expect(component.shouldShow('stem')).toBe(false);
        expect(component.shouldShowDetailedForm()).toBe(false);
        expect(component.shouldShowKoreanFieldworkRawStorageToggle()).toBe(false);
    });


    it('hides system raw groups even when the raw storage is expanded', () => {

        component.groups.push({
            name: 'hierarchy',
            fields: [{ name: 'isRecordedIn', editable: true }] as any
        } as any);
        component.fieldDefinitions.push({ name: 'isRecordedIn', editable: true } as any);
        component.showKoreanFieldworkDetailedForm = true;

        expect(component.shouldShow('hierarchy')).toBe(false);
    });


    it('keeps system raw groups hidden when imported relation values exist', () => {

        component.groups.push({
            name: 'hierarchy',
            fields: [{ name: 'isRecordedIn', editable: true }] as any
        } as any);
        component.fieldDefinitions.push({ name: 'isRecordedIn', editable: true } as any);
        component.document.resource.relations.isRecordedIn = ['layer-1'];
        component.showKoreanFieldworkDetailedForm = true;

        expect(component.shouldShowKoreanFieldworkRawStorageToggle()).toBe(true);
        expect(component.shouldShow('hierarchy')).toBe(false);
    });


    it('does not open raw storage for system-only relation values', () => {

        component.groups = [{
            name: 'hierarchy',
            fields: [{ name: 'isRecordedIn', editable: true }] as any
        }] as any;
        component.fieldDefinitions.push({ name: 'isRecordedIn', editable: true } as any);
        component.document.resource.relations.isRecordedIn = ['layer-1'];

        expect(component.shouldShowKoreanFieldworkRawStorageToggle()).toBe(false);
    });


    it('moves away from hidden auxiliary raw groups when opening the detailed form', () => {

        component.groups = [
            {
                name: 'hierarchy',
                fields: [{ name: 'isRecordedIn', editable: true }] as any
            },
            {
                name: 'description',
                fields: [{ name: 'freeDescription', editable: true }] as any
            }
        ] as any;
        component.fieldDefinitions.push({ name: 'isRecordedIn', editable: true } as any);
        component.document.resource.freeDescription = 'Legacy note';
        component.activeGroup = 'hierarchy';

        component.toggleKoreanFieldworkDetailedForm();

        expect(component.showKoreanFieldworkDetailedForm).toBe(true);
        expect(component.activeGroup).toBe('description');
        expect(component.shouldShowActiveDetailedFormGroup()).toBe(true);
    });
});
