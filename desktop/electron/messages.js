const messageDictionary = {
    de: require('./messages/messages.de.json'),
    en: require('./messages/messages.en.json'),
    it: require('./messages/messages.it.json'),
    tr: require('./messages/messages.tr.json'),
    uk: require('./messages/messages.uk.json')
};


const get = (identifier) => messageDictionary[global.getLocale()][identifier];


module.exports = {
    get: get
};
