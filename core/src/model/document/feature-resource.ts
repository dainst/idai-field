import { Dating } from '../input-types/dating';
import { FieldResource } from './field-resource';
import { OptionalRange } from '../input-types/optional-range';


export interface FeatureResource extends FieldResource {

    relations: FeatureResource.Relations;
    period?: OptionalRange<string>;
    dating: Dating // TODO shouldn't that be Array<Dating>?
}


export namespace FeatureResource {

    export const PERIOD = 'period';


    export interface Relations extends FieldResource.Relations {

        isContemporaryWith: string[];
        isAfter: string[];
        isBefore: string[];
    }    
}
