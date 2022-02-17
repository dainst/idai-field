import { Naming } from '../../../../../src/app/components/configuration/add/naming';


describe('naming', () => {

    it('generate field names', () => {
      
        expect(Naming.getFieldName('fieldName', 'project')).toEqual('project:fieldName');
        expect(Naming.getFieldName('field-name', 'project')).toEqual('project:fieldName');
        expect(Naming.getFieldName('field name', 'project')).toEqual('project:fieldName');
        expect(Naming.getFieldName('Field_Name', 'project')).toEqual('project:fieldName');
        expect(Naming.getFieldName('fieldName!\"§$%&/()=', 'project')).toEqual('project:fieldName');
    });


    it('generate category names', () => {
      
        expect(Naming.getCategoryName('CategoryName', 'project')).toEqual('Project:CategoryName');
        expect(Naming.getCategoryName('category-name', 'project')).toEqual('Project:CategoryName');
        expect(Naming.getCategoryName('category name', 'project')).toEqual('Project:CategoryName');
        expect(Naming.getCategoryName('Category_Name', 'project')).toEqual('Project:CategoryName');
        expect(Naming.getCategoryName('categoryName!\"§$%&/()=', 'project')).toEqual('Project:CategoryName');
    });
});
