import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import { Dimension } from 'idai-field-core';
import React, { useState } from 'react';
import { StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';
import { TextInput } from 'react-native-gesture-handler';
import useToast from '../../../hooks/use-toast';
import { colors } from '../../../utils/colors';
import BooleanRadio from '../BooleanRadio';
import Button from '../Button';
import Row from '../Row';
import { ToastType } from '../Toast/ToastProvider';
import { FieldBaseProps } from './common-props';
import FieldLabel from './FieldLabel';

const ICON_SIZE = 24;


type MeasurementType = 'single value' | 'range';
type MeasuredBy = 'maximum expansion' | 'mininum expansion';

const DimensionField: React.FC<FieldBaseProps> = ({ setFunction, field, currentValue }) => {

    const [showAddRow, setShowAddRow] = useState<boolean>(true);
    const [measurementType, setMeasurementType] = useState<MeasurementType | null>('single value');
    const [inputValue, setInputValue] = useState<string>();
    const [inputRangeEndValue, setInputRangeEndValue] = useState<string>();
    const [inputUnit, setInputUnit] = useState<Dimension.InputUnits>('cm');
    const [measurementPosition, setMeasurementPosition] = useState<MeasuredBy | null>(null);
    const [isImprecise, setIsImprecise] = useState<boolean>(false);
    const [measurementComment, setMeasurementComment] = useState<string>();
    const { showToast } = useToast();

    const addDimensionHandler = () => {
        setShowAddRow(false);
    };

    const submitHandler = () => {

        if(inputValue){
            const dimension: Dimension = {
                value: parseFloat(inputValue),
                inputValue: parseFloat(inputValue),
                inputUnit,
                measurementComment,
                isImprecise,
                inputRangeEndValue: inputRangeEndValue ? parseFloat(inputRangeEndValue) : undefined,
                measurementPosition: measurementPosition ? measurementPosition : undefined
            };
            Object.keys(dimension).forEach(key => dimension[key] === undefined && delete dimension[key]);
            Dimension.addNormalizedValues(dimension);
            resetForm();
        } else showToast(ToastType.Error, 'Please enter an input value');
        
    };

    const resetForm = () => {

        setMeasurementType('single value');
        setInputValue(undefined);
        setInputRangeEndValue(undefined);
        setInputUnit('cm');
        setMeasurementPosition(null);
        setIsImprecise(false);
        setMeasurementComment(undefined);
        setShowAddRow(true);
    };


    return (
        <View style={ styles.container }>
            <FieldLabel field={ field } />
            {showAddRow ?
                <Row style={ styles.addDimension }>
                    <Text style={ { paddingRight: 2 } }>Add</Text>
                    <TouchableOpacity onPress={ addDimensionHandler }>
                        <MaterialCommunityIcons name="plus-circle" size={ ICON_SIZE } color={ colors.success } />
                    </TouchableOpacity>
                </Row> :
                <View>
                    <BooleanRadio<MeasurementType>
                        labels={ ['single value', 'range'] }
                        selectedValue={ measurementType }
                        clickHandler={ (value) => setMeasurementType(value) } />
                    <Row style={ { alignItems: 'center' } }>
                        <TextInput
                            placeholder="input value"
                            onChangeText={ setInputValue }
                            value={ inputValue }
                            style={ styles.inputText }
                            keyboardType="numeric" />
                        {measurementType === 'range' && <>
                                <Text style={ { padding: 15 } }>-</Text>
                                <TextInput
                                    placeholder="Range end"
                                    onChangeText={ setInputRangeEndValue }
                                    value={ inputRangeEndValue }
                                    style={ styles.inputText }
                                    keyboardType="numeric" />
                            </>
                        }
                        <Picker
                            style={ styles.picker }
                            selectedValue={ inputUnit }
                            mode="dropdown"
                            onValueChange={ (itemValue) => setInputUnit(itemValue as Dimension.InputUnits) }
                            itemStyle={ styles.pickerItem }
                        >
                            {Dimension.VALID_INPUT_UNITS.map(unit =>
                                <Picker.Item value={ unit } label={ unit } key={ unit } />)}
                        </Picker>
                    </Row>
                    <Row style={ { alignItems: 'center' } }>
                        <Text>As measured by</Text>
                        <BooleanRadio<MeasuredBy>
                            labels={ ['mininum expansion','maximum expansion'] }
                            selectedValue={ measurementPosition }
                            undefinedPossible={ true }
                            clickHandler={ (value) => setMeasurementPosition(value) }
                        />
                    </Row>
                    <Row style={ { alignItems: 'center' } }>
                        <Switch
                            trackColor={ { true: colors.primary, false: colors.lightgray } }
                            thumbColor={ 'white' }
                            value={ isImprecise }
                            onValueChange={ () => setIsImprecise(!isImprecise) }
                            style={ { margin: 5 } }
                        />
                        <Text>Imprecise</Text>
                    </Row>
                    <TextInput
                        placeholder="Comment"
                        onChangeText={ setMeasurementComment }
                        value={ measurementComment }
                        style={ styles.inputText } />
                    <Row style={ styles.buttonGroup }>
                        <Button
                            onPress={ submitHandler }
                            style={ styles.button } variant="primary" title="Submit" />
                        <Button
                            onPress={ () => setShowAddRow(true) }
                            style={ styles.button } variant="lightgray" title="Cancel" />
                    </Row>
                </View>
            }
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        margin: 5,
        padding: 5,
        width: '100%'
    },
    addDimension: {
        marginTop: 3,
        padding: 3,
        borderColor: colors.lightgray,
        borderWidth: 1,
        alignItems: 'center',
        justifyContent: 'flex-end'
    },
    picker: {
        width: 100,
        height: 100,
        marginLeft: 5,
        marginRight: '40%',
    },
    pickerItem: {
        height: 100,
        fontSize: 18
    },
    inputText: {
        height: 40,
        borderWidth: 1,
        borderColor: colors.lightgray,
        marginTop: 10,
        padding: 5
    },
    buttonGroup: {
        margin: 5,
        alignItems: 'center',
        justifyContent: 'flex-end'
    },
    button: {
        margin: 5
    }
});


export default DimensionField;