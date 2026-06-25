const MUNSELL_CANDIDATE_PATTERN =
    /\b(?:GLEY\s*[12]\s*\d\/N|(?:10|7\.5|5|2\.5)(?:YR|Y|R)\s+\d(?:\.\d)?\/\d(?:\.\d)?)\b/g;


export function extractMunsellCandidateOptions(value: unknown): string[] {

    if (typeof value !== 'string') return [];

    const matches = value.toUpperCase().match(MUNSELL_CANDIDATE_PATTERN) ?? [];

    return Array.from(new Set(
        matches.map(match => match.replace(/\s+/g, ' ').trim())
    ));
}


export function getMunsellCandidateSummaryLabel(value: unknown,
                                                maxCandidates: number = 3): string {

    const candidates = extractMunsellCandidateOptions(value).slice(0, maxCandidates);

    return candidates.length > 0
        ? `먼셀 후보 ${candidates.join(', ')}`
        : '';
}
