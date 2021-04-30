interface viewBoxToViewPortTransform {
    translateX: number;
    translateY: number;
    scaleX: number;
    scaleY: number;
}

interface Rect {
    y: number;
    x: number;
    width: number;
    height:number;
}


export const getViewPortTransform = (viewBox: string | undefined, preserveAspectRatio: string | undefined,
        viewPort: Rect): viewBoxToViewPortTransform => {
    // based on https://svgwg.org/svg2-draft/coords.html#ComputingAViewportsTransform
    
  
    // Let vb-x, vb-y, vb-width, vb-height be the min-x, min-y, width and height values
    // of the viewBox attribute respectively.
    const [vbX, vbY, vbWidth, vbHeight] = (viewBox ? viewBox : '0 0 100 100').split(' ').map(num => parseFloat(num));
    const [align, meetOrSlice] = (preserveAspectRatio ? preserveAspectRatio : 'xMidYMid meet').split(' ');

  
    // Initialize scale-x to e-width/vb-width.
    let scaleX = viewPort.width / vbWidth;
  
    // Initialize scale-y to e-height/vb-height.
    let scaleY = viewPort.height / vbHeight;
  
    // Initialize translate-x to e-x - (vb-x * scale-x).
    // Initialize translate-y to e-y - (vb-y * scale-y).
    let translateX = viewPort.x - vbX * scaleX;
    let translateY = viewPort.y - vbY * scaleY;
  
    // If align is 'none'
    if (align === 'none' && meetOrSlice === 'none') {
        return { translateX, translateY, scaleX, scaleY };
    } else {
    // If align is not 'none' and meetOrSlice is 'meet', set the larger of scale-x and scale-y to the smaller.
    //Otherwise, if align is not 'none' and meetOrSlice is 'slice', set the smaller of scale-x and scale-y to the larger
  
        if (align !== 'none' && meetOrSlice === 'meet') {
            scaleX = scaleY = Math.min(scaleX, scaleY);
        } else if (align !== 'none' && meetOrSlice === 'slice') {
            scaleX = scaleY = Math.max(scaleX, scaleY);
        }
    
        // If align contains 'xMid', add (e-width - vb-width * scale-x) / 2 to translate-x.
        if (align.includes('xMid')) {
            translateX += (viewPort.width - vbWidth * scaleX) / 2;
        }
  
        // If align contains 'xMax', add (e-width - vb-width * scale-x) to translate-x.
        if (align.includes('xMax')) {
            translateX += viewPort.width - vbWidth * scaleX;
        }
  
        // If align contains 'yMid', add (e-height - vb-height * scale-y) / 2 to translate-y.
        if (align.includes('YMid')) {
            translateY += (viewPort.height - vbHeight * scaleY) / 2;
        }
  
      // If align contains 'yMax', add (e-height - vb-height * scale-y) to translate-y.
        if (align.includes('YMax')) {
            translateY += viewPort.height - vbHeight * scaleY;
        }
      
    }

    // The transform applied to content contained by the element is given by
    // translate(translate-x, translate-y) scale(scale-x, scale-y).
    return { translateX, translateY, scaleX, scaleY };
};