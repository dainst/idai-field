import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';

export function useSearchParams(): URLSearchParams {

    const location = useLocation();

    const [searchParams, setSearchParams] = useState<URLSearchParams>(new URLSearchParams(location.search));

    useEffect(() => {

        const newSearchParams: URLSearchParams = new URLSearchParams(location.search);
        if (searchParams.toString() !== newSearchParams.toString()) {
            setSearchParams(newSearchParams);
        }
    // eslint-disable-next-line
    }, [location.search]);

    return searchParams;
}
