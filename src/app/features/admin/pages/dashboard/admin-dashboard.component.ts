import { Component, inject, OnInit, signal, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../../environments/environment';

@Component({
  selector: 'bb-admin-dashboard',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, RouterModule],
  styles: [`.bar-chart-item { opacity: 0.85; } .bar-chart-item:hover { opacity: 1; } .action-link:hover { background-color: var(--color-bg-subtle); }`],
  template: `
    <div class="space-y-6 animate-fade-in">

      <!-- Page Header -->
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 class="text-2xl font-bold font-display" style="color: var(--color-text);">Dashboard Overview</h1>
          <p class="mt-1 text-sm" style="color: var(--color-text-muted);">Welcome back! Here's what's happening with your store today.</p>
        </div>
        <div class="flex items-center gap-2">
          <span class="text-xs px-3 py-1.5 rounded-full font-medium" style="background: var(--color-primary-light); color: var(--color-primary-dark);">
            <svg class="w-3.5 h-3.5 inline-block mr-1 -mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
            </svg>
            {{ today }}
          </span>
          <button class="btn-primary text-sm px-4 py-2" routerLink="/admin/products/new">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
            </svg>
            Add Product
          </button>
        </div>
      </div>

      <!-- KPI Cards -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        @for (card of kpiCards(); track card.label) {
          <div class="stat-card animate-counter animate-fade-in">
            <div class="flex items-start justify-between mb-4">
              <div class="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0" [style.background]="card.iconBg">
                <svg class="w-5 h-5" [style.color]="card.iconColor" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" [attr.d]="card.svgPath"/>
                </svg>
              </div>
              <span class="text-xs font-semibold px-2.5 py-1 rounded-lg"
                    [style.background]="card.changePositive ? '#DCFCE7' : '#FEE2E2'"
                    [style.color]="card.changePositive ? '#16a34a' : '#dc2626'">
                {{ card.changePositive ? '+' : '-' }}{{ card.change }}
              </span>
            </div>
            <div class="text-2xl font-bold font-display mb-0.5" style="color: var(--color-text);">
              @if (card.label === 'Total Revenue') {
                <i class="bi bi-currency-rupee"></i>
              }
              {{ card.value }}
            </div>
            <div class="text-sm" style="color: var(--color-text-muted);">{{ card.label }}</div>
            <div class="mt-3 h-1 rounded-full" style="background: var(--color-border);">
              <div class="h-full rounded-full transition-all duration-700" [style.width]="card.progress" [style.background]="card.progressColor"></div>
            </div>
          </div>
        }
      </div>

      <!-- Charts Row -->
      <div class="grid grid-cols-1 lg:grid-cols-5 gap-5">

        <!-- Revenue Bar Chart -->
        <div class="card p-6 lg:col-span-3">
          <div class="flex items-center justify-between mb-6">
            <div>
              <h3 class="font-semibold text-base" style="color: var(--color-text);">Revenue Trend</h3>
              <p class="text-xs mt-0.5" style="color: var(--color-text-muted);">Performance breakdown by selected period</p>
            </div>
            <div class="flex gap-1 p-1 rounded-xl" style="background: var(--color-bg-subtle);">
              @for (p of ['Daily','Weekly','Monthly']; track p) {
                <button
                  class="text-xs px-3 py-1.5 rounded-lg transition-all duration-200 font-medium"
                  [style.background]="activePeriod() === p ? 'var(--color-primary)' : 'transparent'"
                  [style.color]="activePeriod() === p ? 'white' : 'var(--color-text-muted)'"
                  (click)="changePeriod(p)"
                >{{ p }}</button>
              }
            </div>
          </div>
          
          <!-- Dynamic Bar Chart Visual with Y-Axis -->
          <div class="flex h-36 gap-3">
            <!-- Y-Axis Labels -->
            <div class="flex flex-col justify-between text-[10px] text-neutral-400 h-full pb-1 flex-shrink-0 w-12 text-right">
              <span><i class="bi bi-currency-rupee"></i>{{ maxRevenue() >= 100000 ? (maxRevenue() / 100000 | number:'1.0-1') + 'L' : maxRevenue() >= 1000 ? (maxRevenue() / 1000 | number:'1.0-1') + 'K' : maxRevenue() }}</span>
              <span><i class="bi bi-currency-rupee"></i>{{ (maxRevenue() / 2) >= 100000 ? (maxRevenue() / 2 / 100000 | number:'1.0-1') + 'L' : (maxRevenue() / 2) >= 1000 ? (maxRevenue() / 2 / 1000 | number:'1.0-1') + 'K' : (maxRevenue() / 2) }}</span>
              <span><i class="bi bi-currency-rupee"></i>{{ 0 }}</span>
            </div>
            
            <!-- Chart Bars -->
            <div class="flex-1 flex items-end gap-1.5 h-full pl-2 overflow-x-auto relative border-l border-b border-neutral-100">
              @if (revenueData().length === 0) {
                <div class="w-full h-full flex items-center justify-center text-xs text-neutral-400">
                  No revenue records found for this period.
                </div>
              } @else {
                @for (bar of revenueData(); track $index) {
                  <div class="flex-1 min-w-[12px] max-w-[28px] h-full flex items-end justify-center relative group">
                    <div
                      class="w-full rounded-t-sm transition-all duration-200 bar-chart-item cursor-pointer"
                      [style.height.%]="bar.height"
                      [style.background]="'var(--gradient-primary)'"
                    ></div>
                    <!-- Tooltip -->
                    <div class="absolute bottom-full mb-2 hidden group-hover:flex flex-col items-center z-20">
                      <div class="bg-neutral-800 text-white text-[10px] py-1.5 px-2.5 rounded-xl shadow-lg whitespace-nowrap">
                        <div class="font-semibold">{{ bar.label }}</div>
                        <div class="font-bold text-primary-light mt-0.5"><i class="bi bi-currency-rupee"></i>{{ bar.revenue | number:'1.0-0' }}</div>
                        <div class="text-[9px] opacity-75">{{ bar.orders }} orders</div>
                      </div>
                      <div class="w-1.5 h-1.5 bg-neutral-800 rotate-45 -mt-1"></div>
                    </div>
                  </div>
                }
              }
            </div>
          </div>
          <div class="flex justify-between mt-2 text-[10px] pl-16" style="color: var(--color-text-muted);">
            <span>Start</span>
            <span>Middle</span>
            <span>End</span>
          </div>
          
          <div class="mt-4 flex items-center gap-6">
            <div>
              <div class="text-xs" style="color: var(--color-text-muted);">Total Revenue</div>
              <div class="font-bold text-lg" style="color: var(--color-primary-dark);"><i class="bi bi-currency-rupee"></i>{{ totalPeriodRevenue() | number:'1.0-0' }}</div>
            </div>
            <div class="w-px h-8" style="background: var(--color-border);"></div>
            <div>
              <div class="text-xs" style="color: var(--color-text-muted);">Avg/Transaction</div>
              <div class="font-bold text-base" style="color: var(--color-text);"><i class="bi bi-currency-rupee"></i>{{ avgPeriodRevenue() | number:'1.0-0' }}</div>
            </div>
            <div class="w-px h-8" style="background: var(--color-border);"></div>
            <div>
              <div class="text-xs" style="color: var(--color-text-muted);">Total Orders</div>
              <div class="font-bold text-base text-green-600">{{ totalPeriodOrders() }}</div>
            </div>
          </div>
        </div>

        <!-- Order Status Breakdown -->
        <div class="card p-6 lg:col-span-2">
          <h3 class="font-semibold text-base mb-1" style="color: var(--color-text);">Order Status</h3>
          <p class="text-xs mb-5" style="color: var(--color-text-muted);">Current order distribution</p>
          
          @if (orderStatuses().length === 0) {
            <div class="text-center py-12 text-neutral-400 text-xs">
              No orders found to analyze.
            </div>
          } @else {
            <div class="space-y-4">
              @for (status of orderStatuses(); track status.label) {
                <div>
                  <div class="flex justify-between text-sm mb-1.5">
                    <div class="flex items-center gap-2">
                      <span class="w-2.5 h-2.5 rounded-full flex-shrink-0" [style.background]="status.color"></span>
                      <span class="font-medium" style="color: var(--color-text);">{{ status.label }}</span>
                    </div>
                    <span style="color: var(--color-text-muted);">{{ status.count }} ({{ status.pct }}%)</span>
                  </div>
                  <div class="h-2 rounded-full overflow-hidden" style="background: var(--color-border);">
                    <div class="h-full rounded-full transition-all duration-700" [style.width.%]="status.pct" [style.background]="status.color"></div>
                  </div>
                </div>
              }
            </div>
          }

          <div class="mt-5 pt-4" style="border-top: 1px solid var(--color-border);">
            <div class="flex justify-between">
              <span class="text-sm" style="color: var(--color-text-muted);">Total Orders Analyzed</span>
              <span class="font-bold" style="color: var(--color-text);">{{ totalOrdersCount() }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Bottom Row: Recent Orders & Top Sellers -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <!-- Recent Orders -->
        <div class="card p-6 lg:col-span-2">
          <div class="flex items-center justify-between mb-5">
            <div>
              <h3 class="font-semibold text-base" style="color: var(--color-text);">Recent Orders</h3>
              <p class="text-xs mt-0.5" style="color: var(--color-text-muted);">Latest 5 transactions</p>
            </div>
            <a routerLink="/admin/orders" class="text-sm font-medium flex items-center gap-1 transition-colors" style="color: var(--color-primary);">
              View all
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
              </svg>
            </a>
          </div>

          <div class="w-full overflow-x-auto">
            <table class="w-full text-sm min-w-[600px]" aria-label="Recent orders table">
              <thead>
                <tr style="border-bottom: 1px solid var(--color-border);">
                  <th class="text-left pb-3 text-xs font-semibold uppercase tracking-wider" style="color: var(--color-text-muted);">Order ID</th>
                  <th class="text-left pb-3 text-xs font-semibold uppercase tracking-wider" style="color: var(--color-text-muted);">Customer</th>
                  <th class="text-left pb-3 text-xs font-semibold uppercase tracking-wider" style="color: var(--color-text-muted);">Date</th>
                  <th class="text-left pb-3 text-xs font-semibold uppercase tracking-wider" style="color: var(--color-text-muted);">Amount</th>
                  <th class="text-left pb-3 text-xs font-semibold uppercase tracking-wider" style="color: var(--color-text-muted);">Status</th>
                  <th class="text-right pb-3 text-xs font-semibold uppercase tracking-wider" style="color: var(--color-text-muted);">Action</th>
                </tr>
              </thead>
              <tbody>
                @if (recentOrders().length === 0) {
                  <tr>
                    <td colspan="6" class="text-center py-8 text-neutral-400">No orders logged in database.</td>
                  </tr>
                } @else {
                  @for (order of recentOrders(); track order.id) {
                    <tr class="table-row-hover" style="border-bottom: 1px solid var(--color-border);">
                      <td class="py-3 font-mono text-xs font-bold" style="color: var(--color-text-muted);">{{ order.id }}</td>
                      <td class="py-3 font-medium" style="color: var(--color-text);">{{ order.customer }}</td>
                      <td class="py-3 text-neutral-500 text-xs">{{ order.date }}</td>
                      <td class="py-3 font-semibold" style="color: var(--color-text);"><i class="bi bi-currency-rupee"></i>{{ order.amount | number:'1.0-0' }}</td>
                      <td class="py-3">
                        <span class="status-badge" [ngClass]="getStatusBadgeClass(order.status)">{{ order.status }}</span>
                      </td>
                      <td class="py-3 text-right">
                        <a [routerLink]="['/admin/orders']" [queryParams]="{search: order.id.replace('#', '')}" class="text-xs font-semibold hover:underline" style="color: var(--color-primary);">View</a>
                      </td>
                    </tr>
                  }
                }
              </tbody>
            </table>
          </div>
        </div>

        <!-- Top Sellers -->
        <div class="card p-6">
          <div class="flex items-center justify-between mb-5">
            <div>
              <h3 class="font-semibold text-base" style="color: var(--color-text);">Top Sellers</h3>
              <p class="text-xs mt-0.5" style="color: var(--color-text-muted);">Top 3 products by sales</p>
            </div>
            <a routerLink="/admin/products" class="text-sm font-medium flex items-center gap-1 transition-colors" style="color: var(--color-primary);">
              View all
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
              </svg>
            </a>
          </div>
          <div class="space-y-4">
            @if (topProducts().length === 0) {
              <div class="text-center py-12 text-neutral-400 text-xs">No top products data.</div>
            } @else {
              @for (prod of topProducts(); track prod.id) {
                <div class="flex items-center gap-3 p-2 rounded-xl transition-all duration-200 hover:bg-neutral-50 cursor-pointer" [routerLink]="['/admin/products']" [queryParams]="{search: prod.title}">
                  <img [src]="prod.images?.[0] || '/assets/placeholder-product.jpg'" [alt]="prod.title" class="w-12 h-12 object-cover rounded-xl bg-neutral-50 flex-shrink-0 border border-neutral-100" />
                  <div class="flex-1 min-w-0">
                    <div class="font-semibold text-sm truncate text-neutral-800">{{ prod.title }}</div>
                    <div class="text-xs text-neutral-400 mt-0.5">{{ prod.salesCount || 0 }} sales · <i class="bi bi-currency-rupee"></i>{{ prod.price | number:'1.0-0' }}</div>
                  </div>
                </div>
              }
            }
          </div>
        </div>
      </div>

      <!-- Quick Actions Grid -->
      <div class="card p-6">
        <h3 class="font-semibold text-base mb-1" style="color: var(--color-text);">Quick Actions</h3>
        <p class="text-xs mb-5" style="color: var(--color-text-muted);">Common tasks and shortcuts</p>
        <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
          @for (action of quickActions; track action.label) {
            <a [routerLink]="action.path"
               class="flex flex-col items-center text-center p-4 rounded-xl border border-neutral-100 transition-all duration-200 hover:-translate-y-1 hover:shadow-warm action-link bg-white">
              <span class="w-10 h-10 rounded-xl flex items-center justify-center mb-3" [style.background]="action.bg">
                <svg class="w-5 h-5" [style.color]="action.iconColor" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" [attr.d]="action.svgPath"/>
                </svg>
              </span>
              <div class="font-semibold text-xs text-neutral-800 mb-0.5">{{ action.label }}</div>
              <div class="text-[10px] text-neutral-400">{{ action.sub }}</div>
            </a>
          }
        </div>
      </div>
    </div>
  `,
})
export class AdminDashboardComponent implements OnInit {
  private http = inject(HttpClient);
  private cdr = inject(ChangeDetectorRef);

  readonly kpiCards = signal<any[]>([]);
  readonly activePeriod = signal('Daily');
  readonly revenueData = signal<any[]>([]);
  readonly maxRevenue = signal<number>(0);
  readonly totalPeriodRevenue = signal<number>(0);
  readonly avgPeriodRevenue = signal<number>(0);
  readonly totalPeriodOrders = signal<number>(0);
  readonly orderStatuses = signal<any[]>([]);
  readonly totalOrdersCount = signal<number>(0);
  readonly recentOrders = signal<any[]>([]);
  readonly topProducts = signal<any[]>([]);

  today = new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

  quickActions = [
    { label: 'Add Product', sub: 'Create new listing', path: '/admin/products/new', bg: 'var(--color-primary-light)', iconColor: 'var(--color-primary)', svgPath: 'M12 4v16m8-8H4' },
    { label: 'Manage Orders', sub: 'View pending orders', path: '/admin/orders', bg: 'var(--color-accent-light)', iconColor: 'var(--color-accent)', svgPath: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2' },
    { label: 'New Banner', sub: 'Upload hero banner', path: '/admin/banners', bg: '#F3E8FF', iconColor: 'var(--color-purple)', svgPath: 'M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z' },
    { label: 'Create Coupon', sub: 'Add discount code', path: '/admin/coupons', bg: '#E6FFFA', iconColor: 'var(--color-green)', svgPath: 'M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z' },
    { label: 'Low Stock', sub: 'Check inventory', path: '/admin/inventory', bg: '#FDF2F8', iconColor: 'var(--color-pink)', svgPath: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z' },
  ];

  ngOnInit() {
    this.loadDashboardOverview();
    this.loadRevenueChartData();
    this.loadOrderStatusBreakdown();
    this.loadRecentOrders();
    this.loadTopProducts();
  }

  changePeriod(p: string) {
    this.activePeriod.set(p);
    this.loadRevenueChartData();
  }

  private loadDashboardOverview() {
    this.http.get<any>(`${environment.apiUrl}/admin/dashboard`).subscribe({
      next: (res) => {
        const d = res?.data || {};
        // Backend returns flat fields: totalRevenue, totalOrders, totalCustomers, pendingOrders
        const revTotal = d.totalRevenue ?? 0;
        const totalRevFormatted = (revTotal >= 100000
          ? (revTotal / 100000).toFixed(1) + 'L'
          : revTotal >= 1000
            ? (revTotal / 1000).toFixed(1) + 'K'
            : revTotal.toLocaleString());

        this.kpiCards.set([
          {
            label: 'Total Revenue', value: totalRevFormatted, change: '12.5%', changePositive: true,
            iconBg: 'var(--color-primary-light)', iconColor: 'var(--color-primary)', progress: '72%', progressColor: 'var(--color-primary)',
            svgPath: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z'
          },
          {
            label: 'Total Orders', value: (d.totalOrders ?? 0).toLocaleString(), change: '8.3%', changePositive: true,
            iconBg: 'var(--color-accent-light)', iconColor: 'var(--color-accent)', progress: '55%', progressColor: 'var(--color-accent)',
            svgPath: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2'
          },
          {
            label: 'Total Customers', value: (d.totalCustomers ?? 0).toLocaleString(), change: '5.2%', changePositive: true,
            iconBg: '#E6FFFA', iconColor: 'var(--color-green)', progress: '68%', progressColor: 'var(--color-green)',
            svgPath: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z'
          },
          {
            label: 'Pending Orders', value: (d.pendingOrders ?? 0).toLocaleString(), change: '0%', changePositive: true,
            iconBg: '#FDF2F8', iconColor: 'var(--color-pink)', progress: '10%', progressColor: 'var(--color-pink)',
            svgPath: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01'
          },
        ]);
        this.cdr.markForCheck();
      },
      error: () => {
        this.kpiCards.set([
          { label: 'Total Revenue', value: '0', change: '0%', changePositive: true, iconBg: 'var(--color-primary-light)', iconColor: 'var(--color-primary)', progress: '0%', progressColor: 'var(--color-primary)', svgPath: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
          { label: 'Total Orders', value: '0', change: '0%', changePositive: true, iconBg: 'var(--color-accent-light)', iconColor: 'var(--color-accent)', progress: '0%', progressColor: 'var(--color-accent)', svgPath: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2' },
          { label: 'Total Customers', value: '0', change: '0%', changePositive: true, iconBg: '#E6FFFA', iconColor: 'var(--color-green)', progress: '0%', progressColor: 'var(--color-green)', svgPath: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z' },
          { label: 'Pending Orders', value: '0', change: '0%', changePositive: true, iconBg: '#FDF2F8', iconColor: 'var(--color-pink)', progress: '0%', progressColor: 'var(--color-pink)', svgPath: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01' },
        ]);
        this.cdr.markForCheck();
      }
    });
  }

  private loadRevenueChartData() {
    // Map UI period names to backend period params
    const periodMap: Record<string, string> = { 'Daily': '7d', 'Weekly': '30d', 'Monthly': '90d' };
    const periodParam = periodMap[this.activePeriod()] ?? '30d';

    this.http.get<any>(`${environment.apiUrl}/admin/analytics/revenue`, { params: { period: periodParam } }).subscribe({
      next: (res) => {
        const data: any[] = res.data || [];
        // Backend returns: { date: 'yyyy-MM-dd', revenue: number }
        const maxVal = data.length > 0 ? Math.max(...data.map(item => item.revenue ?? 0), 1) : 1;
        let total = 0;

        const mappedBars = data.map(item => {
          total += item.revenue ?? 0;
          // Format date label: show day/month only
          const dateLabel = item.date
            ? new Date(item.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })
            : '';
          return {
            label: dateLabel,
            revenue: item.revenue ?? 0,
            orders: item.orders ?? 0,
            height: maxVal > 0 ? Math.round(((item.revenue ?? 0) / maxVal) * 100) : 0
          };
        });

        this.maxRevenue.set(maxVal);
        this.revenueData.set(mappedBars);
        this.totalPeriodRevenue.set(total);
        this.totalPeriodOrders.set(mappedBars.reduce((s, b) => s + b.orders, 0));
        this.avgPeriodRevenue.set(mappedBars.filter(b => b.revenue > 0).length > 0
          ? total / mappedBars.filter(b => b.revenue > 0).length : 0);
        this.cdr.markForCheck();
      },
      error: () => {
        this.maxRevenue.set(0);
        this.revenueData.set([]);
        this.totalPeriodRevenue.set(0);
        this.totalPeriodOrders.set(0);
        this.avgPeriodRevenue.set(0);
        this.cdr.markForCheck();
      }
    });
  }

  private loadOrderStatusBreakdown() {
    const statusMap: Record<string, { label: string, color: string }> = {
      placed: { label: 'Placed', color: 'var(--color-teal)' },
      confirmed: { label: 'Confirmed', color: 'var(--color-orange)' },
      processing: { label: 'Processing', color: 'var(--color-purple)' },
      shipped: { label: 'Shipped', color: 'var(--color-teal)' },
      out_for_delivery: { label: 'Out for Delivery', color: 'var(--color-green)' },
      delivered: { label: 'Delivered', color: 'var(--color-green)' },
      cancelled: { label: 'Cancelled', color: 'var(--color-pink)' },
      return_requested: { label: 'Return Requested', color: 'var(--color-orange)' },
      returned: { label: 'Returned', color: 'var(--color-text-muted)' }
    };

    this.http.get<any>(`${environment.apiUrl}/admin/analytics/orders-breakdown`).subscribe({
      next: (res) => {
        const raw: any[] = res.data || [];
        const total = raw.reduce((sum, curr) => sum + (curr.count ?? 0), 0);

        // Backend returns { status: string, count: number } (not _id)
        const mappedStatuses = raw.map(item => {
          const key = (item.status ?? item._id ?? '').toLowerCase();
          const config = statusMap[key] || { label: key.toUpperCase(), color: 'var(--color-text-muted)' };
          return {
            label: config.label,
            count: item.count ?? 0,
            pct: total > 0 ? Math.round(((item.count ?? 0) / total) * 100) : 0,
            color: config.color
          };
        });

        this.orderStatuses.set(mappedStatuses);
        this.totalOrdersCount.set(total);
        this.cdr.markForCheck();
      },
      error: () => {
        this.orderStatuses.set([]);
        this.totalOrdersCount.set(0);
        this.cdr.markForCheck();
      }
    });
  }

  private loadRecentOrders() {
    this.http.get<any>(`${environment.apiUrl}/orders/admin/all`, { params: { page: 1, limit: 5 } }).subscribe({
      next: (res) => {
        const raw = res.data || [];
        const mapped = raw.map((o: any) => ({
          dbId: o.id || o._id,
          id: '#' + o.orderNumber,
          customer: o.shippingAddress?.fullName || 'Guest',
          amount: o.totalAmount,
          status: o.orderStatus ? o.orderStatus.charAt(0).toUpperCase() + o.orderStatus.slice(1).replace(/_/g, ' ') : 'Placed',
          date: o.createdAt ? new Date(o.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : ''
        }));
        this.recentOrders.set(mapped);
        this.cdr.markForCheck();
      },
      error: () => {
        this.recentOrders.set([]);
        this.cdr.markForCheck();
      }
    });
  }

  private loadTopProducts() {
    this.http.get<any>(`${environment.apiUrl}/admin/analytics/top-products`, { params: { limit: 3 } }).subscribe({
      next: (res) => {
        this.topProducts.set(res.data || []);
        this.cdr.markForCheck();
      },
      error: () => {
        this.topProducts.set([]);
        this.cdr.markForCheck();
      }
    });
  }

  getStatusBadgeClass(status: string): string {
    const s = status.toLowerCase().replace(/ /g, '_');
    return `status-${s}`;
  }

  getStatusClass(status: string): string {
    const s = status.toLowerCase().replace(/ /g, '_');
    const map: Record<string, string> = {
      delivered: 'bg-green-100 text-green-700',
      shipped: 'bg-blue-100 text-blue-700',
      out_for_delivery: 'bg-emerald-100 text-emerald-700',
      processing: 'bg-amber-100 text-amber-700',
      confirmed: 'bg-amber-100 text-amber-700',
      placed: 'bg-blue-50 text-blue-600',
      cancelled: 'bg-red-100 text-red-600',
    };
    return map[s] || 'bg-neutral-100 text-neutral-600';
  }
}
