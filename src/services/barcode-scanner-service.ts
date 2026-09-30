import { Injectable } from '@angular/core';
import type { IScannerControls } from '@zxing/browser';
import { isProductBarcode } from './open-food-facts-service';

/** One scanner per view; the component owns the camera lifecycle. */
@Injectable()
export class BarcodeScannerService {
  private controls: IScannerControls | null = null;
  private stream: MediaStream | null = null;
  private video: HTMLVideoElement | null = null;
  private session = 0;

  async start(video: HTMLVideoElement, detected: (barcode: string) => void): Promise<void> {
    this.stop();
    const session = this.session;
    if (!globalThis.isSecureContext) throw new Error('La caméra nécessite une connexion HTTPS. Vous pouvez saisir le code-barres ci-dessous.');
    if (!navigator.mediaDevices?.getUserMedia) throw new Error('Ce navigateur ne permet pas l’accès à la caméra. Saisissez le code-barres ci-dessous.');
    // ZXing also works on mobile browsers without the native BarcodeDetector API.
    const [{ BrowserMultiFormatReader }, { BarcodeFormat, DecodeHintType }] = await Promise.all([
      import('@zxing/browser'), import('@zxing/library'),
    ]);
    if (session !== this.session) return;
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: false,
      video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 720 } },
    });
    if (session !== this.session) {
      stream.getTracks().forEach((track) => track.stop());
      return;
    }
    this.stream = stream;
    this.video = video;
    const reader = new BrowserMultiFormatReader(new Map([[DecodeHintType.POSSIBLE_FORMATS, [
      BarcodeFormat.EAN_13, BarcodeFormat.EAN_8, BarcodeFormat.UPC_A,
      BarcodeFormat.UPC_E, BarcodeFormat.ITF, BarcodeFormat.CODE_128,
    ]]]));
    try {
      const controls = await reader.decodeFromStream(stream, video, (result, _error, scan) => {
        if (session !== this.session || !result) return;
        const barcode = result.getText();
        if (!isProductBarcode(barcode)) return;
        scan.stop();
        this.stop();
        detected(barcode);
      });
      if (session !== this.session) controls.stop();
      else this.controls = controls;
    } catch (error) {
      if (session === this.session) this.stop();
      throw error;
    }
  }

  stop(): void {
    this.session += 1;
    this.controls?.stop();
    this.controls = null;
    this.stream?.getTracks().forEach((track) => track.stop());
    this.stream = null;
    if (this.video) {
      this.video.pause();
      this.video.srcObject = null;
      this.video = null;
    }
  }
}
