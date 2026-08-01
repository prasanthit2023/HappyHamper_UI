import { Component, OnInit, OnDestroy, inject, signal, computed, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../../environments/environment';

@Component({
  selector: 'bb-scan-label',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule],
  template: `
    <div class="card p-6 space-y-6 animate-fade-in text-neutral-800">
      <!-- Page Header -->
      <div class="page-header">
        <div>
          <h2 class="page-header-title text-xl font-bold tracking-tight text-[var(--color-primary)]">Shipping Label Scanner</h2>
          <p class="page-header-sub text-xs text-neutral-500">Scan QR codes on A6 shipping labels to inspect and verify package contents.</p>
        </div>
      </div>

      <!-- Scanner Area -->
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        <!-- Left: Camera Viewport (5 Columns) -->
        <div class="lg:col-span-5 flex flex-col items-center space-y-4">
          <div class="relative w-full max-w-sm aspect-square rounded-3xl bg-neutral-900 border-4 border-neutral-200 dark:border-neutral-700 overflow-hidden shadow-2xl flex flex-col items-center justify-center">
            
            <!-- Target Camera Container -->
            <div id="reader" class="w-full h-full object-cover"></div>

            <!-- Overlay placeholder when camera is idle -->
            @if (!isScanning()) {
              <div class="absolute inset-0 flex flex-col items-center justify-center text-white bg-neutral-950/80 p-6 text-center space-y-3 select-none">
                <div class="p-4 rounded-full bg-neutral-800/80 border border-neutral-700 shadow-inner">
                  <svg class="w-8 h-8 text-[var(--color-primary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M12 4v1m6 11h2m-6 0h-2v4m0-4v-4m-6 4H3m6 0h2v4m0-4v-4M4 8h16M4 12h16M4 16h16"/>
                  </svg>
                </div>
                <div>
                  <div class="font-bold text-sm">Camera Offline</div>
                  <div class="text-xs text-neutral-400 mt-1">Start the scanner to capture the QR code on the label.</div>
                </div>
              </div>
            } @else {
              <!-- Laser Scanner Line Animation Overlay -->
              <div class="absolute left-0 right-0 h-[2px] bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)] laser-line pointer-events-none"></div>
            }
          </div>

          <!-- Controls -->
          <div class="w-full max-w-sm flex gap-3">
            @if (!isScanning()) {
              <button (click)="startScanner()" [disabled]="!isLibraryLoaded" class="btn-primary w-full py-2.5 rounded-xl font-semibold text-xs tracking-wider flex items-center justify-center gap-1.5 shadow-md">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"/>
                </svg>
                Start Scanner
              </button>
            } @else {
              <button (click)="stopScanner()" class="w-full bg-red-500 hover:bg-red-600 text-white py-2.5 rounded-xl font-semibold text-xs tracking-wider flex items-center justify-center gap-1.5 shadow-md transition-colors">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"/>
                </svg>
                Stop Scanner
              </button>
            }
          </div>

          @if (scanError()) {
            <p class="text-xs text-red-500 font-medium text-center w-full max-w-sm">{{ scanError() }}</p>
          }
        </div>

        <!-- Right: Scanned Order Details (7 Columns) -->
        <div class="lg:col-span-7 space-y-4">
          @if (isLoading()) {
            <!-- Skeleton Loader -->
            <div class="bg-neutral-50 rounded-3xl p-6 border border-neutral-100 space-y-4 animate-pulse">
              <div class="h-6 bg-neutral-200 rounded w-1/3"></div>
              <div class="h-4 bg-neutral-200 rounded w-2/3"></div>
              <div class="border-t border-neutral-200 pt-4 space-y-3">
                <div class="h-12 bg-neutral-200 rounded w-full"></div>
                <div class="h-12 bg-neutral-200 rounded w-full"></div>
              </div>
            </div>
          } @else {
            @if (order(); as o) {
              <!-- Real Scanned Order Details -->
              <div class="bg-white rounded-3xl p-5 border border-neutral-200 shadow-sm space-y-5">
                
                <!-- Order Header & Status -->
                <div class="flex justify-between items-start gap-4">
                  <div>
                    <span class="text-[10px] uppercase font-bold tracking-wider text-neutral-400">Scanned Order</span>
                    <h3 class="text-lg font-black text-neutral-900 mt-0.5">#{{ o.orderNumber }}</h3>
                    <p class="text-xs text-neutral-500 mt-0.5">Placed on {{ o.createdAt | date:'medium' }}</p>
                  </div>
                  <div class="flex flex-col items-end gap-1.5">
                    <span class="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider shadow-sm"
                          [ngClass]="{
                            'bg-emerald-100 text-emerald-800 border border-emerald-200': o.orderStatus === 'delivered',
                            'bg-blue-100 text-blue-800 border border-blue-200': o.orderStatus === 'shipped',
                            'bg-purple-100 text-purple-800 border border-purple-200': o.orderStatus === 'placed' || o.orderStatus === 'return_requested',
                            'bg-neutral-100 text-neutral-600 border border-neutral-200': o.orderStatus === 'cancelled'
                          }">
                      Status: {{ o.orderStatus }}
                    </span>
                    <span class="px-2 py-0.5 rounded-md text-[9px] font-bold tracking-wide uppercase"
                          [ngClass]="o.paymentStatus === 'paid' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'">
                      {{ o.paymentStatus === 'paid' ? 'Paid' : 'COD (Pending)' }}
                    </span>
                  </div>
                </div>

                <!-- Shipping Info -->
                <div class="grid grid-cols-2 gap-4 bg-neutral-50 rounded-2xl p-4 border border-neutral-100 text-xs">
                  <div>
                    <div class="font-bold text-neutral-400 uppercase text-[9px] mb-1">Ship To:</div>
                    <div class="font-bold text-neutral-800">{{ o.shippingAddress?.firstName }} {{ o.shippingAddress?.lastName }}</div>
                    <div class="text-neutral-600 mt-0.5 leading-relaxed">
                      {{ o.shippingAddress?.addressLine1 }}<br/>
                      {{ o.shippingAddress?.city }}, {{ o.shippingAddress?.state }} - {{ o.shippingAddress?.postalCode }}
                    </div>
                    <div class="font-bold text-neutral-700 mt-1">Phone: {{ o.shippingAddress?.phone }}</div>
                  </div>
                  <div class="flex flex-col justify-between items-end text-right">
                    <div>
                      <div class="font-bold text-neutral-400 uppercase text-[9px] mb-1">Carrier Details:</div>
                      <div class="font-bold text-neutral-800">AWB: {{ o.trackingNumber || 'Not assigned' }}</div>
                    </div>
                    <div class="space-y-1">
                      <button (click)="updateStatus(o.id, 'shipped')" [disabled]="o.orderStatus === 'shipped'" class="btn-primary py-1 px-3 rounded-lg text-[10px] tracking-wide uppercase font-bold shadow-sm">
                        Mark as Shipped
                      </button>
                    </div>
                  </div>
                </div>

                <!-- Products Checklist -->
                <div>
                  <h4 class="font-bold text-xs uppercase text-neutral-400 mb-2">Package Items Checklist</h4>
                  <div class="border border-neutral-200 rounded-2xl overflow-hidden bg-neutral-50 shadow-inner">
                    <table class="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr class="bg-neutral-100 text-neutral-500 font-bold uppercase text-[9px] border-b border-neutral-200">
                          <th class="p-3 w-8 text-center">Verify</th>
                          <th class="p-3 w-16">Image</th>
                          <th class="p-3">Product Name</th>
                          <th class="p-3 text-center">Qty</th>
                        </tr>
                      </thead>
                      <tbody>
                        @for (item of o.items; track item.productId; let idx = $index) {
                          <tr class="border-b border-neutral-100 hover:bg-neutral-100/50 transition-colors">
                            <td class="p-3 text-center">
                              <input type="checkbox" class="w-4.5 h-4.5 rounded border-neutral-300 text-[var(--color-primary)] focus:ring-[var(--color-primary)] cursor-pointer" />
                            </td>
                            <td class="p-3">
                              <img [src]="item.image || '/assets/placeholder-product.jpg'" 
                                   (error)="$any($event.target).src = '/assets/placeholder-product.jpg'" 
                                   class="w-12 h-12 object-cover rounded-xl border bg-white" />
                            </td>
                            <td class="p-3">
                              <div class="font-bold text-neutral-800">{{ item.title }}</div>
                              <div class="text-[10px] text-neutral-500 mt-0.5">
                                SKU: <span class="font-mono font-bold">{{ item.variantSku }}</span> · Size: {{ item.size }} · Color: {{ item.color }}
                              </div>
                            </td>
                            <td class="p-3 text-center font-bold text-neutral-700">
                              × {{ item.quantity }}
                            </td>
                          </tr>
                        }
                      </tbody>
                    </table>
                  </div>
                </div>

              </div>
            } @else {
              <!-- Empty State -->
              <div class="h-full min-h-[250px] bg-neutral-50 border border-dashed border-neutral-200 rounded-3xl flex flex-col items-center justify-center text-center p-8 select-none animate-fade-in">
                <div class="p-4 rounded-full bg-neutral-100 text-neutral-400 mb-3 shadow-inner">
                  <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M12 4v1m6 11h2m-6 0h-2v4m0-4v-4m-6 4H3m6 0h2v4m0-4v-4M4 8h16M4 12h16M4 16h16"/>
                  </svg>
                </div>
                <h3 class="font-bold text-sm text-neutral-700">No Label Scanned Yet</h3>
                <p class="text-xs text-neutral-400 mt-1 max-w-xs">Start the camera, position the barcode/QR code on the label in the viewer frame, and we will display the packaging verification sheet.</p>
              </div>
            }
          }
        </div>

      </div>
    </div>
  `,
  styles: [`
    .laser-line {
      top: 0;
      animation: scan 2.5s ease-in-out infinite;
    }
    @keyframes scan {
      0%, 100% { top: 5%; }
      50% { top: 95%; }
    }
    :host ::ng-deep #reader video {
      object-fit: cover !important;
      width: 100% !important;
      height: 100% !important;
    }
  `]
})
export class ScanLabelComponent implements OnInit, OnDestroy {
  private http = inject(HttpClient);
  private cdr = inject(ChangeDetectorRef);

  isLibraryLoaded = false;
  isScanning = signal<boolean>(false);
  isLoading = signal<boolean>(false);
  scanError = signal<string | null>(null);

  order = signal<any | null>(null);

  html5Qrcode: any = null;

  ngOnInit() {
    this.loadHtml5Qrcode().then(() => {
      this.isLibraryLoaded = true;
      this.cdr.markForCheck();
    }).catch(err => {
      console.error("Scanner library failed to load", err);
      this.scanError.set("Failed to load scanner library. Please verify internet connection.");
      this.cdr.markForCheck();
    });
  }

  ngOnDestroy() {
    this.stopScanner();
  }

  private loadHtml5Qrcode(): Promise<void> {
    return new Promise((resolve, reject) => {
      if ((window as any).Html5Qrcode) {
        resolve();
        return;
      }
      const script = document.createElement('script');
      script.src = 'https://unpkg.com/html5-qrcode@2.3.8/html5-qrcode.min.js';
      script.type = 'text/javascript';
      script.onload = () => resolve();
      script.onerror = (err) => reject(err);
      document.body.appendChild(script);
    });
  }

  startScanner() {
    if (this.html5Qrcode) {
      this.stopScanner();
    }

    this.scanError.set(null);
    this.isScanning.set(true);

    setTimeout(() => {
      try {
        const html5QrCode = new (window as any).Html5Qrcode("reader");
        this.html5Qrcode = html5QrCode;

        const config = { fps: 10, qrbox: 250 };

        html5QrCode.start(
          { facingMode: "environment" },
          config,
          (decodedText: string) => {
            this.playBeep();
            this.stopScanner();
            this.fetchOrder(decodedText);
          },
          (errorMessage: string) => {
            // Keep scanning silently
          }
        ).catch((err: any) => {
          console.error("Camera access failed", err);
          this.scanError.set("Camera access failed. Make sure browser camera permission is granted.");
          this.isScanning.set(false);
          this.cdr.markForCheck();
        });
      } catch (err) {
        console.error("Scanner init failed", err);
        this.scanError.set("Scanner initialization failed.");
        this.isScanning.set(false);
        this.cdr.markForCheck();
      }
    }, 100);
  }

  stopScanner() {
    if (this.html5Qrcode) {
      this.html5Qrcode.stop().then(() => {
        this.html5Qrcode = null;
        this.isScanning.set(false);
        this.cdr.markForCheck();
      }).catch((err: any) => {
        console.error("Failed to stop scanner cleanly", err);
        this.html5Qrcode = null;
        this.isScanning.set(false);
        this.cdr.markForCheck();
      });
    } else {
      this.isScanning.set(false);
    }
  }

  playBeep() {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      oscillator.type = 'sine';
      oscillator.frequency.value = 1200; // high pitch beep
      gainNode.gain.setValueAtTime(0, audioCtx.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.3, audioCtx.currentTime + 0.05);
      gainNode.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 0.15);
      oscillator.start();
      oscillator.stop(audioCtx.currentTime + 0.15);
    } catch (err) {
      console.log("Audio play blocked/failed", err);
    }
  }

  fetchOrder(orderNumber: string) {
    this.isLoading.set(true);
    this.order.set(null);
    this.scanError.set(null);
    this.cdr.markForCheck();

    // Clean up order number if scanned with leading hash
    const cleanNumber = orderNumber.trim().replace(/^#/, '');

    this.http.get<any>(`${environment.apiUrl}/orders/admin/by-number/${cleanNumber}`).subscribe({
      next: (res: any) => {
        this.order.set(res.data);
        this.isLoading.set(false);
        this.cdr.markForCheck();
      },
      error: (err: any) => {
        console.error("Fetch order by scanning failed", err);
        this.scanError.set(err.error?.message || `Failed to find order: ${orderNumber}`);
        this.isLoading.set(false);
        this.cdr.markForCheck();
      }
    });
  }

  updateStatus(orderId: number, status: string) {
    this.http.put<any>(`${environment.apiUrl}/orders/admin/${orderId}/status`, { status }).subscribe({
      next: (res: any) => {
        if (this.order() && this.order().id === orderId) {
          // Update local status signal
          const updated = { ...this.order(), orderStatus: status };
          this.order.set(updated);
          this.cdr.markForCheck();
        }
      },
      error: (err: any) => {
        console.error("Failed to update status", err);
        alert("Failed to update status");
      }
    });
  }
}
