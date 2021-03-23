import {Dating, OptionalRange} from 'idai-components-2';
import { FeatureRelations } from './feature-relations';
import {FieldResource} from './field-resource';


export interface FeatureResource extends FieldResource {

    relations: FeatureRelations;
    period: OptionalRange<string>|undefined;
    dating: Dating
}


export module FeatureResource {

    export const PERIOD = 'period';
}
