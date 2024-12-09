import { FieldResource } from './field-resource';
import { OptionalRange } from '../input-types/optional-range';


export interface FeatureResource extends FieldResource {

    period?: OptionalRange<string>;
}


export namespace FeatureResource {

    export const PERIOD = 'period';
}
