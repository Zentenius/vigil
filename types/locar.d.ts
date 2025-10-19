declare module 'locar' {
  export class LocationBased {
    constructor(scene: any, camera: any)
    fakeGps(longitude: number, latitude: number): void
    add(object: any, longitude: number, latitude: number, altitude?: number): void
    startGps(): void
    setElevation(elevation: number): void
  }

  export class DeviceOrientationControls {
    constructor(camera: any)
    connect(): Promise<void>
    disconnect(): void
    update(): void
  }

  export class Webcam {
    constructor(constraints: any, selector?: string)
    on(event: string, callback: (data: any) => void): void
    off(event: string, callback?: (data: any) => void): void
    start(): Promise<void>
    stop?(): void  // Make stop optional since it might not exist
    video?: HTMLVideoElement  // Access to underlying video element
  }
}