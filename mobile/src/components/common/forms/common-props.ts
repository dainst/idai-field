import { NewResource } from 'idai-field-core';

export interface FieldsBaseProps {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    setFunction: (key: string, value: any) => void;
    resource: NewResource
}