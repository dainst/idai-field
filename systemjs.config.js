(function(global) {

    if(typeof process != 'object') {
        console.log('Running in browser, disabling NodeJS functionality.');
        config.map['fs'] = '@empty';
        config.map['express'] = '@empty';
        config.map['express-pouchdb'] = '@empty';
    } else {
        console.log('Running as electron app, enabling NodeJS functionality.');
        // ensure that pouchdb is loaded using node's require
        // in order to trigger use of leveldb backend
        //config.map['pouchdb'] = '@node/pouchdb';
        // make sure papaparse is loaded using node's require
        // in order to avoid errors
        config.map['papaparse'] = '@node/papaparse';
    }
    System.config(config);

})(this);