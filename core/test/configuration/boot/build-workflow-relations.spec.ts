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
                    isExecutedOn: ['FindA', 'FindB'],
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
                    isExecutedOn: ['FindA', 'FindD']
                }
            }
        }

        const relations = buildWorkflowRelations(forms);

        expect(relations.length).toBe(7);

        expect(relations[0]).toEqual({
            name: 'isExecutedOn',
            inverse: 'isExecutionTargetOf',
            domain: ['WorkflowStepA'],
            range: ['FindA', 'FindB'],
            inputType: 'relation',
            editable: false,
            visible: false
        });

        expect(relations[1]).toEqual({
            name: 'isExecutedOn',
            inverse: 'isExecutionTargetOf',
            domain: ['WorkflowStepB'],
            range: ['FindA', 'FindD'],
            inputType: 'relation',
            editable: false,
            visible: false
        });

        expect(relations[2]).toEqual({
            name: 'isExecutionTargetOf',
            inverse: 'isExecutedOn',
            domain: ['FindA'],
            range: ['WorkflowStepA', 'WorkflowStepB'],
            inputType: 'relation',
            editable: false,
            visible: false
        });

        expect(relations[3]).toEqual({
            name: 'isExecutionTargetOf',
            inverse: 'isExecutedOn',
            domain: ['FindB'],
            range: ['WorkflowStepA'],
            inputType: 'relation',
            editable: false,
            visible: false
        });

        expect(relations[4]).toEqual({
            name: 'isExecutionTargetOf',
            inverse: 'isExecutedOn',
            domain: ['FindD'],
            range: ['WorkflowStepB'],
            inputType: 'relation',
            editable: false,
            visible: false
        });

        expect(relations[5]).toEqual({
            name: 'produces',
            inverse: 'isProducedIn',
            domain: ['WorkflowStepA'],
            range: ['FindC'],
            inputType: 'relation',
            editable: false,
            visible: false
        });

        expect(relations[6]).toEqual({
            name: 'isProducedIn',
            inverse: 'produces',
            domain: ['FindC'],
            range: ['WorkflowStepA'],
            inputType: 'relation',
            editable: false,
            visible: false
        });
    });
});
