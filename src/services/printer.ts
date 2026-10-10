// ESC/POS Commands & Thermal Printing Service

export interface PrinterDevice {
  id: string;
  name: string;
  type: 'bluetooth' | 'usb' | 'system';
  paperWidth: '58mm' | '80mm';
  connected: boolean;
}

class PrinterService {
  private activeDevice: any = null;
  private activeCharacteristic: any = null;
  private paperWidth: '58mm' | '80mm' = '80mm';

  setPaperWidth(width: '58mm' | '80mm') {
    this.paperWidth = width;
  }

  getPaperWidth(): '58mm' | '80mm' {
    return this.paperWidth;
  }

  isWebBluetoothSupported(): boolean {
    return typeof navigator !== 'undefined' && 'bluetooth' in navigator;
  }

  isWebUsbSupported(): boolean {
    return typeof navigator !== 'undefined' && 'usb' in navigator;
  }

  async connectBluetooth(): Promise<{ success: boolean; name: string; error?: string }> {
    if (!this.isWebBluetoothSupported()) {
      return {
        success: false,
        name: '',
        error: 'Web Bluetooth is not supported in this browser or iframe environment. Use System Print or Chrome on desktop/Android with Bluetooth enabled.',
      };
    }

    try {
      const device = await (navigator as any).bluetooth.requestDevice({
        filters: [{ services: ['000018f0-0000-1000-8000-00805f9b34fb'] }],
        optionalServices: [
          '000018f0-0000-1000-8000-00805f9b34fb',
          'e7810a71-73ae-499d-8c15-faa9aef0c3f2',
          0xffe0,
        ],
      });

      const server = await device.gatt.connect();
      this.activeDevice = device;

      // Find writable characteristic
      const services = await server.getPrimaryServices();
      for (const service of services) {
        const characteristics = await service.getCharacteristics();
        for (const char of characteristics) {
          if (char.properties.write || char.properties.writeWithoutResponse) {
            this.activeCharacteristic = char;
            break;
          }
        }
        if (this.activeCharacteristic) break;
      }

      return {
        success: true,
        name: device.name || 'Bluetooth Thermal Printer',
      };
    } catch (err: any) {
      console.warn('Bluetooth connection cancelled or failed:', err);
      return {
        success: false,
        name: '',
        error: err.message || 'Failed to connect via Bluetooth',
      };
    }
  }

  // Generate standard ESC/POS bytes for 58mm (32 chars) or 80mm (48 chars)
  generateEscPosData(text: string): Uint8Array {
    const encoder = new TextEncoder();
    const initCmd = new Uint8Array([0x1b, 0x40]); // ESC @
    const textBytes = encoder.encode(text);
    const cutCmd = new Uint8Array([0x1d, 0x56, 0x41, 0x10]); // GS V 65 16 (Cut paper)

    const combined = new Uint8Array(initCmd.length + textBytes.length + cutCmd.length);
    combined.set(initCmd, 0);
    combined.set(textBytes, initCmd.length);
    combined.set(cutCmd, initCmd.length + textBytes.length);
    return combined;
  }

  async printRaw(data: Uint8Array): Promise<{ success: boolean; fallback?: boolean; error?: string }> {
    if (this.activeCharacteristic) {
      try {
        // Send in chunks of 512 bytes for BLE mtu limits
        const chunkSize = 128;
        for (let i = 0; i < data.length; i += chunkSize) {
          const chunk = data.slice(i, i + chunkSize);
          await this.activeCharacteristic.writeValue(chunk);
        }
        return { success: true };
      } catch (err: any) {
        console.error('Error writing to printer characteristic:', err);
      }
    }

    // Fallback: Trigger standard browser print dialog
    window.print();
    return { success: true, fallback: true };
  }

  printBrowser() {
    window.print();
  }
}

export const printerService = new PrinterService();
