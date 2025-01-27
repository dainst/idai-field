import { setupZoneTestEnv } from 'jest-preset-angular/setup-env/zone';
      
setupZoneTestEnv();


const customRequire = (moduleName) => {

    // Electron modules cannot be used in unit tests
    if (moduleName.includes('electron')) return undefined;

    // Use PouchDB with node preset when running unit tests
    if (moduleName === 'pouchdb-browser') return require('pouchdb-node');

    return require(moduleName);
};

window.require = customRequire as any;
