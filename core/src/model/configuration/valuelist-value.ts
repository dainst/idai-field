import { I18N } from '../../tools';
import { SemanticReference } from './semantic-reference';


export interface ValuelistValue extends I18N.Labeled, I18N.Described {

    references?: string[];
    semanticReferences?: Array<SemanticReference>;
}
