import {DoceditComponent} from '../../../../app/components/docedit/docedit.component';
import {DoceditActiveTabService} from '../../../../app/components/docedit/docedit-active-tab-service';

/**
 * @author Daniel de Oliveira
 */
describe('DoceditComponent', () => {

    let activeTabService: any;
    let docedit: any;


    beforeEach(() => {

        const typeUtility = jasmine.createSpyObj('typeUtility', ['getSubtypes']);
        typeUtility.getSubtypes.and.returnValue({'Object':[]});
        const documentHolder = jasmine.createSpyObj('documentHolder', ['setClonedDocument']);
        const projectConfiguration = jasmine.createSpyObj('projectConfiguration', ['getFieldDefinitionLabel']);
        activeTabService = new DoceditActiveTabService();

        docedit = new DoceditComponent(
            undefined,
            documentHolder,
            undefined,
            undefined,
            undefined,
            typeUtility,
            activeTabService,
            projectConfiguration,
            undefined,
            (() => 'Projekt') as any
        );
    });


    it('open last open tab', () => {

        activeTabService.setActiveTab('relations');

        docedit.setDocument({
            resource: {
                type: 'Object',
                id: '1',
                relations: {}
            }
        });

        expect(activeTabService.getActiveTab()).toEqual('relations');
    });


    it('open fields tab on new document', () => {

        activeTabService.setActiveTab('relations');

        docedit.setDocument({
            resource: {
                type: 'Object',
                // no id -> new
                relations: {}
            }
        });

        expect(activeTabService.getActiveTab()).toEqual('fields');
    });
});