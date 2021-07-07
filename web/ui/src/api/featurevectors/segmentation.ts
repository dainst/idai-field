import * as tf from '@tensorflow/tfjs';

export const segmentImage = async (image: tf.Tensor3D, model: tf.LayersModel): Promise<tf.Tensor3D> => {

    const resized = tf.image.resizeBilinear(image, [512,512]);
    const tensor = resized.expandDims(0);
    const segmented = model.predict(tensor) as tf.Tensor;
    return postProcessSegmentedImage(segmented);
};

const postProcessSegmentedImage = (image: tf.Tensor): tf.Tensor3D => {

    const classes = tf.argMax(image,3);
    const scaled = classes.mul(tf.scalar(255)).reshape([512,512]);
    return tf.stack([scaled,scaled,scaled],2) as tf.Tensor3D;
};