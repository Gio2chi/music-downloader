declare module 'metaflac-js' {
  export default class Metaflac {
    constructor(filePath: string);
    removeTag(tag: string): void;
    setTag(tag: string): void;
    save(): void;
    buildSpecification(spec: { mime: string, width: number, height: number }): any;
    buildPictureBlock(buffer: Buffer, spec: any): any;
    pictures: any[];
    picturesDatas: any[];
    picturesSpecs: any[];
  }
}