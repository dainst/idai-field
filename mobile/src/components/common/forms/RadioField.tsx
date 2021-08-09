import React, { useCallback, useContext, useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import LabelsContext from '../../../contexts/labels/labels-context';
import ChoiceModal, { ItemsObject } from './ChoiceModal';
import { FieldBaseProps } from './common-props';
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
        return itemData;
    },[getValues]);

    useEffect(() => {

        
        const itemData = initValuesObject();
        if(currentValue && typeof currentValue === 'string' && itemData[currentValue])
            itemData[currentValue].selected = true;
        setValuesObject(itemData);
    },[currentValue, initValuesObject]);


    const selectValue = (label: string) => {
        const itemData = initValuesObject();
        itemData[label].selected = true;
        setValuesObject(itemData);
        setFunction(field.name,label);
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
            <FieldLabel field={ field } openModal={ () => setIsModalOpen(true) } />
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