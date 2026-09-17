interface NDEFReadingEvent extends Event {
  serialNumber: string;
}

interface NDEFReader extends EventTarget {
  scan(): Promise<void>;
  onreading: ((this: NDEFReader, ev: NDEFReadingEvent) => void) | null;
  onreadingerror: ((this: NDEFReader, ev: Event) => void) | null;
}

interface Window {
  NDEFReader?: {
    new (): NDEFReader;
  };

  onNfcTagFromNative?: (serialNumber: string) => void;

  onNdefTekstFromNative?: (tekst: string) => void;
}
