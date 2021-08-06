import React, { useCallback, useContext, useEffect, useState } from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import LabelsContext from '../../../contexts/labels/labels-context';
import ChoiceModal, { ItemData } from './ChoiceModal';
import { FieldBaseProps } from './common-props';
import FieldLabel from './FieldLabel';


const CheckboxField: React.FC<FieldBaseProps> = ({ setFunction, field, currentValue }) => {

    const { labels } = useContext(LabelsContext);
    const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
    const [valuesObject, setValuesObject] = useState<ItemData>({});

    const getValues = useCallback(
        () => field.valuelist && labels ? labels.orderKeysByLabels(field.valuelist) : [],[field, labels]);
    
    useEffect(() => {

        const itemData: ItemData = {};
        getValues().forEach(value => {
            if(currentValue && Array.isArray(currentValue) && currentValue.includes(value))
                itemData[value] = { selected: true, label: value };
            else itemData[value] = { selected: false, label: value };
        });
        setValuesObject(itemData);
    },[currentValue, getValues]);


    const selectValue = (label: string) => {

        if(!valuesObject || !valuesObject[label]) return;
        
        const labelOject = valuesObject[label];
        labelOject.selected = !labelOject.selected;
        setValuesObject(oldValues => oldValues && { ...oldValues, [labelOject.label]: labelOject });
        setFunction(field.name, Object.keys(valuesObject).filter(key => valuesObject[key].selected));
    };

    
    const closeModal = () => setIsModalOpen(false);
    
    return (
        <View style={ styles.container }>
            {isModalOpen && <ChoiceModal
                onClose={ closeModal }
                choices={ valuesObject }
                field={ field }
                setValue={ selectValue }
            />}
            <TouchableOpacity onPress={ () => setIsModalOpen(true) }>
                <FieldLabel field={ field } modalType={ true } />
            </TouchableOpacity>
        </View>);
};


const styles = StyleSheet.create({
    container: {
        margin: 5,
        padding: 5,
        width: '100%'
    },
});


export default CheckboxField;