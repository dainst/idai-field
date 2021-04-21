import { Box, Button, Text } from 'native-base';
import React from 'react';

interface DisconnectPouchFormProps {
    project: string;
    onDisconnect: () => void;
}

const DisconnectPouchForm: React.FC<DisconnectPouchFormProps> = ({ project, onDisconnect }) => {
    return (
        <Box>
            <Button colorScheme="red" onPress={ onDisconnect }>
                <Text color="white">Disconnect</Text>
            </Button>
        </Box>
    );
};

export default DisconnectPouchForm;
