interface Coord {
    x: number;
    y: number;
}


export const calcDistance = (x1: number, y1: number, x2: number, y2: number): number => {

    const dx = x1 - x2;
    const dy = y1 - y2;
    return Math.sqrt(Math.pow(dx,2) + Math.pow(dy,2));
};
  

const middle = (p1: number, p2: number) => (p1 + p2) / 2;
 

export const calcCenter = (x1: number, y1: number, x2: number, y2: number): Coord => ({

        x: middle(x1, x2),
        y: middle(y1, y2),
});

