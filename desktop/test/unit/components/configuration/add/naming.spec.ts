import { Naming } from '../../../../../src/app/components/configuration/add/naming';


describe('naming', () => {

    it('generate field/group names', () => {
      
        expect(Naming.getFieldOrGroupName('fieldName', 'project')).toEqual('project:fieldName');
        expect(Naming.getFieldOrGroupName('field-name', 'project')).toEqual('project:fieldName');
        expect(Naming.getFieldOrGroupName('field name', 'project')).toEqual('project:fieldName');
        expect(Naming.getFieldOrGroupName('Field_Name', 'project')).toEqual('project:fieldName');
        expect(Naming.getFieldOrGroupName('fieldName!\"§$%&/()=', 'project')).toEqual('project:fieldName');
    });


    it('generate category names', () => {
      
        expect(Naming.getCategoryName('CategoryName', 'project')).toEqual('Project:CategoryName');
        expect(Naming.getCategoryName('category-name', 'project')).toEqual('Project:CategoryName');
        expect(Naming.getCategoryName('category name', 'project')).toEqual('Project:CategoryName');
        expect(Naming.getCategoryName('Category_Name', 'project')).toEqual('Project:CategoryName');
        expect(Naming.getCategoryName('categoryName!\"§$%&/()=', 'project')).toEqual('Project:CategoryName');
    });
});
