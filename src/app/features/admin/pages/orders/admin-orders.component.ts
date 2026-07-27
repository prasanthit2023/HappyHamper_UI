import { Component, OnInit, inject, signal, computed, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { environment } from '../../../../../environments/environment';

@Component({
  selector: 'bb-admin-orders',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, RouterModule, FormsModule],
  template: `
    <div class="card p-6 space-y-5 animate-fade-in">

      <!-- Page Header -->
      <div class="page-header">
        <div>
          <h2 class="page-header-title">Orders</h2>
          <p class="page-header-sub">{{ orders().length }} total orders · Manage status and track deliveries</p>
        </div>
        <div class="page-header-actions">
          <button (click)="exportCSV()" class="btn-secondary text-xs py-2 px-3 gap-1.5">
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/>
            </svg>
            Export CSV
          </button>
        </div>
      </div>

      <!-- Search + Date Filter Bar -->
      <div class="filter-bar">
        <div class="relative">
          <input
            type="text"
            placeholder="Search by order #, customer name, phone..."
            [ngModel]="searchTerm()"
            (ngModelChange)="searchTerm.set($event); currentPage.set(1)"
            class="input-field py-2.5 pl-9 text-xs"
          />
          <svg class="w-4 h-4 absolute left-3 top-3 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
          </svg>
        </div>
        <input
          type="date"
          [ngModel]="dateFrom()"
          (ngModelChange)="dateFrom.set($event); currentPage.set(1)"
          class="input-field py-2.5 text-xs"
          aria-label="Date from"
        />
        <input
          type="date"
          [ngModel]="dateTo()"
          (ngModelChange)="dateTo.set($event); currentPage.set(1)"
          class="input-field py-2.5 text-xs"
          aria-label="Date to"
        />
        @if (searchTerm() || dateFrom() || dateTo()) {
          <button (click)="clearFilters()" class="btn-ghost text-xs py-2 px-3 text-red-500">
            Clear
          </button>
        }
      </div>

      <!-- Status Tabs (scrollable on mobile) -->
      <div class="overflow-x-auto -mx-1 px-1 pb-1">
        <div class="flex gap-1 min-w-max border-b" style="border-color: var(--color-border);">
          @for (tab of tabs; track tab.id) {
            <button
              (click)="selectTab(tab.id)"
              class="px-4 py-2.5 text-xs font-semibold transition-all border-b-2 -mb-px whitespace-nowrap"
              [style.border-color]="activeTab() === tab.id ? 'var(--color-primary)' : 'transparent'"
              [style.color]="activeTab() === tab.id ? 'var(--color-primary)' : 'var(--color-text-muted)'"
            >
              {{ tab.label }}
              <span
                class="ml-1.5 px-1.5 py-0.5 rounded-full text-[10px] font-bold"
                [style.background]="activeTab() === tab.id ? 'var(--color-primary-light)' : 'var(--color-bg-subtle)'"
                [style.color]="activeTab() === tab.id ? 'var(--color-primary)' : 'var(--color-text-muted)'"
              >{{ getTabCount(tab.id) }}</span>
            </button>
          }
        </div>
      </div>

      @if (loading()) {
        <div class="space-y-3">
          @for (_ of [1,2,3,4]; track $index) {
            <div class="skeleton h-16 w-full rounded-xl"></div>
          }
        </div>
      } @else if (orders().length === 0) {
        <div class="empty-state">
          <div class="empty-state-icon">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
            </svg>
          </div>
          <div class="empty-state-title">No orders yet</div>
          <div class="empty-state-sub">Orders will appear here once customers start purchasing.</div>
        </div>
      } @else if (filteredOrders().length === 0) {
        <div class="empty-state">
          <div class="empty-state-icon">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
            </svg>
          </div>
          <div class="empty-state-title">No matching orders</div>
          <div class="empty-state-sub">Try adjusting your search or filter criteria.</div>
        </div>
      } @else {
        <div class="w-full overflow-x-auto rounded-xl border" style="border-color: var(--color-border);">
          <table class="admin-table">
            <thead>
              <tr>
                <th class="sortable" (click)="sortBy('orderNumber')">
                  Order # <span class="ml-0.5">{{ sortField() === 'orderNumber' ? (sortAsc() ? '↑' : '↓') : '' }}</span>
                </th>
                <th>Customer</th>
                <th class="sortable" (click)="sortBy('totalAmount')">
                  Total <span class="ml-0.5">{{ sortField() === 'totalAmount' ? (sortAsc() ? '↑' : '↓') : '' }}</span>
                </th>
                <th>Payment</th>
                <th class="sortable" (click)="sortBy('createdAt')">
                  Date <span class="ml-0.5">{{ sortField() === 'createdAt' ? (sortAsc() ? '↑' : '↓') : '' }}</span>
                </th>
                <th>Status</th>
                <th class="col-actions">Update</th>
                <th>Label</th>
              </tr>
            </thead>
            <tbody>
              @for (order of paginatedOrders(); track order._id || order.id) {
                <tr>
                  <td>
                    <span class="font-mono font-bold text-xs" style="color: var(--color-text);">#{{ order.orderNumber }}</span>
                  </td>
                  <td>
                    <span class="font-semibold text-sm block" style="color: var(--color-text);">
                      {{ order.shippingAddress?.firstName }} {{ order.shippingAddress?.lastName }}
                    </span>
                    <span class="text-xs font-mono" style="color: var(--color-text-muted);">{{ order.shippingAddress?.phone }}</span>
                  </td>
                  <td class="font-bold" style="color: var(--color-text);"><i class="bi bi-currency-rupee"></i>{{ order.totalAmount | number:'1.0-0' }}</td>
                  <td>
                    <span class="status-badge"
                          [class]="order.paymentStatus === 'paid' ? 'status-delivered' : order.paymentStatus === 'failed' ? 'status-cancelled' : 'status-pending'">
                      {{ order.paymentStatus | titlecase }}
                    </span>
                  </td>
                  <td class="text-xs" style="color: var(--color-text-muted);">{{ order.createdAt | date:'dd MMM yy' }}</td>
                  <td>
                    <span class="status-badge" [class]="getStatusClass(order.orderStatus)">
                      {{ formatStatus(order.orderStatus) }}
                    </span>
                  </td>
                  <td class="col-actions">
                    <select
                      [ngModel]="order.orderStatus"
                      (ngModelChange)="updateStatus(order.id || order._id, $event)"
                      class="text-xs px-2 py-1.5 rounded-lg border cursor-pointer focus:outline-none transition-all"
                      style="border-color: var(--color-border); color: var(--color-text); background: white; min-width: 130px;"
                    >
                      <option value="placed">Placed</option>
                      <option value="confirmed">Confirmed</option>
                      <option value="processing">Processing</option>
                      <option value="shipped">Shipped</option>
                      <option value="out_for_delivery">Out for Delivery</option>
                      <option value="delivered">Delivered</option>
                      <option value="returned">Returned</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </td>
                  <td>
                    <button
                      (click)="openLabelModal(order)"
                      class="text-xs px-2.5 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold border border-indigo-200 transition-all flex items-center gap-1 cursor-pointer"
                    >
                      <i class="pi pi-print text-[10px]"></i>
                      Generate Label
                    </button>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>

        <!-- Pagination UI -->
        <div class="flex items-center justify-between pt-2">
          <span class="text-xs" style="color: var(--color-text-muted);">
            Showing {{ (currentPage() - 1) * pageSize() + 1 }} - {{ Math.min(currentPage() * pageSize(), filteredOrders().length) }} of {{ filteredOrders().length }} orders
          </span>
          <div class="flex items-center gap-1.5">
            <button
              [disabled]="currentPage() === 1"
              (click)="currentPage.set(currentPage() - 1)"
              class="btn-icon w-8 h-8 rounded-lg"
              [class.opacity-50]="currentPage() === 1"
              aria-label="Previous page"
            >
              <i class="pi pi-chevron-left text-xs"></i>
            </button>
            <span class="text-xs font-semibold px-3 py-1.5 rounded-lg bg-neutral-50 border" style="border-color: var(--color-border); color: var(--color-text);">
              Page {{ currentPage() }} of {{ totalPages() }}
            </span>
            <button
              [disabled]="currentPage() === totalPages()"
              (click)="currentPage.set(currentPage() + 1)"
              class="btn-icon w-8 h-8 rounded-lg"
              [class.opacity-50]="currentPage() === totalPages()"
              aria-label="Next page"
            >
              <i class="pi pi-chevron-right text-xs"></i>
            </button>
          </div>
        </div>

        <!-- Shipping Label Configuration Modal -->
        @if (showLabelModal()) {
          <div class="fixed inset-0 z-[10000] animate-fade-in flex items-center justify-center p-4" style="background: rgba(45,45,45,0.4); backdrop-filter: blur(2px);">
            <div class="bg-white dark:bg-neutral-900 rounded-3xl shadow-2xl border border-neutral-100 dark:border-neutral-800 max-w-4xl w-full overflow-hidden transform scale-100 animate-scale-in flex flex-col max-h-[90vh]">
              
              <!-- Modal Header -->
              <div class="p-5 border-b border-neutral-100 dark:border-neutral-800 flex items-center justify-between">
                <h3 class="font-display font-bold text-lg text-neutral-900 dark:text-white flex items-center gap-2">
                  <i class="pi pi-print text-indigo-500"></i>
                  Generate Thermal Shipping Label
                </h3>
                <button (click)="showLabelModal.set(false)" class="text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 transition-colors cursor-pointer">
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
                </button>
              </div>

              <!-- Modal Body (Two columns) -->
              <div class="p-6 overflow-y-auto grid grid-cols-1 md:grid-cols-2 gap-6 max-h-[68vh] bg-neutral-50 dark:bg-neutral-950">
                
                <!-- Left Column: Config Form -->
                <div class="space-y-4">
                  <h4 class="font-bold text-xs uppercase text-neutral-400 tracking-wider">Label Parameters</h4>
                  
                  <!-- Courier Name -->
                  <div class="space-y-1">
                    <label class="text-xs font-bold text-neutral-600 dark:text-neutral-300">Courier Name</label>
                    <input
                      type="text"
                      [ngModel]="courierName()"
                      (ngModelChange)="courierName.set($event)"
                      class="input-field text-xs py-2 px-3"
                      placeholder="e.g. Delhivery, Blue Dart"
                    />
                  </div>

                  <!-- AWB Tracking Number -->
                  <div class="space-y-1">
                    <label class="text-xs font-bold text-neutral-600 dark:text-neutral-300">AWB Tracking Number</label>
                    <input
                      type="text"
                      [ngModel]="awbNumber()"
                      (ngModelChange)="awbNumber.set($event)"
                      class="input-field text-xs py-2 px-3 font-mono"
                      placeholder="Enter or generate AWB"
                    />
                  </div>

                  <!-- Weight -->
                  <div class="space-y-1">
                    <label class="text-xs font-bold text-neutral-600 dark:text-neutral-300">Package Weight (kgs)</label>
                    <input
                      type="text"
                      [ngModel]="parcelWeight()"
                      (ngModelChange)="parcelWeight.set($event)"
                      class="input-field text-xs py-2 px-3"
                      placeholder="e.g. 0.35"
                    />
                  </div>

                  <!-- Routing Code -->
                  <div class="space-y-1">
                    <label class="text-xs font-bold text-neutral-600 dark:text-neutral-300">Routing / Sort Code</label>
                    <input
                      type="text"
                      [ngModel]="routingCode()"
                      (ngModelChange)="routingCode.set($event)"
                      class="input-field text-xs py-2 px-3 uppercase"
                      placeholder="e.g. DEL-110001"
                    />
                  </div>

                  <!-- Delivery Instructions -->
                  <div class="space-y-1">
                    <label class="text-xs font-bold text-neutral-600 dark:text-neutral-300">Delivery Instructions (optional)</label>
                    <textarea
                      [ngModel]="deliveryInstructions()"
                      (ngModelChange)="deliveryInstructions.set($event)"
                      rows="3"
                      class="input-field text-xs py-2 px-3"
                      placeholder="Special instructions for courier..."
                    ></textarea>
                  </div>
                </div>

                <!-- Right Column: Live A6 Label Preview -->
                <div class="flex flex-col items-center justify-start space-y-3">
                  <h4 class="font-bold text-xs uppercase text-neutral-400 tracking-wider w-full text-left">4x6 Thermal Label Live Preview</h4>
                  
                  <!-- Scaled Down Print Preview Container -->
                  <div class="w-[340px] bg-white border-2 border-black text-black flex flex-col font-sans select-none overflow-hidden shadow-lg p-3" style="min-height: 480px; box-sizing: border-box;">
                    <!-- Top Section -->
                    <div class="flex border-b-2 border-black">
                      <!-- Barcode Box (65%) -->
                      <div class="w-[65%] p-1.5 border-r-2 border-black flex flex-col items-center justify-center">
                        <div class="text-center font-black text-xs tracking-wider mb-2">HAPPY HAMPER</div>
                        <!-- Mock Barcode CSS representation -->
                        <div class="flex items-center justify-center gap-[1px] h-9 w-full bg-neutral-100 border border-dashed border-neutral-300 p-1 mb-1">
                          <div class="bg-black w-[2px] h-7"></div>
                          <div class="bg-black w-[1px] h-7"></div>
                          <div class="bg-black w-[3px] h-7"></div>
                          <div class="bg-black w-[1px] h-7"></div>
                          <div class="bg-black w-[2px] h-7"></div>
                          <div class="bg-black w-[4px] h-7"></div>
                          <div class="bg-black w-[1px] h-7"></div>
                          <div class="bg-black w-[2px] h-7"></div>
                          <div class="bg-black w-[3px] h-7"></div>
                          <div class="bg-black w-[1px] h-7"></div>
                          <div class="bg-black w-[2px] h-7"></div>
                        </div>
                        <span class="text-[9px] font-bold">AWB: {{ awbNumber() }}</span>
                      </div>
                      <!-- Routing Box (35%) -->
                      <div class="w-[35%] flex flex-col text-[10px] font-bold">
                        <div class="p-1 text-center bg-black text-white text-xs font-black" style="color: #ffffff;">
                          {{ routingCode() }}
                        </div>
                        <div class="border-b-2 border-black p-1 text-center">
                          {{ parcelWeight() }} kgs
                        </div>
                        <div class="border-b-2 border-black p-1 text-center">
                          {{ selectedOrderForLabel()?.createdAt | date:'dd/MM' }}
                        </div>
                        <div class="p-1 text-center text-xs font-black bg-black text-white flex-grow flex items-center justify-center" style="color: #ffffff;">
                          {{ selectedOrderForLabel()?.paymentStatus === 'paid' ? 'PREPAID' : 'COD' }}
                        </div>
                      </div>
                    </div>

                    <!-- Box count & Sorting bar -->
                    <div class="border-b-2 border-black text-center text-[9px] font-black py-0.5 flex justify-around bg-neutral-50">
                      <span>BOX 1 OF 1</span>
                      <span class="border-l border-r border-black px-3">{{ courierName() }}</span>
                      <span>ZONE: X</span>
                    </div>

                    <!-- Ship To Address Section -->
                    <div class="p-2 border-b-2 border-black text-[10px]">
                      <div class="font-black text-[9px] uppercase mb-0.5">Ship To:</div>
                      <div class="font-bold text-[11px]">{{ selectedOrderForLabel()?.shippingAddress?.firstName }} {{ selectedOrderForLabel()?.shippingAddress?.lastName }}</div>
                      <div class="text-[9px] leading-tight font-semibold mt-0.5 text-neutral-800">
                        {{ selectedOrderForLabel()?.shippingAddress?.addressLine1 }}<br/>
                        @if (selectedOrderForLabel()?.shippingAddress?.addressLine2) {
                          {{ selectedOrderForLabel()?.shippingAddress?.addressLine2 }}<br/>
                        }
                        {{ selectedOrderForLabel()?.shippingAddress?.city }}, {{ selectedOrderForLabel()?.shippingAddress?.state }} - {{ selectedOrderForLabel()?.shippingAddress?.postalCode }}
                      </div>
                      <div class="font-black text-[9px] mt-1">Phone: {{ selectedOrderForLabel()?.shippingAddress?.phone }}</div>
                    </div>

                    <!-- Order & QR Code Section -->
                    <div class="flex border-b-2 border-black">
                      <div class="w-[75%] p-2 border-r-2 border-black text-[9px] space-y-0.5">
                        <div><strong>Order ID:</strong> #{{ selectedOrderForLabel()?.orderNumber }}</div>
                        <div><strong>Order Date:</strong> {{ selectedOrderForLabel()?.createdAt | date:'dd MMM yyyy, hh:mm a' }}</div>
                        @if (deliveryInstructions()) {
                          <div class="text-[8px] italic text-neutral-600 mt-1"><strong>Instructions:</strong> {{ deliveryInstructions() }}</div>
                        }
                      </div>
                      <div class="w-[25%] p-1 flex items-center justify-center">
                        <img [src]="'https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=' + selectedOrderForLabel()?.orderNumber" alt="QR" class="w-10 h-10" />
                      </div>
                    </div>

                    <!-- Ship From Section -->
                    <div class="p-1 border-b-2 border-black text-[8px] leading-tight">
                      <div class="font-bold uppercase text-[8px]">Ship From:</div>
                      <div><strong>Happy Hamper</strong>, 123 Luxury Lane, New Delhi, Delhi, 110001</div>
                    </div>

                    <!-- Customer Self Declaration Table -->
                    <div class="p-1 border-b border-black text-[8px]">
                      <table class="w-full border border-black text-center text-[7px] border-collapse">
                        <thead>
                          <tr class="bg-black text-white" style="color: #ffffff;">
                            <th class="border-r border-black p-0.5 font-bold">SELLER</th>
                            <th class="border-r border-black p-0.5 font-bold">GSTIN</th>
                            <th class="border-r border-black p-0.5 font-bold">INVOICE</th>
                            <th class="p-0.5 font-bold">DATE</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr>
                            <td class="border-r border-black p-0.5">HAPPY HAMPER</td>
                            <td class="border-r border-black p-0.5">07AAAAA1111A1Z1</td>
                            <td class="border-r border-black p-0.5">#{{ selectedOrderForLabel()?.orderNumber }}</td>
                            <td class="p-0.5">{{ selectedOrderForLabel()?.createdAt | date:'dd-MM-yyyy' }}</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>

                    <!-- Routing codes block -->
                    <div class="p-1.5 flex items-center justify-between text-[9px] font-black uppercase">
                      <div class="flex gap-1">
                        <span class="bg-black text-white px-0.5" style="color: #ffffff;">VMMG</span>
                        <span class="border border-black px-0.5">MMAA</span>
                        <span class="border border-black px-0.5">COKE</span>
                      </div>
                      <div class="bg-black text-white px-1 text-[9px]" style="color: #ffffff;">
                        {{ routingCode() }}
                      </div>
                    </div>
                  </div>
                </div>

              </div>

              <!-- Modal Footer -->
              <div class="p-5 border-t border-neutral-100 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 flex items-center justify-end gap-3">
                <button
                  (click)="showLabelModal.set(false)"
                  class="px-5 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 text-xs font-bold text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-all active:scale-95 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  (click)="printLabel()"
                  class="px-5 py-2.5 rounded-xl text-xs font-bold text-white shadow-md transition-all active:scale-95 cursor-pointer flex items-center gap-1.5"
                  style="background-color: var(--color-primary, #2eafb0) !important; color: #ffffff !important;"
                >
                  <i class="pi pi-print"></i>
                  Save AWB & Print Label
                </button>
              </div>

            </div>
          </div>
        }
      }
    </div>
  `,
})
export class AdminOrdersComponent implements OnInit {
  private http = inject(HttpClient);
  private cdr  = inject(ChangeDetectorRef);

  orders      = signal<any[]>([]);
  loading     = signal<boolean>(true);

  // Shipping Label Generation state
  showLabelModal = signal<boolean>(false);
  selectedOrderForLabel = signal<any | null>(null);

  // Label configuration inputs
  courierName = signal<string>('Delhivery');
  awbNumber = signal<string>('');
  parcelWeight = signal<string>('0.35');
  routingCode = signal<string>('SUR-DEL');
  deliveryInstructions = signal<string>('');
  searchTerm  = signal<string>('');
  activeTab   = signal<string>('all');
  dateFrom    = signal<string>('');
  dateTo      = signal<string>('');
  sortField   = signal<string>('createdAt');
  sortAsc     = signal<boolean>(false);
  currentPage = signal<number>(1);
  pageSize    = signal<number>(10);
  Math = Math;

  tabs = [
    { id: 'all',        label: 'All' },
    { id: 'pending',    label: 'Pending' },
    { id: 'processing', label: 'Processing' },
    { id: 'transit',    label: 'In Transit' },
    { id: 'delivered',  label: 'Delivered' },
    { id: 'cancelled',  label: 'Cancelled' },
  ];

  filteredOrders = computed(() => {
    let list  = this.orders();
    const tab = this.activeTab();
    const q   = this.searchTerm().toLowerCase().trim();
    const df  = this.dateFrom();
    const dt  = this.dateTo();

    if (tab !== 'all') {
      const tabMap: Record<string, string[]> = {
        pending:    ['placed', 'confirmed'],
        processing: ['processing'],
        transit:    ['shipped', 'out_for_delivery'],
        delivered:  ['delivered'],
        cancelled:  ['cancelled'],
      };
      list = list.filter(o => tabMap[tab]?.includes(o.orderStatus));
    }
    if (q) {
      list = list.filter(o =>
        o.orderNumber?.toLowerCase().includes(q) ||
        o.shippingAddress?.firstName?.toLowerCase().includes(q) ||
        o.shippingAddress?.lastName?.toLowerCase().includes(q) ||
        o.shippingAddress?.phone?.includes(q)
      );
    }
    if (df) list = list.filter(o => new Date(o.createdAt) >= new Date(df));
    if (dt) list = list.filter(o => new Date(o.createdAt) <= new Date(dt + 'T23:59:59'));

    const field = this.sortField();
    const asc   = this.sortAsc();
    list = [...list].sort((a, b) => {
      const av = field === 'createdAt' ? new Date(a[field]).getTime() : (a[field] ?? 0);
      const bv = field === 'createdAt' ? new Date(b[field]).getTime() : (b[field] ?? 0);
      return asc ? (av > bv ? 1 : -1) : (av < bv ? 1 : -1);
    });

    return list;
  });

  paginatedOrders = computed(() => {
    const start = (this.currentPage() - 1) * this.pageSize();
    const end   = start + this.pageSize();
    return this.filteredOrders().slice(start, end);
  });

  totalPages = computed(() => {
    return Math.ceil(this.filteredOrders().length / this.pageSize()) || 1;
  });

  ngOnInit() { this.fetchOrders(); }

  fetchOrders() {
    this.loading.set(true);
    this.http.get<any>(`${environment.apiUrl}/orders/admin/all`).subscribe({
      next: (res) => { this.orders.set(res.data || []); this.loading.set(false); this.cdr.markForCheck(); },
      error: ()   => { this.loading.set(false); this.cdr.markForCheck(); },
    });
  }

  selectTab(id: string) {
    this.activeTab.set(id);
    this.currentPage.set(1);
  }

  clearFilters() {
    this.searchTerm.set('');
    this.dateFrom.set('');
    this.dateTo.set('');
    this.currentPage.set(1);
  }

  sortBy(field: string) {
    if (this.sortField() === field) {
      this.sortAsc.update(v => !v);
    } else {
      this.sortField.set(field);
      this.sortAsc.set(false);
    }
    this.currentPage.set(1);
  }

  getTabCount(tabId: string): number {
    const list = this.orders();
    const tabMap: Record<string, string[]> = {
      all: [], pending: ['placed','confirmed'], processing: ['processing'],
      transit: ['shipped','out_for_delivery'], delivered: ['delivered'], cancelled: ['cancelled'],
    };
    if (tabId === 'all') return list.length;
    return list.filter(o => tabMap[tabId]?.includes(o.orderStatus)).length;
  }

  formatStatus(s: string): string {
    return (s || 'placed').charAt(0).toUpperCase() + s.slice(1).replace(/_/g, ' ');
  }

  getStatusClass(s: string): string {
    return 'status-' + (s || 'placed').toLowerCase();
  }

  updateStatus(id: string, newStatus: string) {
    this.http.put<any>(`${environment.apiUrl}/orders/admin/${id}/status`, { status: newStatus, note: 'Updated by admin' }).subscribe({
      next: () => {
        this.orders.update(list => list.map(o => (o.id || o._id) === id ? { ...o, orderStatus: newStatus } : o));
        this.cdr.markForCheck();
      },
    });
  }

  exportCSV() {
    const rows = this.filteredOrders();
    const csv  = [
      ['Order #','Customer','Phone','Total','Payment','Status','Date'],
      ...rows.map(o => [
        o.orderNumber,
        `${o.shippingAddress?.firstName} ${o.shippingAddress?.lastName}`,
        o.shippingAddress?.phone || '',
        o.totalAmount,
        o.paymentStatus,
        o.orderStatus,
        o.createdAt ? new Date(o.createdAt).toLocaleDateString() : ''
      ])
    ].map(r => r.join(',')).join('\n');

    const a   = document.createElement('a');
    a.href    = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv);
    a.download = `orders-${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
  }

  openLabelModal(order: any) {
    this.selectedOrderForLabel.set(order);
    this.courierName.set('Delhivery');
    this.awbNumber.set(order.trackingNumber || 'AWB' + Math.floor(100000000000 + Math.random() * 900000000000));
    this.parcelWeight.set('0.35');
    const pin = order.shippingAddress?.postalCode || '110001';
    const city = (order.shippingAddress?.city || 'DEL').substring(0, 3).toUpperCase();
    this.routingCode.set(`${city}-${pin}`);
    this.deliveryInstructions.set(order.notes || 'Handle with care');
    this.showLabelModal.set(true);
    this.cdr.markForCheck();
  }

  printLabel() {
    const order = this.selectedOrderForLabel();
    if (!order) return;

    const awb = this.awbNumber();
    const notes = this.deliveryInstructions();

    // 1. Save to database first
    this.http.put<any>(`${environment.apiUrl}/orders/admin/${order.id || order._id}/status`, {
      status: order.orderStatus,
      trackingNumber: awb,
      note: notes
    }).subscribe({
      next: () => {
        // Update local order list
        this.orders.update(list => list.map(o => (o.id || o._id) === (order.id || order._id) ? { ...o, trackingNumber: awb, notes: notes } : o));
        this.showLabelModal.set(false);
        this.cdr.markForCheck();

        // 2. Open print window and trigger printing
        this.triggerPrintPopup(order);
      }
    });
  }

  triggerPrintPopup(order: any) {
    const printWindow = window.open('', '_blank', 'width=650,height=850');
    if (!printWindow) {
      alert('Pop-up blocker is active. Please allow pop-ups to print the shipping label.');
      return;
    }

    const shipTo = order.shippingAddress || {};
    const dateFormatted = new Date(order.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit' });
    const fullDateFormatted = new Date(order.createdAt).toLocaleString('en-US', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    const shortDateFormatted = new Date(order.createdAt).toLocaleDateString('en-GB');

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Shipping Label - #${order.orderNumber}</title>
        <script src="https://cdn.jsdelivr.net/npm/jsbarcode@3.11.5/dist/JsBarcode.all.min.js"></script>
        <style>
          @page {
            size: 100mm 150mm;
            margin: 0;
          }
          body {
            margin: 0;
            padding: 4mm;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif;
            background: #ffffff;
            color: #000000;
            box-sizing: border-box;
          }
          .label-container {
            width: 92mm;
            height: 142mm;
            border: 2px solid #000000;
            display: flex;
            flex-direction: column;
            box-sizing: border-box;
            background: #ffffff;
            overflow: hidden;
          }
          .border-b-2 { border-bottom: 2px solid #000000; }
          .border-r-2 { border-right: 2px solid #000000; }
          .border-t-2 { border-top: 2px solid #000000; }
          .flex { display: flex; }
          .flex-col { display: flex; flex-direction: column; }
          .w-65 { width: 65%; }
          .w-35 { width: 35%; }
          .w-75 { width: 75%; }
          .w-25 { width: 25%; }
          .p-1 { padding: 1mm; }
          .p-2 { padding: 2mm; }
          .p-3 { padding: 3mm; }
          .text-center { text-align: center; }
          .text-right { text-align: right; }
          .font-bold { font-weight: bold; }
          .font-black { font-weight: 900; }
          .text-xs { font-size: 10px; }
          .text-sm { font-size: 12px; }
          .text-base { font-size: 14px; }
          .bg-black { background-color: #000000; color: #ffffff; }
          .justify-around { justify-content: space-around; }
          .items-center { align-items: center; }
          .justify-center { justify-content: center; }
          .w-full { width: 100%; }
          
          /* Declaration Table styling */
          .dec-table {
            width: 100%;
            border-collapse: collapse;
            font-size: 8px;
            text-align: center;
            margin-top: 1mm;
          }
          .dec-table th, .dec-table td {
            border: 1px solid #000000;
            padding: 0.5mm;
          }
        </style>
      </head>
      <body>
        <div class="label-container">
          <!-- Top Section -->
          <div class="flex border-b-2">
            <div class="w-65 p-2 border-r-2 flex flex-col items-center justify-center">
              <div style="font-size: 18px; font-weight: 900; letter-spacing: 0.5px; margin-bottom: 2px;">HAPPY HAMPER</div>
              <svg id="label-barcode" style="max-width: 90%;"></svg>
              <div class="text-xs font-bold" style="margin-top: 2px;">AWB: ${this.awbNumber()}</div>
            </div>
            <div class="w-35 flex flex-col text-xs font-bold">
              <div class="p-1 text-center bg-black font-black text-sm" style="color:#ffffff;">
                ${this.routingCode()}
              </div>
              <div class="border-b-2 p-1 text-center">
                ${this.parcelWeight()} kgs
              </div>
              <div class="border-b-2 p-1 text-center">
                ${dateFormatted}
              </div>
              <div class="p-1 text-center text-sm font-black bg-black" style="flex-grow: 1; display: flex; align-items: center; justify-content: center; color:#ffffff;">
                ${order.paymentStatus === 'paid' ? 'PREPAID' : 'COD'}
              </div>
            </div>
          </div>

          <!-- Box count & Sorting bar -->
          <div class="border-b-2 text-center font-black py-1 flex justify-around" style="font-size: 9px;">
            <span>BOX 1 OF 1</span>
            <span style="border-left: 1px solid #000; border-right: 1px solid #000; padding: 0 4mm;">${this.courierName()}</span>
            <span>ZONE: X</span>
          </div>

          <!-- Ship To Address Section -->
          <div class="p-3 border-b-2 text-xs flex-grow" style="display: flex; flex-direction: column;">
            <div class="font-black text-xs uppercase" style="margin-bottom: 1mm;">Ship To:</div>
            <div class="font-bold text-sm">${shipTo.firstName || ''} ${shipTo.lastName || ''}</div>
            <div style="font-size: 11px; line-height: 1.3; margin-top: 1mm; font-weight: 600;">
              ${shipTo.addressLine1 || ''}<br/>
              ${shipTo.addressLine2 ? shipTo.addressLine2 + '<br/>' : ''}
              ${shipTo.city || ''}, ${shipTo.state || ''} - ${shipTo.postalCode || ''}<br/>
              ${shipTo.country || 'India'}
            </div>
            <div class="font-black text-xs" style="margin-top: 2mm;">Phone: ${shipTo.phone || ''}</div>
          </div>

          <!-- Order & QR Code Section -->
          <div class="flex border-b-2">
            <div class="w-75 p-2 border-r-2 text-xs flex flex-col justify-center space-y-1">
              <div><strong>Order ID:</strong> #${order.orderNumber}</div>
              <div><strong>Order Date:</strong> ${fullDateFormatted}</div>
              ${this.deliveryInstructions() ? `<div style="font-size: 9px; margin-top: 1mm; color: #444;"><strong>Instructions:</strong> ${this.deliveryInstructions()}</div>` : ''}
            </div>
            <div class="w-25 p-1 flex items-center justify-center">
              <img src="https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${order.orderNumber}" alt="QR" style="width: 14mm; height: 14mm;" />
            </div>
          </div>

          <!-- Ship From & Return Address Section -->
          <div class="p-2 border-b-2 text-xs" style="font-size: 8px; line-height: 1.2;">
            <div class="font-bold uppercase" style="font-size: 9px;">Ship From (Return Address):</div>
            <div class="font-bold">Happy Hamper</div>
            <div>123 Luxury Lane, Fashion District, New Delhi, Delhi, 110001</div>
            <div>Email: care@happyhamper.com | Phone: +91 98765 43210</div>
          </div>

          <!-- Customer Self Declaration Table -->
          <div class="p-1 text-xs" style="font-size: 8px; line-height: 1.2;">
            <div class="font-bold" style="font-size: 7.5px;">Customer Self Declaration: The goods sold are intended for end-user consumption. Not for resale.</div>
            <table class="dec-table">
              <thead>
                <tr class="bg-black" style="color:#ffffff;">
                  <th>SELLER</th>
                  <th>GSTIN</th>
                  <th>INVOICE</th>
                  <th>DATE</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>HAPPY HAMPER</td>
                  <td>07AAAAA1111A1Z1</td>
                  <td>#${order.orderNumber}</td>
                  <td>${shortDateFormatted}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Bottom Routing codes block -->
          <div class="p-2 border-t-2 flex items-center justify-between font-black uppercase" style="font-size: 10px;">
            <div class="flex" style="gap: 1.5mm;">
              <span class="bg-black" style="padding: 0.2mm 1mm; color:#ffffff;">VMMG</span>
              <span style="border: 1px solid #000; padding: 0.2mm 1mm;">MMAA</span>
              <span style="border: 1px solid #000; padding: 0.2mm 1mm;">COKE</span>
            </div>
            <div class="bg-black" style="padding: 0.5mm 2mm; font-size: 11px; color:#ffffff;">
              ${this.routingCode()}
            </div>
          </div>
          
          <div class="text-center font-bold" style="font-size: 8px; border-top: 1px solid #000; padding: 0.5mm 0;">
            Sold on: www.happyhamper.com
          </div>
        </div>

        <script>
          // Initialize Barcode
          JsBarcode("#label-barcode", "${this.awbNumber()}", {
            format: "CODE128",
            width: 1.6,
            height: 35,
            displayValue: false,
            margin: 0
          });

          // Trigger Printing
          window.onload = function() {
            window.print();
            setTimeout(function() { window.close(); }, 500);
          };
        </script>
      </body>
      </html>
    `;

    printWindow.document.write(html);
    printWindow.document.close();
  }
}
