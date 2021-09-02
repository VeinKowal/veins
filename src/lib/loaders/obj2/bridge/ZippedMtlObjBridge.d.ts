import { ZippedMTLLoader } from '../../ZippedMTLLoader';

export namespace ZippedMtlObjBridge {
  export function link(processResult: object, assetLoader: object): void;
  export function addMaterialsFromMtlLoader(
    materialCreator: ZippedMTLLoader.MaterialCreator,
  ): object;
}
