import { CSBox, Transformation } from '../types';


export const getDocumentToWorldTransform = (documentCS: CSBox, worldCS: CSBox,
    preserveAspectRatio?: string ): Transformation => {
    // based on https://svgwg.org/svg2-draft/coords.html#ComputingAViewportsTransform
    

    const [align, meetOrSlice] = (preserveAspectRatio ? preserveAspectRatio : 'xMidYMid meet').split(' ');

  
    let scaleX = worldCS.width / documentCS.width;
  
    let scaleY = worldCS.height / documentCS.height;
  
    let translateX = worldCS.minX - documentCS.minX * scaleX;
    let translateY = worldCS.minY - documentCS.minY * scaleY;
  
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
            translateX += (worldCS.width - documentCS.width * scaleX) / 2;
        }
  
        // If align contains 'xMax', add (e-width - vb-width * scale-x) to translate-x.
        if (align.includes('xMax')) {
            translateX += worldCS.width - documentCS.width * scaleX;
        }
  
        // If align contains 'yMid', add (e-height - vb-height * scale-y) / 2 to translate-y.
        if (align.includes('YMid')) {
            translateY += (worldCS.height - documentCS.height * scaleY) / 2;
        }
  
      // If align contains 'yMax', add (e-height - vb-height * scale-y) to translate-y.
        if (align.includes('YMax')) {
            translateY += worldCS.height - documentCS.height * scaleY;
        }
      
    }

    // translate(translate-x, translate-y) scale(scale-x, scale-y).
    return { translateX, translateY, scaleX, scaleY };
};