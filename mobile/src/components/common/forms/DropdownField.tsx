import { Picker } from '@react-native-picker/picker';
import { ItemValue } from '@react-native-picker/picker/typings/Picker';
import React, { useContext, useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import LabelsContext from '../../../contexts/labels/labels-context';
import { colors } from '../../../utils/colors';
import { FieldBaseProps } from './common-props';
import FieldLabel from './FieldLabel';

const DropdownField: React.FC<FieldBaseProps> = ({ setFunction, field, currentValue }) => {
    
    const [selectedValue, setSelectedValue] = useState<string>(currentValue as string);
    const { labels } = useContext(LabelsContext);

    useEffect(() =>
        setSelectedValue(currentValue && typeof currentValue === 'string' ? currentValue : '')
    ,[currentValue]);


    const getValues = () => (field.valuelist && labels) ? labels.orderKeysByLabels(field.valuelist) : [];

    const onValueChangeHandler = (itemValue: ItemValue) => {

        setSelectedValue(itemValue as string);
        setFunction(field.name, itemValue);
    };

    return (
        <View style={ styles.container }>
            <FieldLabel field={ field } />
            <Picker
                selectedValue={ selectedValue }
                onValueChange={ onValueChangeHandler }
                style={ styles.picker }
                mode="dropdown"
                itemStyle={ styles.itemStyle }>
                    {getValues().map(value => <Picker.Item key={ value } value={ value } label={ value } />)}
            </Picker>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        margin: 5,
        padding: 5,
        width: '100%',
    },
    picker: {
        marginTop: 3,
        borderColor: colors.lightgray,
        borderWidth: 1,
    },
    itemStyle: {
        fontSize: 16,
    }
});
export default DropdownField;