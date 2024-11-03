import React from 'react';
import { StyleSheet } from 'react-native';
import Button from '../../Button';
import Row from '../../Row';

interface ButtonsRowProps {
    onCancel: () => void;
    onSubmit: () => void;
}

const ButtonsRow: React.FC<ButtonsRowProps> = ({ onSubmit, onCancel }) => {
    return (
        <Row style={ styles.container }>
            <Button
                variant="primary"
                title="Ok" onPress={ onSubmit }
                style={ styles.button } testID="datingSubmitBtn" />
            <Button
                variant="lightgray"
                title="Cancel"
                onPress={ onCancel }
                style={ styles.button } testID="datingCancelBtn" />
        </Row>
    );
};

const styles = StyleSheet.create({
    container: {
        marginLeft: 'auto'
    },
    button: {
        margin: 3,
        width: '15%'
    }
});

export default ButtonsRow;