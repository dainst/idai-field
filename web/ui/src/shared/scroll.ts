import { useState } from 'react';


const DEFAULT_CHUNK_SIZE = 50;


type GetChunk = (offset: number) => void;
type OnScroll = (e: React.UIEvent<Element, UIEvent>) => void;
type Reset = () => void;

export function useGetChunkOnScroll(getChunk: GetChunk, size = DEFAULT_CHUNK_SIZE)
        : { onScroll: OnScroll, resetScrollOffset: Reset } {

    const [offset, setOffset] = useState<number>(0);
    const [loading, setLoading] = useState<boolean>(false);

    const onScroll = async (e: React.UIEvent<Element, UIEvent>) => {

        if (loading) return;

        const el = e.currentTarget;
        if (Math.ceil(el.scrollTop + el.clientHeight) >= el.scrollHeight) {
            setLoading(true);
            const newOffset = offset + size;
            setOffset(newOffset);
            await getChunk(newOffset);
            setTimeout(() => setLoading(false), 200);
        }
    };

    const resetScrollOffset = () => setOffset(0);

    return { onScroll, resetScrollOffset };
}
