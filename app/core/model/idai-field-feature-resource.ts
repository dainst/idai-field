import {IdaiFieldResource} from 'idai-components-2/field';
import {IdaiFieldFeatureRelations} from './idai-field-feature-relations';


export interface IdaiFieldFeatureResource extends IdaiFieldResource {

    relations: IdaiFieldFeatureRelations;
}