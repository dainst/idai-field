export const SOURCE_TEST_ID = 'sourceDating';
export const IS_IMPRECISE_ID = 'isImpreciseDating';
export const IS_UNCERTAIN_ID = 'isUncertainDating';

export interface FormBaseProps {
    onCancel: () => void;
    onSubmit: () => void;
    source: string;
    setSource: (text: string) => void;
}