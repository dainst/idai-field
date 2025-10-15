import React, { useCallback, useContext, useEffect, useState } from 'react';
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import LabelsContext from '@/contexts/labels/labels-context';
import { colors } from '@/utils/colors';
import ChoiceModal, { ItemsObject } from './ChoiceModal/ChoiceModal';
import { FieldBaseProps } from './common-props';
import { FORM_FONT_SIZE } from './constants';
import FieldLabel from './FieldLabel';


const CheckboxField: React.FC<FieldBaseProps> = ({ setFunction, field, currentValue }) => {

    const { labels } = useContext(LabelsContext);
    const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
    const [valuesObject, setValuesObject] = useState<ItemsObject>({});

    const getValues = useCallback(
        () => field.valuelist && labels ? labels.orderKeysByLabels(field.valuelist) : [],[field, labels]);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const initValuesObject = useCallback((values: any) => {

        const itemData: ItemsObject = {};
        getValues().forEach(value => {
            if(values && Array.isArray(values) && values.includes(value))
                itemData[value] = { selected: true, label: value };
            else itemData[value] = { selected: false, label: value };
        });
        setValuesObject(itemData);
    },[getValues]);
    
    useEffect(() => initValuesObject(currentValue),[currentValue, initValuesObject]);

    const selectValue = (label: string) => {

        if(!valuesObject || !valuesObject[label]) return;
        
        const labelOject = valuesObject[label];
        labelOject.selected = !labelOject.selected;
        setValuesObject(oldValues => oldValues && { ...oldValues, [labelOject.label]: labelOject });
        
    };

    const submitValues = () =>{
        setFunction(field.name, Object.keys(valuesObject).filter(key => valuesObject[key].selected));
        setIsModalOpen(false);
    };
    
    const resetModal = () => {
        initValuesObject(currentValue);
        setIsModalOpen(false);
    };

    const renderSelectedValues = () => {
        if(!valuesObject) return null;
        else return <FlatList
                        data={ Object.keys(valuesObject)
                            .filter(key => valuesObject[key].selected )
                            .map(key => valuesObject[key].label) }
                        keyExtractor={ item => item }
                        renderItem={ ({ item }) => <Text style={ styles.selectedValue }>{item}</Text> }
                        horizontal={ true }
                        ItemSeparatorComponent={ () => <Text style={ styles.selectedValue }>,</Text> }
                        showsHorizontalScrollIndicator={ false }
                        ListEmptyComponent={ <Text style={ styles.selectedValue }> </Text> } />;
    };
    
    return (
        <View style={ styles.container }>
            {isModalOpen && <ChoiceModal
                resetValues={ resetModal }
                choices={ valuesObject }
                field={ field }
                setValue={ selectValue }
                submitValue={ submitValues }
                type="checkbox"
            />}
            <TouchableOpacity onPress={ () => setIsModalOpen(true) } testID="fieldBtn">
                <FieldLabel field={ field } />
            </TouchableOpacity>
            <View style={ styles.selectedValuesContainer }>
                {renderSelectedValues()}
            </View>
        </View>);
};


const styles = StyleSheet.create({
    container: {
        margin: 5,
        padding: 5,
        width: '100%'
    },
    selectedValuesContainer: {
        marginTop: 3,
        borderColor: colors.lightgray,
        borderWidth: 1,
    },
    selectedValue: {
        margin: 5,
        fontSize: FORM_FONT_SIZE
    }
});


export default CheckboxField;