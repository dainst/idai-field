import { on } from 'tsfun';
import { Document } from './model/document/document';
import { Resource } from './model/document/resource';

// Constants

export const RESOURCE_DOT_IDENTIFIER: [string,string] = ['resource','identifier'];
export const RESOURCE_DOT_ID: [string,string] = ['resource','id'];

export const ON_RESOURCE_ID = on([Document.RESOURCE, Resource.ID]);


// Types

export type RevisionId = string;
