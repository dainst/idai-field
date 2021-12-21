import React, { ReactElement, useContext, useEffect, useState } from 'react';
import { Document } from '../../api/document';
import { getSimilar } from '../../api/documents';
import { ResultDocument } from '../../api/result';
import DocumentGrid from '../../shared/documents/DocumentGrid';
import { LoginContext } from '../../shared/login';

export default function SimilarTypes({ type }: { type: Document }): ReactElement {

    const loginData = useContext(LoginContext);

    const [similarTypes, setSimilarTypes] = useState<ResultDocument[]>([]);

    useEffect(() => {

        if (!type) return;

        getSimilar(type.resource.id, loginData.token)
            .then(result => setSimilarTypes(result.documents));
            }, [type, loginData.token]);
        console.log(similarTypes);

    
    return <>
        <DocumentGrid documents={ similarTypes }
            getLinkUrl={ (doc: ResultDocument): string => doc.resource.id } />
    </>;
}
