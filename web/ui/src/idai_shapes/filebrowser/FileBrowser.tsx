import React, { ReactElement, useState } from 'react';
import { Form } from 'react-bootstrap';
import { useHistory } from 'react-router-dom';


export default function FileBrowser (): ReactElement {

    const [label, setLabel] = useState<string>('Select file');
    const history = useHistory();

    const changeHandler = (e: React.ChangeEvent<HTMLInputElement>) => {
        const reader = new FileReader();
        setLabel(e.target.files[0]? e.target.files[0].name : 'Select file');
        reader.onload = (e: ProgressEvent<FileReader>) =>
            history.push(`drawfinds/false/${encodeURIComponent(e.target.result as string)}`);

        if (e.target.files && e.target.files[0])
            reader.readAsDataURL(e.target.files[0]);
    
    };

    return (
        <Form>
            <Form.File
                id="custom-file"
                label={ label }
                custom
                accept={ 'image/gif, image/jpeg' }
                onChange={ changeHandler }
                formAction="/upload/image"
            />
        </Form>
    );
}
