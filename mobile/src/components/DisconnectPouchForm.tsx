import { Box, Button, Divider, Text, VStack } from 'native-base';
import React from 'react';

interface DisconnectPouchFormProps {
    project: string;
    onDisconnect: () => void;
}

const DisconnectPouchForm: React.FC<DisconnectPouchFormProps> = ({ project, onDisconnect }) => {
    return (
        <Box border={ 1 }>
            <VStack space={ 4 } divider={ <Divider /> }></VStack>
            <Text>Disconnect {project}</Text>
            <Button danger onPress={ onDisconnect }>
                <Text>Disconnect</Text>
            </Button>
        </Box>
    );
};

export default DisconnectPouchForm;
