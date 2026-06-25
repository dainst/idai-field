declare module 'jpeg-js' {
  export interface RawImageData<T extends Uint8Array = Uint8Array> {
    data: T;
    height: number;
    width: number;
  }

  export interface DecodeOptions {
    maxMemoryUsageInMB?: number;
    tolerantDecoding?: boolean;
    useTArray?: boolean;
  }

  export interface EncodeOptions {
    colorTransform?: boolean;
    formatAsRGBA?: boolean;
    quality?: number;
  }

  export function decode(
    data: Uint8Array,
    options?: DecodeOptions
  ): RawImageData<Uint8Array>;

  export function encode(
    imageData: RawImageData<Uint8Array>,
    quality?: number | EncodeOptions
  ): { data: Uint8Array };

  const jpeg: {
    decode: typeof decode;
    encode: typeof encode;
  };

  export default jpeg;
}
