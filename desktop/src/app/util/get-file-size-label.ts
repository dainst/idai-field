export function getFileSizeLabel(byteCount: number, transform: (value: any) => string|null) {

    byteCount = byteCount * 0.00000095367;
    let unitTypeOriginal = 'MB';

    if (byteCount > 1000) {
        byteCount = byteCount * 0.00097656;
        unitTypeOriginal = 'GB';
    }

    return `${transform(byteCount.toFixed(2))} ${unitTypeOriginal}`;
}
