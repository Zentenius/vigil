// A-Frame and LocAR type definitions for AR components
declare namespace JSX {
  interface IntrinsicElements {
    'a-scene': any;
    'a-camera': any;
    'a-entity': any;
    'a-box': any;
    'a-sphere': any;
    'a-cylinder': any;
    'a-plane': any;
    'a-text': any;
    'a-light': any;
    'a-sky': any;
    'a-videosphere': any;
    'a-assets': any;
    'a-asset-item': any;
    'a-animation': any;
    'a-cursor': any;
    'a-image': any;
    'a-video': any;
    'a-sound': any;
    'a-mixin': any;
    // LocAR specific elements
    'locar-camera': any;
    'locar-webcam': any;
    'locar-entity-place': any;
    [elemName: string]: any; // Catch-all for any custom tag
  }
}