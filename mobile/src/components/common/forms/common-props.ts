import { NewResource } from 'idai-field-core';

export interface FormBaseProps {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    setFunction: (key: string, value: any) => void;
    resource: NewResource;
}

export interface FieldsBaseProps extends FormBaseProps{
    name: string;
}