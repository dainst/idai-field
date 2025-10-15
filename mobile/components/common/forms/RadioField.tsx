import React, { useCallback, useContext, useEffect, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import LabelsContext from '@/contexts/labels/labels-context';
import { colors } from '@/utils/colors';
import ChoiceModal, { ItemsObject } from './ChoiceModal/ChoiceModal';
import { FieldBaseProps } from './common-props';
import { FORM_FONT_SIZE, NO_VAL } from './constants';
import FieldLabel from './FieldLabel';

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
        closeModal();
    };
    

    const closeModal = () => setIsModalOpen(false);

    const renderSelectedValue = () => {

        const selectedKey = Object.keys(valuesObject).filter(key => valuesObject[key].selected);
        if(selectedKey && selectedKey.length){
            return (
                <View style={ styles.selectedValues }>
                    <Text style={ styles.selectedValuesText }>{valuesObject[selectedKey[0]].label}</Text>
                </View>
            );
        } else return null;
    };

    return (
        <View style={ styles.container }>
            {isModalOpen && <ChoiceModal
                resetValues={ closeModal }
                choices={ valuesObject }
                field={ field }
                setValue={ selectValue }
                type="radio"
            />}
            <TouchableOpacity onPress={ () => setIsModalOpen(true) } testID="fieldBtn">
                <FieldLabel field={ field } />
            </TouchableOpacity>
            {renderSelectedValue()}
        </View>
    );
};


const styles = StyleSheet.create({
    container: {
        margin: 5,
        padding: 5,
        width: '100%'
    },
    selectedValues: {
        marginTop: 3,
        borderColor: colors.lightgray,
        borderWidth: 1,
        padding: 5
    },
    selectedValuesText: {
        fontSize: FORM_FONT_SIZE
    }
});


export default RadioField;