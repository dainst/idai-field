import {DoceditComponent} from '../../../../app/components/docedit/docedit.component';

/**
 * @author Daniel de Oliveira
 */
describe('DoceditComponent', () => {

    let docedit: any;


    beforeEach(() => {

        const typeUtility = jasmine.createSpyObj('typeUtility', ['getTypeAndSubtypes']);
        typeUtility.getTypeAndSubtypes.and.returnValue({ 'Object': [] });
        const documentHolder = jasmine.createSpyObj('documentHolder', ['setDocument']);
        const projectConfiguration = jasmine.createSpyObj('projectConfiguration', ['getFieldDefinitionLabel']);

        docedit = new DoceditComponent(
            undefined,
            documentHolder,
            undefined,
            undefined,
            undefined,
            typeUtility,
            projectConfiguration,
            undefined,
            (() => 'Projekt') as any
        );
    });


    // TODO Check if docedit tests are needed or if this test suite can be removed
});