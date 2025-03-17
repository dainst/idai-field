import { Map } from 'tsfun';
import { TransientFormDefinition } from '../../../src/configuration/model/form/transient-form-definition';
import { buildWorkflowRelations } from '../../../src/configuration/boot/build-workflow-relations';


/**
 * @author Thomas Kleinke
 */
describe('buildWorkflowRelations', () => {

    it('add a relation', () => {

        const forms: Map<TransientFormDefinition> = {
            'WorkflowStepA:default': {
                name: 'WorkflowStepA:default',
                categoryName: 'WorkflowStepA',
                description: {},
                createdBy: '',
                creationDate: '',
                fields: {},
                groups: [],
                range: {
                    isWorkflowStepOf: ['FindA', 'FindB'],
                    produces: ['FindC']
                }
            },
            'WorkflowStepB:default': {
                name: 'WorkflowStepB:default',
                categoryName: 'WorkflowStepB',
                description: {},
                createdBy: '',
                creationDate: '',
                fields: {},
                groups: [],
                range: {
                    isWorkflowStepOf: ['FindA', 'FindD']
                }
            }
        }

        const relations = buildWorkflowRelations(forms);

        expect(relations.length).toBe(7);

        expect(relations[0]).toEqual({
            name: 'isWorkflowStepOf',
            inverse: 'hasWorkflowStep',
            domain: ['WorkflowStepA'],
            range: ['FindA', 'FindB'],
            inputType: 'relation'
        });

        expect(relations[1]).toEqual({
            name: 'isWorkflowStepOf',
            inverse: 'hasWorkflowStep',
            domain: ['WorkflowStepB'],
            range: ['FindA', 'FindD'],
            inputType: 'relation'
        });

        expect(relations[2]).toEqual({
            name: 'hasWorkflowStep',
            inverse: 'isWorkflowStepOf',
            domain: ['FindA'],
            range: ['WorkflowStepA', 'WorkflowStepB'],
            inputType: 'relation'
        });

        expect(relations[3]).toEqual({
            name: 'hasWorkflowStep',
            inverse: 'isWorkflowStepOf',
            domain: ['FindB'],
            range: ['WorkflowStepA'],
            inputType: 'relation'
        });

        expect(relations[4]).toEqual({
            name: 'hasWorkflowStep',
            inverse: 'isWorkflowStepOf',
            domain: ['FindD'],
            range: ['WorkflowStepB'],
            inputType: 'relation'
        });

        expect(relations[5]).toEqual({
            name: 'produces',
            inverse: 'isProducedIn',
            domain: ['WorkflowStepA'],
            range: ['FindC'],
            inputType: 'relation'
        });

        expect(relations[6]).toEqual({
            name: 'isProducedIn',
            inverse: 'produces',
            domain: ['FindC'],
            range: ['WorkflowStepA'],
            inputType: 'relation'
        });
    });
});
