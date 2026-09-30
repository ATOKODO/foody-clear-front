import { BarcodeScannerService } from './barcode-scanner-service';

describe('BarcodeScannerService', () => {
  let scanner: BarcodeScannerService;
  let stream: MediaStream | null;
  beforeEach(() => { scanner = new BarcodeScannerService(); stream = null; });
  afterEach(() => { scanner.stop(); stream?.getTracks().forEach((track) => track.stop()); });

  it('decodes an actual EAN-13 camera frame and releases the camera after a match', async () => {
    const canvas = document.createElement('canvas');
    canvas.width = 800; canvas.height = 300;
    const context = canvas.getContext('2d')!;
    context.fillStyle = 'white'; context.fillRect(0, 0, 800, 300);
    context.fillStyle = 'black';
    const bits = encodeEan13('3017624010701');
    [...bits].forEach((bit, index) => { if (bit === '1') context.fillRect(60 + index * 6, 50, 6, 200); });
    stream = canvas.captureStream(10);
    const tracks = stream.getTracks();
    const camera = spyOn(navigator.mediaDevices, 'getUserMedia').and.resolveTo(stream);
    const video = document.createElement('video'); video.muted = true; video.playsInline = true;
    let onDetected!: (barcode: string) => void;
    const detected = new Promise<string>((resolve) => { onDetected = resolve; });
    await scanner.start(video, onDetected);
    expect(await detected).toBe('3017624010701');
    expect(camera.calls.mostRecent().args[0]).toEqual(jasmine.objectContaining({ audio: false, video: jasmine.objectContaining({ facingMode: { ideal: 'environment' } }) }));
    expect(tracks.every((track) => track.readyState === 'ended')).toBeTrue();
    expect(video.srcObject).toBeNull();
  });

  it('releases a late camera permission result after the view has stopped scanning', async () => {
    stream = document.createElement('canvas').captureStream(10);
    const tracks = stream.getTracks();
    let permit!: (stream: MediaStream) => void;
    const permission = new Promise<MediaStream>((resolve) => { permit = resolve; });
    let requested!: () => void;
    const cameraRequested = new Promise<void>((resolve) => { requested = resolve; });
    spyOn(navigator.mediaDevices, 'getUserMedia').and.callFake(() => { requested(); return permission; });
    const detected = jasmine.createSpy('detected');
    const starting = scanner.start(document.createElement('video'), detected);
    await cameraRequested;
    scanner.stop();
    permit(stream);
    await starting;
    expect(tracks.every((track) => track.readyState === 'ended')).toBeTrue();
    expect(detected).not.toHaveBeenCalled();
  });

  it('propagates denied camera permission for the manual fallback', async () => {
    spyOn(navigator.mediaDevices, 'getUserMedia').and.rejectWith(new DOMException('Denied', 'NotAllowedError'));
    await expectAsync(scanner.start(document.createElement('video'), () => undefined)).toBeRejectedWithError('Denied');
  });
});

// Independent EAN-13 test fixture: guard bars, first-digit parity, and six right digits.
function encodeEan13(code: string): string {
  const left = ['0001101', '0011001', '0010011', '0111101', '0100011', '0110001', '0101111', '0111011', '0110111', '0001011'];
  const alternate = ['0100111', '0110011', '0011011', '0100001', '0011101', '0111001', '0000101', '0010001', '0001001', '0010111'];
  const parity = ['LLLLLL', 'LLGLGG', 'LLGGLG', 'LLGGGL', 'LGLLGG', 'LGGLLG', 'LGGGLL', 'LGLGLG', 'LGLGGL', 'LGGLGL'][Number(code[0])];
  const first = [...code.slice(1, 7)].map((digit, index) => (parity[index] === 'L' ? left : alternate)[Number(digit)]).join('');
  const last = [...code.slice(7)].map((digit) => [...left[Number(digit)]].map((bit) => bit === '1' ? '0' : '1').join('')).join('');
  return `101${first}01010${last}101`;
}
