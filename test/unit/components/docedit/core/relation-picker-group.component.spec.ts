/**
 * @author Thomas Kleinke
 */
import {RelationPickerGroupComponent} from '../../../../../app/components/docedit/widgets/relationspick/relation-picker-group.component';

describe('RelationPickerGroupComponent', () => {

    let document: any;
    let relationPickerGroupComponent: RelationPickerGroupComponent;


    beforeEach(() => {

        document = { resource : { id: 'id1', identifier: 'ob1', type: 'object', relations : {} } };

        relationPickerGroupComponent = new RelationPickerGroupComponent();
        relationPickerGroupComponent.document = document;
        relationPickerGroupComponent.relationDefinition = { name: 'Above', inverse: 'Below' };
    });


    it('should create an empty relation array if no relation array exists and a new relation is created', () => {

        relationPickerGroupComponent.ngOnChanges();
        relationPickerGroupComponent.createRelation();

        expect(document.resource.relations['Above'].length).toBe(1);
        expect(document.resource.relations['Above'][0]).toBe('');
    });
});

