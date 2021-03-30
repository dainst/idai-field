export * from './src/constants';
export * from './src/datastore';
export * from './src/index';
export * from './src/model';
export * from './src/tools';
export * from './test';


// Somehow these things did not work automatically
export {Document, toResourceId} from './src/model/document';
export {NewDocument} from './src/model/new-document';
export {NewResource} from './src/model/new-resource';
export {Resource} from './src/model/resource';
export {Action} from './src/model/action';
export {Relations, relationsEquivalent} from './src/model/relations';
export {Dimension} from './src/model/dimension';
export {Dating} from './src/model/dating';
export {Literature} from './src/model/literature';
export {OptionalRange} from './src/model/optional-range';