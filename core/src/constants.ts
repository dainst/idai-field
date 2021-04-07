import { on } from 'tsfun';
import { Document } from './model/document';
import { Resource } from './model/resource';

// Constants

export const RESOURCE_DOT_IDENTIFIER: [string,string] = ['resource','identifier'];
export const RESOURCE_DOT_ID: [string,string] = ['resource','id'];

export const ON_RESOURCE_ID = on([Document.RESOURCE, Resource.ID]);


// Indexing

export const ISRECORDEDIN_CONTAIN = 'isRecordedIn:contain';


// Types

export type ResourceId = string;
export type RevisionId = string;
