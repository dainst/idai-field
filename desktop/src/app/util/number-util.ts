export module NumberUtil {

    export function padNumber(value: number) {

        return (isNumber(value)) ? `0${value}`.slice(-2) : '';
    }


    export function isNumber(value: any): boolean {

        return !isNaN(toInteger(value));
    }


    function toInteger(value: any): number {

        return parseInt(`${value}`, 10);
    }
}
