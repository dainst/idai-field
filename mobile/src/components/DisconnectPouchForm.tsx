import React from 'react';
import { VStack, Box, Divider, Text, Button } from 'native-base';

interface DisconnectPouchFormProps {
    dbName: string;
    disconnectHandler: () => void;
}

const DisconnectPouchForm: React.FC<DisconnectPouchFormProps> = ({ dbName, disconnectHandler }) => {
    return (
        <Box border={ 1 }>
            <VStack space={ 4 } divider={ <Divider /> }></VStack>
            <Text>Disconnect {dbName}</Text>
            <Button danger onPress={ disconnectHandler }>
                <Text>Disconnect</Text>
            </Button>
        </Box>
    );
};

export default DisconnectPouchForm;