import React, { useCallback, useContext, useEffect, useState } from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import LabelsContext from '../../../contexts/labels/labels-context';
import ChoiceModal, { ItemsObject } from './ChoiceModal';
import { FieldBaseProps } from './common-props';
import FieldLabel from './FieldLabel';

export const NO_VAL = '--';

const RadioField: React.FC<FieldBaseProps> = ({ setFunction, field, currentValue }) => {

    const { labels } = useContext(LabelsContext);
    const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
    const [valuesObject, setValuesObject] = useState<ItemsObject>({});

    
    const getValues = useCallback(
        () => field.valuelist && labels ? labels.orderKeysByLabels(field.valuelist) : [],[field, labels]);

    const initValuesObject = useCallback(() => {
        const itemData: ItemsObject = {};
        getValues().forEach(value => itemData[value] = { selected: false, label: value });
        itemData[NO_VAL] = { selected: false, label: NO_VAL };
        return itemData;
    },[getValues]);

    useEffect(() => {

        
        const itemData = initValuesObject();
        if(currentValue && typeof currentValue === 'string' && itemData[currentValue])
            itemData[currentValue].selected = true;
        else itemData[NO_VAL] = { selected: true, label: NO_VAL };
        setValuesObject(itemData);
    },[currentValue, initValuesObject]);


    const selectValue = (label: string) => {
        const itemData = initValuesObject();
        itemData[label].selected = true;
        setValuesObject(itemData);
        if(label !== NO_VAL) setFunction(field.name,label);
    };
    

    const closeModal = () => setIsModalOpen(false);

    return (
        <View style={ styles.container }>
            {isModalOpen && <ChoiceModal
                onClose={ closeModal }
                choices={ valuesObject }
                field={ field }
                setValue={ selectValue }
                type="radio"
            />}
            <TouchableOpacity onPress={ () => setIsModalOpen(true) } testID="fieldBtn">
                <FieldLabel field={ field } />
            </TouchableOpacity>
        </View>
    );
};


const styles = StyleSheet.create({
    container: {
        margin: 5,
        padding: 5,
        width: '100%'
    }
});


export default RadioField;