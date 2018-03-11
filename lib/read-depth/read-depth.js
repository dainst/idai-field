var THREE = require( 'three' );


/**
 *
 * Utility function to retrieve the depth value from a RGBA buffer as float.
 * Adapted from https://codepen.io/usefulthink/pen/pPGEjv (Martin Schuhfuss)
 */
module.exports = getDepthInWorldSpace;


function getDepthInWorldSpace(rgbaBuffer, near, far) {

    var unpackedFloat = unpack(rgbaBuffer);
    return toWorldSpace(unpackedFloat, near, far);
}


function toWorldSpace(depth, near, far) {

    return -((near * far) / ((far - near) * depth - far));
}


function unpack(rgbaBuffer) {

    var v4 = new THREE.Vector4().fromArray(rgbaBuffer);

    const unpackDownscale = 255 / 256;
    const unpackFactors = new THREE.Vector4(
        unpackDownscale / (256 * 256 * 256),
        unpackDownscale / (256 * 256),
        unpackDownscale / 256,
        unpackDownscale
    );

    return v4.multiplyScalar(1 / 255).dot(unpackFactors);
}