import { Naming } from '../../../../../src/app/components/configuration/add/naming';


describe('naming', () => {

    it('generate field names', () => {
      
        expect(Naming.getFieldName('fieldName', 'project')).toEqual('project:fieldName');
        expect(Naming.getFieldName('field-name', 'project')).toEqual('project:fieldName');
        expect(Naming.getFieldName('field name', 'project')).toEqual('project:fieldName');
        expect(Naming.getFieldName('Field_Name', 'project')).toEqual('project:fieldName');
        expect(Naming.getFieldName('fieldName!\"§$%&/()=', 'project')).toEqual('project:fieldName');
    });
});
