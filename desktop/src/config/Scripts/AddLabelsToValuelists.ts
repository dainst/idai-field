//const fs = require('fs');

//const valuelists = JSON.parse(fs.readFileSync('src/config/Library/Valuelists.json'));

//Object.keys(valuelists).forEach(valuelistName => {
    /*const description = valuelists[valuelistName].description;
    if (description) {
        if (typeof(description) === 'string') valuelists[valuelistName].description = { de: description };
        Object.keys(description).forEach(key => {
            if (description[key].length === 0) delete description[key];
        });
    }*/

   /*Object.keys(valuelists[valuelistName].values).forEach(valueName => {
       const value = valuelists[valuelistName].values[valueName];

       if (value.labels) {
            if (valuelistName.toLowerCase().includes('-selinunt')
                    || valuelistName.toLowerCase().includes('-abbircella')) {
                  if (!value.labels["de"]) value.labels["de"] = valueName;
             }
       } else if (valuelistName.toLowerCase().includes('-Uruk')
                || valuelistName.toLowerCase().includes('-sudanheritage')) {
            value.labels = {
                en: valueName
            }
       } else if (valuelistName.toLowerCase().includes('-campidoglio')) {
            value.labels = {};
            const labels: string[] = valueName.split(' / ');
            if (labels.length > 0) value.labels["en"] = labels[0];
            if (labels.length > 1) value.labels["it"] = labels[1];
            if (labels.length > 2) value.labels["de"] = labels[2];
       } else {
             value.labels = {
                de: valueName
             }
       }
   });*/

 /*   Object.keys(valuelists[valuelistName].values).forEach(valueName => {
        const value = valuelists[valuelistName].values[valueName];
        if (value.labels && value.labels["it"]) {
            value.labels["it"] =
                value.labels["it"].charAt(0).toUpperCase() + value.labels["it"].slice(1);
        }
    });
});

fs.writeFileSync('src/config/Library/Valuelists_new.json', JSON.stringify(valuelists, null, 2));
*/
