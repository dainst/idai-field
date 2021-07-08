import * as tf from '@tensorflow/tfjs';

export const predict = async (raw: tf.Tensor3D, model: tf.LayersModel): Promise<number[]> => {
  
    const resized = tf.image.resizeBilinear(raw, [512,512]);
    const tensor = resized.expandDims(0);
    const prediction = (model.predict(tensor) as tf.Tensor).reshape([-1]);

    return Array.from(prediction.dataSync());
         
};