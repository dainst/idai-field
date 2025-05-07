import { WorkflowStepResource } from '../../src/model/document/workflow-step-resource';


/**
 * @author Thomas Kleinke
 */
describe('WorkflowStepResource', () => {

    it('validate state "planned" as valid', () => {

        expect(
            WorkflowStepResource.validateState({
                state: 'planned',
                date: { value: '01.02.2025', isRange: false }
            } as WorkflowStepResource,
            new Date('2025-01-01')
        )).toBe(true);

        expect(
            WorkflowStepResource.validateState({
                state: 'planned',
                date: { value: '02.2025', isRange: false }
            } as WorkflowStepResource,
            new Date('2025-02-15')
        )).toBe(true);

        expect(
            WorkflowStepResource.validateState({
                state: 'planned',
                date: { value: '2025', isRange: false }
            } as WorkflowStepResource,
            new Date('2025-06-01')
        )).toBe(true);

        expect(
            WorkflowStepResource.validateState({
                state: 'planned',
                date: { value: '01.02.2025', endValue: '01.03.2025', isRange: true }
            } as WorkflowStepResource,
            new Date('2025-01-01')
        )).toBe(true);

        expect(
            WorkflowStepResource.validateState({
                state: 'planned',
                date: { value: '01.02.2025', endValue: '01.03.2025', isRange: true }
            } as WorkflowStepResource,
            new Date('2025-02-15')
        )).toBe(true);
    });


    it('validate state "planned" as invalid', () => {

        expect(
            WorkflowStepResource.validateState({
                state: 'planned',
                date: { value: '01.02.2025', isRange: false }
            } as WorkflowStepResource,
            new Date('2025-03-01')
        )).toBe(false);

        expect(
            WorkflowStepResource.validateState({
                state: 'planned',
                date: { value: '02.2025', isRange: false }
            } as WorkflowStepResource,
            new Date('2025-03-01')
        )).toBe(false);

        expect(
            WorkflowStepResource.validateState({
                state: 'planned',
                date: { value: '2025', isRange: false }
            } as WorkflowStepResource,
            new Date('2026-01-01')
        )).toBe(false);

        expect(
            WorkflowStepResource.validateState({
                state: 'planned',
                date: { value: '01.02.2025', endValue: '01.03.2025', isRange: true }
            } as WorkflowStepResource,
            new Date('2025-04-01')
        )).toBe(false);
    });


    it('validate state "in progress" as valid', () => {

        expect(
            WorkflowStepResource.validateState({
                state: 'in progress',
                date: { value: '01.02.2025', isRange: false }
            } as WorkflowStepResource,
            new Date('2025-03-01')
        )).toBe(true);

        expect(
            WorkflowStepResource.validateState({
                state: 'in progress',
                date: { value: '02.2025', isRange: false }
            } as WorkflowStepResource,
            new Date('2025-02-15')
        )).toBe(true);

        expect(
            WorkflowStepResource.validateState({
                state: 'in progress',
                date: { value: '2025', isRange: false }
            } as WorkflowStepResource,
            new Date('2025-06-01')
        )).toBe(true);

        expect(
            WorkflowStepResource.validateState({
                state: 'in progress',
                date: { value: '01.02.2025', endValue: '01.03.2025', isRange: true }
            } as WorkflowStepResource,
            new Date('2025-03-01')
        )).toBe(true);

        expect(
            WorkflowStepResource.validateState({
                state: 'in progress',
                date: { value: '01.02.2025', endValue: '01.03.2025', isRange: true }
            } as WorkflowStepResource,
            new Date('2025-02-15')
        )).toBe(true);

        expect(
            WorkflowStepResource.validateState({
                state: 'in progress',
                date: { value: '02.2025', endValue: '03.2025', isRange: true }
            } as WorkflowStepResource,
            new Date('2025-02-15')
        )).toBe(true);

        expect(
            WorkflowStepResource.validateState({
                state: 'in progress',
                date: { value: '02.2025', endValue: '03.2025', isRange: true }
            } as WorkflowStepResource,
            new Date('2025-03-15')
        )).toBe(true);
    });


    it('validate state "in progress" as invalid', () => {

        expect(
            WorkflowStepResource.validateState({
                state: 'in progress',
                date: { value: '01.02.2025', isRange: false }
            } as WorkflowStepResource,
            new Date('2025-01-01')
        )).toBe(false);

        expect(
            WorkflowStepResource.validateState({
                state: 'in progress',
                date: { value: '02.2025', isRange: false }
            } as WorkflowStepResource,
            new Date('2025-01-01')
        )).toBe(false);

        expect(
            WorkflowStepResource.validateState({
                state: 'in progress',
                date: { value: '2025', isRange: false }
            } as WorkflowStepResource,
            new Date('2024-12-01')
        )).toBe(false);

        expect(
            WorkflowStepResource.validateState({
                state: 'in progress',
                date: { value: '01.02.2025', endValue: '01.03.2025', isRange: true }
            } as WorkflowStepResource,
            new Date('2025-01-01')
        )).toBe(false);

        expect(
            WorkflowStepResource.validateState({
                state: 'in progress',
                date: { value: '01.02.2025', endValue: '01.03.2025', isRange: true }
            } as WorkflowStepResource,
            new Date('2025-04-01')
        )).toBe(false);
    });


    it('validate states "completed" and "canceled" as valid', () => {

        const states: string[] = ['completed', 'canceled'];
        
        for (let state of states) {
            expect(
                WorkflowStepResource.validateState({
                    state,
                    date: { value: '01.02.2025', isRange: false }
                } as WorkflowStepResource,
                new Date('2025-03-01')
            )).toBe(true);

            expect(
                WorkflowStepResource.validateState({
                    state,
                    date: { value: '02.2025', isRange: false }
                } as WorkflowStepResource,
                new Date('2025-02-15')
            )).toBe(true);

            expect(
                WorkflowStepResource.validateState({
                    state,
                    date: { value: '2025', isRange: false }
                } as WorkflowStepResource,
                new Date('2025-06-01')
            )).toBe(true);

            expect(
                WorkflowStepResource.validateState({
                    state,
                    date: { value: '01.02.2025', endValue: '01.03.2025', isRange: true }
                } as WorkflowStepResource,
                new Date('2025-04-01')
            )).toBe(true);
        }
    });


    it('validate states "completed" and "canceled" as invalid', () => {

        const states: string[] = ['completed', 'canceled'];
        
        for (let state of states) {
            expect(
                WorkflowStepResource.validateState({
                    state,
                    date: { value: '01.02.2025', isRange: false }
                } as WorkflowStepResource,
                new Date('2025-01-01')
            )).toBe(false);

            expect(
                WorkflowStepResource.validateState({
                    state,
                    date: { value: '02.2025', isRange: false }
                } as WorkflowStepResource,
                new Date('2025-01-01')
            )).toBe(false);

            expect(
                WorkflowStepResource.validateState({
                    state,
                    date: { value: '2025', isRange: false }
                } as WorkflowStepResource,
                new Date('2024-12-01')
            )).toBe(false);

            expect(
                WorkflowStepResource.validateState({
                    state,
                    date: { value: '01.02.2025', endValue: '01.03.2025', isRange: true }
                } as WorkflowStepResource,
                new Date('2025-01-01')
            )).toBe(false);

            expect(
                WorkflowStepResource.validateState({
                    state,
                    date: { value: '01.02.2025', endValue: '01.03.2025', isRange: true }
                } as WorkflowStepResource,
                new Date('2025-02-15')
            )).toBe(false);
        }
    });
});
