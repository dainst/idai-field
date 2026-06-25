import { Component, EventEmitter, Input, Output } from '@angular/core';
import { Document, Field } from 'idai-field-core';


type OrientationOption = {
    value: string;
    label: string;
};

type ParsedOrientation = {
    start: Direction;
    degrees?: number;
    end: Direction;
};

type Direction = 'N'|'S'|'E'|'W';


const ORIENTATION_FIELDS = {
    longAxisOrientation: 'longAxisOrientation',
    orientationNote: 'orientationNote',
    orientationReference: 'orientationReference'
};

const DIRECTION_LABELS: { [direction in Direction]: string } = {
    N: '북',
    S: '남',
    E: '동',
    W: '서'
};

const OPPOSITE_DIRECTION: { [direction in Direction]: Direction } = {
    N: 'S',
    S: 'N',
    E: 'W',
    W: 'E'
};

const KOREAN_DIRECTION_TOKEN_MAP: { [token: string]: Direction } = {
    북: 'N',
    북쪽: 'N',
    남: 'S',
    남쪽: 'S',
    동: 'E',
    동쪽: 'E',
    서: 'W',
    서쪽: 'W'
};

const DIAGONAL_DIRECTION_TOKEN_MAP: { [token: string]: { start: Direction; end: Direction } } = {
    NE: { start: 'N', end: 'E' },
    NW: { start: 'N', end: 'W' },
    SE: { start: 'S', end: 'E' },
    SW: { start: 'S', end: 'W' },
    북동: { start: 'N', end: 'E' },
    북서: { start: 'N', end: 'W' },
    남동: { start: 'S', end: 'E' },
    남서: { start: 'S', end: 'W' }
};


@Component({
    selector: 'korean-fieldwork-orientation-panel',
    templateUrl: './korean-fieldwork-orientation-panel.html',
    standalone: false
})
export class KoreanFieldworkOrientationPanelComponent {

    @Input() document: Document;
    @Input() fieldDefinitions: Array<Field>;

    @Output() onChanged: EventEmitter<void> = new EventEmitter<void>();

    public readonly fields = ORIENTATION_FIELDS;

    public readonly orientationPresets: readonly OrientationOption[] = [
        { value: 'N-E', label: 'N-E' },
        { value: 'N-W', label: 'N-W' },
        { value: 'S-E', label: 'S-E' },
        { value: 'S-W', label: 'S-W' }
    ];

    public shouldShow(): boolean {

        return this.hasField(ORIENTATION_FIELDS.longAxisOrientation);
    }


    public hasField(fieldName: string): boolean {

        return this.fieldDefinitions?.some(field => field.name === fieldName && field.editable) ?? false;
    }


    public getValue(fieldName: string): string {

        const value: unknown = this.document?.resource?.[fieldName];

        return typeof value === 'string' ? value : '';
    }


    public setValue(fieldName: string, value: string) {

        if (!this.document?.resource) return;

        const trimmedValue = value?.trim();
        if (trimmedValue) {
            this.document.resource[fieldName] = value;
        } else {
            delete this.document.resource[fieldName];
        }

        this.onChanged.emit();
    }


    public setLongAxisOrientation(value: string) {

        this.setValue(ORIENTATION_FIELDS.longAxisOrientation, value);
        this.ensureMagneticNorthReference(value);
    }


    public applyOrientationPreset(value: string) {

        this.setLongAxisOrientation(value);
    }


    public isOrientationPresetActive(value: string): boolean {

        const parsedOrientation = this.parseLongAxisOrientation(
            this.getValue(ORIENTATION_FIELDS.longAxisOrientation)
        );

        return parsedOrientation
            ? `${parsedOrientation.start}-${parsedOrientation.end}` === value
            : false;
    }


    public normalizeOrientation() {

        const currentValue = this.getValue(ORIENTATION_FIELDS.longAxisOrientation);
        const normalizedValue = this.normalizeLongAxisOrientation(currentValue);

        if (normalizedValue !== currentValue.trim()) {
            this.setLongAxisOrientation(normalizedValue);
        } else {
            this.ensureMagneticNorthReference(normalizedValue);
        }
    }


    public getOrientationHint(): string {

        const value = this.getValue(ORIENTATION_FIELDS.longAxisOrientation);
        if (!value.trim()) return '자북 기준 예: N-E, N-23°-E, 북에서 동쪽으로 23도';

        return this.describeLongAxisOrientation(value)
            ?? '형식 확인: 자북 기준 N-E, N-23°-E, 북에서 동쪽으로 23도';
    }


    public isOrientationInvalid(): boolean {

        const value = this.getValue(ORIENTATION_FIELDS.longAxisOrientation);

        return value.trim().length > 0 && !this.parseLongAxisOrientation(value);
    }


    public normalizeLongAxisOrientation(value: string): string {

        const parsedOrientation = this.parseLongAxisOrientation(value);

        return parsedOrientation
            ? this.formatLongAxisOrientation(parsedOrientation)
            : value.trim();
    }


    public describeLongAxisOrientation(value: string): string|undefined {

        const parsedOrientation = this.parseLongAxisOrientation(value);
        if (!parsedOrientation) return undefined;

        return `${this.formatLongAxisOrientation(parsedOrientation)} = `
            + `${DIRECTION_LABELS[parsedOrientation.start]}에서 `
            + `${DIRECTION_LABELS[parsedOrientation.end]}쪽으로 `
            + (parsedOrientation.degrees === undefined
                ? '기운 장축'
                : `${parsedOrientation.degrees}°`);
    }


    private parseLongAxisOrientation(value: string): ParsedOrientation|undefined {

        const normalizedValue = value.trim()
            .replace(/[–—－]/g, '-')
            .replace(/\s+/g, ' ');
        if (!normalizedValue) return undefined;

        const diagonalOrientation = this.parseDiagonalLongAxisOrientation(normalizedValue);
        if (diagonalOrientation) return diagonalOrientation;

        const quadrantOrientation = this.parseLongAxisOrientationQuadrant(normalizedValue);
        if (quadrantOrientation) return quadrantOrientation;

        const fromPhraseMatch = normalizedValue.match(
            /^(북|남|동|서)(?:에서)?\s*(북쪽|남쪽|동쪽|서쪽|북|남|동|서)(?:으로)?\s*(\d{1,2})(?:°|도)?$/i
        );
        if (fromPhraseMatch) {
            return this.toParsedOrientation(fromPhraseMatch[1], fromPhraseMatch[3], fromPhraseMatch[2]);
        }

        const bearingMatch = normalizedValue.match(
            /^([NSEW]|북|남|동|서)\s*-?\s*(\d{1,2})(?:°|도)?\s*-?\s*([NSEW]|북|남|동|서)$/i
        );
        if (bearingMatch) {
            return this.toParsedOrientation(bearingMatch[1], bearingMatch[2], bearingMatch[3]);
        }

        return undefined;
    }


    private parseDiagonalLongAxisOrientation(value: string): ParsedOrientation|undefined {

        const match = value.match(/^(NE|NW|SE|SW|북동|북서|남동|남서)(?:\s*-?\s*(\d{1,2})(?:°|도)?)?$/i);
        if (!match) return undefined;

        const direction = DIAGONAL_DIRECTION_TOKEN_MAP[match[1].toUpperCase()]
            ?? DIAGONAL_DIRECTION_TOKEN_MAP[match[1]];
        const degrees = match[2] === undefined ? undefined : Number(match[2]);

        if (!direction) return undefined;
        if (degrees !== undefined && !this.isValidDegrees(degrees)) return undefined;

        return { ...direction, degrees };
    }


    private parseLongAxisOrientationQuadrant(value: string): ParsedOrientation|undefined {

        const fromPhraseMatch = value.match(
            /^(북|남|동|서)(?:에서)?\s*(북쪽|남쪽|동쪽|서쪽|북|남|동|서)(?:으로)?$/i
        );
        const match = fromPhraseMatch
            ? [fromPhraseMatch[0], fromPhraseMatch[1], fromPhraseMatch[2]]
            : value.match(/^([NSEW]|북|남|동|서)\s*-\s*([NSEW]|북|남|동|서)$/i);
        if (!match) return undefined;

        const start = this.normalizeDirectionToken(match[1]);
        const end = this.normalizeDirectionToken(match[2]);

        if (!start || !end || start === end || OPPOSITE_DIRECTION[start] === end) return undefined;

        return { start, end };
    }


    private toParsedOrientation(startValue: string, degreesValue: string, endValue: string): ParsedOrientation|undefined {

        const start = this.normalizeDirectionToken(startValue);
        const end = this.normalizeDirectionToken(endValue);
        const degrees = Number(degreesValue);

        if (
            !start
            || !end
            || !this.isValidDegrees(degrees)
            || start === end
            || OPPOSITE_DIRECTION[start] === end
        ) {
            return undefined;
        }

        return { start, degrees, end };
    }


    private normalizeDirectionToken(value: string): Direction|undefined {

        const normalizedValue = value.trim().toUpperCase();

        return /^[NSEW]$/.test(normalizedValue)
            ? normalizedValue as Direction
            : KOREAN_DIRECTION_TOKEN_MAP[value.trim()];
    }


    private isValidDegrees(degrees: number): boolean {

        return Number.isInteger(degrees) && degrees >= 0 && degrees <= 90;
    }


    private formatLongAxisOrientation(orientation: ParsedOrientation): string {

        return orientation.degrees === undefined
            ? `${orientation.start}-${orientation.end}`
            : `${orientation.start}-${orientation.degrees}°-${orientation.end}`;
    }


    private ensureMagneticNorthReference(value: string) {

        if (
            this.hasField(ORIENTATION_FIELDS.orientationReference)
            && value.trim().length > 0
            && this.parseLongAxisOrientation(value)
            && !this.getValue(ORIENTATION_FIELDS.orientationReference).trim()
        ) {
            this.setValue(ORIENTATION_FIELDS.orientationReference, '자북');
        }
    }
}
