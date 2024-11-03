import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import Button from '@/components/common/Button';
import Heading from '@/components/common/Heading';
import TitleBar from '@/components/common/TitleBar';

interface DisconnectPouchFormProps {
    onDisconnect: () => void;
    onClose: () => void;
}

const DisconnectPouchForm: React.FC<DisconnectPouchFormProps> = ({ onDisconnect, onClose }) => {
    return (
        <TitleBar
            title={ <Heading>Connected</Heading> }
            left={ <Button
                title="Cancel"
                variant="transparent"
                icon={ <Ionicons name="close-outline" size={ 16 } /> }
                onPress={ onClose }
            /> }
            right={ <Button variant="danger" onPress={ onDisconnect } title="Disconnect" /> }
        />
    );
};

export default DisconnectPouchForm;
