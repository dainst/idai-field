'use strict';

import {arrayEquivalent, keysAndValues, isNot, undefinedOrEmpty} from 'tsfun';
import {pureName} from 'idai-components-2';


const fs = require('fs');


const projectName: string = '';

const selection = JSON.parse(fs.readFileSync(projectName === '' ? 'Selection-Default.json' : 'Selection-' + projectName + '.json'));
const hidden = JSON.parse(fs.readFileSync(projectName === '' ? 'Hidden.json' : 'Hidden-' + projectName + '.json'));



keysAndValues(hidden).forEach(([hiddenTypeName, hiddenValues]) => {

    // find in selection
    keysAndValues(selection).forEach(([selectionTypeName, selectionType]) => {

        const selectionTypePureName = pureName(selectionTypeName);
        if (selectionTypePureName === hiddenTypeName) {

            if (isNot(undefinedOrEmpty)(selectionType['hidden'])) {
                console.error('hidden already exists, ', hiddenTypeName)
            } else {
                selectionType['hidden'] = hiddenValues;
            }
        }
    });
});

fs.writeFileSync(projectName === '' ? 'Selection-Default.json' : 'Selection-' + projectName + '.json', JSON.stringify(selection, null, 2));