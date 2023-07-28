const fs = require('original-fs');
const path = require('path');

const messagesPath = path.join(__dirname, 'messages');

const messageDictionary = fs.readdirSync(messagesPath).reduce((result, fileName) => {
    const languageCode = fileName.split('.')[1];
    const filePath = path.join(messagesPath, fileName);
    result[languageCode] = JSON.parse(fs.readFileSync(filePath));
    return result;
}, {});

const get = (identifier) => messageDictionary[global.getLocale()][identifier];


module.exports = {
    get: get
};
