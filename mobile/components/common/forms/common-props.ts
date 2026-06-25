import { Dating, Field, Measurement, OptionalRange } from 'idai-field-core';

export interface FieldBaseProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  setFunction: (key: string, value: any) => void;
  field: Field;
  currentValue?:
    | string
    | number
    | string[]
    | boolean
    | Measurement[]
    | OptionalRange<string>
    | Dating[];
}
