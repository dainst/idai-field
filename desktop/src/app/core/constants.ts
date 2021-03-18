import {Document, Resource} from 'idai-components-2';
import {on} from 'tsfun';

// Constants

export const RESOURCE_DOT_IDENTIFIER = 'resource.identifier';
export const RESOURCE_DOT_ID = 'resource.id';

export const RESOURCE_ID_PATH = [Document.RESOURCE, Resource.ID];
export const ON_RESOURCE_ID = on(RESOURCE_ID_PATH);


// Indexing

export const ISRECORDEDIN_CONTAIN = 'isRecordedIn:contain';


// Types

export type Name = string;
export type ResourceId = string;
export type RevisionId = string;
