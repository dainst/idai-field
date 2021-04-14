import { Dating } from './dating';
import { FeatureRelations } from './feature-relations';
import {FieldResource} from './field-resource';
import { OptionalRange } from './optional-range';


export interface FeatureResource extends FieldResource {

    relations: FeatureRelations;
    period?: OptionalRange<string>;
    dating: Dating // TODO shouldn't that be Array<Dating>?
}


export module FeatureResource {

    export const PERIOD = 'period';
}
