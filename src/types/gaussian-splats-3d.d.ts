declare module '@mkkellogg/gaussian-splats-3d' {
  export enum SceneFormat {
    Ply = 0,
    Splat = 1,
    KSplat = 2,
  }

  export interface ViewerOptions {
    rootElement?: HTMLElement;
    cameraUp?: number[];
    initialCameraPosition?: number[];
    initialCameraLookAt?: number[];
    sharedMemoryForWorkers?: boolean;
    gpuAcceleratedSort?: boolean;
    ignoreDevicePixelRatio?: boolean;
    integerBasedSort?: boolean;
    halfPrecisionCovariancesOnGPU?: boolean;
    sphericalHarmonicsDegree?: number;
    inMemoryCompressionLevel?: number;
    dynamicScene?: boolean;
  }

  export interface SplatSceneOptions {
    format?: SceneFormat;
    splatAlphaRemovalThreshold?: number;
    showLoadingUI?: boolean;
    progressiveLoad?: boolean;
    position?: number[];
    rotation?: number[];
    scale?: number[];
  }

  export class Viewer {
    constructor(options?: ViewerOptions);
    addSplatScene(path: string, options?: SplatSceneOptions): Promise<void>;
    addSplatScenes(scenes: Array<SplatSceneOptions & { path: string }>): Promise<void>;
    start(): void;
    dispose(): void;
  }
}
