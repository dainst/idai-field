'use strict';

import { forEach } from 'tsfun';

const fs = require('fs');


const projectName: string = 'Pergamon';

const custom = JSON.parse(fs.readFileSync('Fields-' + projectName + '.json'));
const selection = JSON.parse(fs.readFileSync('Selection-' + projectName + '.json'));




forEach(selection, (selType, selTypeName) => {
    forEach(custom, (cusType, cusTypeName) => {

        if (selTypeName === cusTypeName) {
            selType['fields'] = cusType['fields'];
            selType['commons'] = cusType['commons'];
            selType['parent'] = cusType['parent'];
            selType['color'] = cusType['color'];

            delete custom[selTypeName];
        }
    })
});



fs.writeFileSync('Config-' + projectName + '.json', JSON.stringify(selection, null, 2));
fs.writeFileSync('Fields-' + projectName + '.compare.json', JSON.stringify(custom, null, 2));
