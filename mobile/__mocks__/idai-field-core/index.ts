const mocks = {
    ...jest.requireActual('idai-field-core'),
    Labels: jest.fn().mockImplementation(() => {
        const valueList = {
            id: 'valuelist',
            values: {
                eins: { label: { de: 'eins', en: 'one' } },
                zwei: { label: { de: 'zwei', en: 'two' } },
                drei: { label: { de: 'drei', en: 'three' } },
                vier: { label: { de: 'vier', en: 'four' } },
                fünf: { label: { de: 'fünf', en: 'five' } },
            }
        };
        const fieldName = 'period';

        return {
            orderKeysByLabels: () => Object.keys(valueList.values).map(key => {
                const label = valueList.values[key].label;
                if(label && label['en']){
                    return label['en'];
                } else return '';
            }),
            get: () => fieldName,
            getLabelAndDescription: () => ({ description: 'description' })
        };
    })
};

module.exports = mocks;