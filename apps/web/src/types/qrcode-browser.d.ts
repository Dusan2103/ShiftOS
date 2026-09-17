declare module 'qrcode/lib/browser' {
  interface QrOpcije {
    width?: number;
    margin?: number;
  }

  export function toCanvas(
    canvas: HTMLCanvasElement,
    text: string,
    options?: QrOpcije,
  ): Promise<void>;

  export function toDataURL(text: string, options?: QrOpcije): Promise<string>;
}
