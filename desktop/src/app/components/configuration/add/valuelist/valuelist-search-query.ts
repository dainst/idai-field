export interface ValuelistSearchQuery {

    queryString: string;
    onlyCustom: boolean;
    onlyInUse: boolean;
}


export module ValuelistSearchQuery {

    export function buildDefaultQuery(): ValuelistSearchQuery {

        return {
            queryString: '',
            onlyCustom: false,
            onlyInUse: false
        };
    }
}
