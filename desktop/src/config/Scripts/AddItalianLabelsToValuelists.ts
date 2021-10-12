/*const fs = require('fs');

const valuelists = JSON.parse(fs.readFileSync('src/config/Library/Valuelists.json'));
const italianValuelists = JSON.parse(fs.readFileSync('src/config/Library/Valuelists.it.json'));

Object.keys(italianValuelists).forEach(valuelistName => {
    Object.keys(italianValuelists[valuelistName].values).forEach(valueName => {
        const value = italianValuelists[valuelistName].values[valueName];

        if (value.labels && value.labels['it']) {
            if (valuelists[valuelistName].values[valueName]) {
                valuelists[valuelistName].values[valueName].labels['it'] = value.labels['it'];
            } else {
                console.warn('Valuelist ' + valuelistName + ' / Value ' + valueName + ' not found!');
            }
        }
    });
});

fs.writeFileSync('src/config/Library/Valuelists_new.json', JSON.stringify(valuelists, null, 2));

*/