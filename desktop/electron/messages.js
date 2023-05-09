const electron = require('electron');
const fs = require('original-fs');

const path = electron.app.getAppPath() + '/electron/messages/';

const messageDictionary = fs.readdirSync(path).reduce((result, fileName) => {
    const languageCode = fileName.split('.')[1];
    result[languageCode] = JSON.parse(fs.readFileSync(path + fileName));
    return result;
}, {});

const get = (identifier) => messageDictionary[global.getLocale()][identifier];


module.exports = {
    get: get
};
