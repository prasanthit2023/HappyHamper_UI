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
            <div class="text-2xl font-bold font-display mb-0.5" style="color: var(--color-text);">{{ card.value }}</div>
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
          
          <!-- Dynamic Bar Chart Visual -->
          <div class="flex items-end gap-1.5 h-36">
            @if (revenueData().length === 0) {
              <div class="w-full h-full flex items-center justify-center text-xs text-neutral-400">
                No revenue records found for this period.
              </div>
            } @else {
              @for (bar of revenueData(); track $index) {
                <div
                  class="flex-1 rounded-t-sm transition-opacity duration-200 bar-chart-item cursor-pointer"
                  [style.height.%]="bar.height"
                  [style.background]="'var(--gradient-primary)'"
                  [title]="bar.label + ': ₹' + (bar.revenue | number:'1.0-0') + ' (' + bar.orders + ' orders)'"
                ></div>
              }
            }
          </div>
          <div class="flex justify-between mt-2 text-xs" style="color: var(--color-text-muted);">
            <span>Start</span>
            <span>Middle</span>
            <span>End</span>
          </div>
          
          <div class="mt-4 flex items-center gap-6">
            <div>
              <div class="text-xs" style="color: var(--color-text-muted);">Total Revenue</div>
              <div class="font-bold text-lg" style="color: var(--color-primary-dark);">₹{{ totalPeriodRevenue() | number:'1.0-0' }}</div>
            </div>
            <div class="w-px h-8" style="background: var(--color-border);"></div>
            <div>
              <div class="text-xs" style="color: var(--color-text-muted);">Avg/Transaction</div>
              <div class="font-bold text-base" style="color: var(--color-text);">₹{{ avgPeriodRevenue() | number:'1.0-0' }}</div>
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

      <!-- Bottom Row -->
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

          <div class="overflow-x-auto">
            <table class="w-full text-sm" aria-label="Recent orders table">
              <thead>
                <tr style="border-bottom: 1px solid var(--color-border);">
                  <th class="text-left pb-3 text-xs font-semibold uppercase tracking-wider" style="color: var(--color-text-muted);">Order ID</th>
                  <th class="text-left pb-3 text-xs font-semibold uppercase tracking-wider" style="color: var(--color-text-muted);">Customer</th>
                  <th class="text-left pb-3 text-xs font-semibold uppercase tracking-wider" style="color: var(--color-text-muted);">Amount</th>
                  <th class="text-left pb-3 text-xs font-semibold uppercase tracking-wider" style="color: var(--color-text-muted);">Status</th>
                </tr>
              </thead>
              <tbody>
                @if (recentOrders().length === 0) {
                  <tr>
                    <td colspan="4" class="text-center py-8 text-neutral-400">No orders logged in database.</td>
                  </tr>
                } @else {
                  @for (order of recentOrders(); track order.id) {
                    <tr class="table-row-hover" style="border-bottom: 1px solid var(--color-border);">
                      <td class="py-3 font-mono text-xs font-bold" style="color: var(--color-text-muted);">{{ order.id }}</td>
                      <td class="py-3 font-medium" style="color: var(--color-text);">{{ order.customer }}</td>
                      <td class="py-3 font-semibold" style="color: var(--color-text);">₹{{ order.amount | number:'1.0-0' }}</td>
                      <td class="py-3">
                        <span class="badge text-xs" [ngClass]="getStatusClass(order.status)">{{ order.status }}</span>
                      </td>
                    </tr>
                  }
                }
              </tbody>
            </table>
          </div>
        </div>

        <!-- Quick Actions -->
        <div class="card p-6">
          <h3 class="font-semibold text-base mb-1" style="color: var(--color-text);">Quick Actions</h3>
          <p class="text-xs mb-5" style="color: var(--color-text-muted);">Common tasks</p>
          <div class="space-y-2">
            @for (action of quickActions; track action.label) {
              <a [routerLink]="action.path"
                 class="flex items-center gap-3 p-3 rounded-xl transition-all duration-200 group hover:-translate-y-0.5 action-link">
                <span class="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" [style.background]="action.bg">
                  <svg class="w-4 h-4" [style.color]="action.iconColor" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" [attr.d]="action.svgPath"/>
                  </svg>
                </span>
                <div class="flex-1 min-w-0">
                  <div class="font-medium text-sm" style="color: var(--color-text);">{{ action.label }}</div>
                  <div class="text-xs" style="color: var(--color-text-muted);">{{ action.sub }}</div>
                </div>
                <svg class="w-4 h-4 transition-transform group-hover:translate-x-0.5 flex-shrink-0" style="color: var(--color-primary);" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
                </svg>
              </a>
            }
          </div>
        </div>
      </div>
    </div>
  `,
})
export class AdminDashboardComponent implements OnInit {
  private http = inject(HttpClient);
  private cdr  = inject(ChangeDetectorRef);

  readonly kpiCards            = signal<any[]>([]);
  readonly activePeriod        = signal('Daily');
  readonly revenueData         = signal<any[]>([]);
  readonly totalPeriodRevenue  = signal<number>(0);
  readonly avgPeriodRevenue    = signal<number>(0);
  readonly totalPeriodOrders   = signal<number>(0);
  readonly orderStatuses       = signal<any[]>([]);
  readonly totalOrdersCount    = signal<number>(0);
  readonly recentOrders        = signal<any[]>([]);

  today = new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

  quickActions = [
    { label: 'Add Product',   sub: 'Create new listing',  path: '/admin/products/new', bg: 'var(--color-primary-light)', iconColor: 'var(--color-primary)', svgPath: 'M12 4v16m8-8H4' },
    { label: 'Manage Orders', sub: 'View pending orders', path: '/admin/orders',        bg: 'var(--color-accent-light)', iconColor: 'var(--color-accent)', svgPath: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2' },
    { label: 'New Banner',    sub: 'Upload hero banner',  path: '/admin/banners',       bg: '#F3E8FF', iconColor: 'var(--color-purple)', svgPath: 'M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z' },
    { label: 'Create Coupon', sub: 'Add discount code',   path: '/admin/coupons',       bg: '#E6FFFA', iconColor: 'var(--color-green)', svgPath: 'M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z' },
    { label: 'Low Stock',     sub: 'Check inventory',     path: '/admin/inventory',     bg: '#FDF2F8', iconColor: 'var(--color-pink)', svgPath: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z' },
  ];

  ngOnInit() {
    this.loadDashboardOverview();
    this.loadRevenueChartData();
    this.loadOrderStatusBreakdown();
    this.loadRecentOrders();
  }

  changePeriod(p: string) {
    this.activePeriod.set(p);
    this.loadRevenueChartData();
  }

  private loadDashboardOverview() {
    this.http.get<any>(`${environment.apiUrl}/admin/dashboard`).subscribe({
      next: (res) => {
        const d = res?.data || {};
        const revTotal = d.revenue?.total ?? 0;
        const totalRevFormatted = '₹' + (revTotal >= 100000 
          ? (revTotal / 100000).toFixed(1) + 'L' 
          : (revTotal / 1000).toFixed(1) + 'K');

        this.kpiCards.set([
          {
            label: 'Total Revenue', value: totalRevFormatted, change: '12.5%', changePositive: true,
            iconBg: 'var(--color-primary-light)', iconColor: 'var(--color-primary)', progress: '72%', progressColor: 'var(--color-primary)',
            svgPath: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z'
          },
          {
            label: 'Total Orders', value: (d.orders?.total ?? 0).toLocaleString(), change: '8.3%', changePositive: true,
            iconBg: 'var(--color-accent-light)', iconColor: 'var(--color-accent)', progress: '55%', progressColor: 'var(--color-accent)',
            svgPath: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2'
          },
          {
            label: 'Total Customers', value: (d.customers?.total ?? 0).toLocaleString(), change: '5.2%', changePositive: true,
            iconBg: '#E6FFFA', iconColor: 'var(--color-green)', progress: '68%', progressColor: 'var(--color-green)',
            svgPath: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z'
          },
          {
            label: 'Pending Returns', value: (d.pendingReturns ?? 0).toLocaleString(), change: '0%', changePositive: true,
            iconBg: '#FDF2F8', iconColor: 'var(--color-pink)', progress: '10%', progressColor: 'var(--color-pink)',
            svgPath: 'M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15'
          },
        ]);
        this.cdr.markForCheck();
      },
      error: () => {
        // Fallback static cards if API fails
        this.kpiCards.set([
          { label: 'Total Revenue', value: '₹0.0K', change: '0%', changePositive: true, iconBg: 'var(--color-primary-light)', iconColor: 'var(--color-primary)', progress: '0%', progressColor: 'var(--color-primary)', svgPath: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
          { label: 'Total Orders', value: '0', change: '0%', changePositive: true, iconBg: 'var(--color-accent-light)', iconColor: 'var(--color-accent)', progress: '0%', progressColor: 'var(--color-accent)', svgPath: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2' },
          { label: 'Total Customers', value: '0', change: '0%', changePositive: true, iconBg: '#E6FFFA', iconColor: 'var(--color-green)', progress: '0%', progressColor: 'var(--color-green)', svgPath: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z' },
          { label: 'Pending Returns', value: '0', change: '0%', changePositive: true, iconBg: '#FDF2F8', iconColor: 'var(--color-pink)', progress: '0%', progressColor: 'var(--color-pink)', svgPath: 'M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15' },
        ]);
        this.cdr.markForCheck();
      }
    });
  }

  private loadRevenueChartData() {
    const periodParam = this.activePeriod().toLowerCase(); // daily, weekly, monthly
    this.http.get<any>(`${environment.apiUrl}/admin/analytics/revenue`, { params: { period: periodParam, days: 30 } }).subscribe({
      next: (res) => {
        const data = res.data || [];
        const maxVal = Math.max(...data.map((item: any) => item.revenue), 1);
        let total = 0;
        let totalOrders = 0;

        const mappedBars = data.map((item: any) => {
          total += item.revenue;
          totalOrders += item.orders;
          return {
            label: item._id,
            revenue: item.revenue,
            orders: item.orders,
            height: Math.round((item.revenue / maxVal) * 100)
          };
        });

        this.revenueData.set(mappedBars);
        this.totalPeriodRevenue.set(total);
        this.totalPeriodOrders.set(totalOrders);
        this.avgPeriodRevenue.set(totalOrders > 0 ? total / totalOrders : 0);
        this.cdr.markForCheck();
      },
      error: () => {
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
        const raw = res.data || [];
        const total = raw.reduce((sum: number, curr: any) => sum + curr.count, 0);
        
        const mappedStatuses = raw.map((item: any) => {
          const config = statusMap[item._id] || { label: item._id.toUpperCase(), color: 'var(--color-text-muted)' };
          return {
            label: config.label,
            count: item.count,
            pct: total > 0 ? Math.round((item.count / total) * 100) : 0,
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
          id: '#' + o.orderNumber,
          customer: o.shippingAddress ? `${o.shippingAddress.firstName} ${o.shippingAddress.lastName}` : 'Guest',
          amount: o.totalAmount,
          status: o.orderStatus ? o.orderStatus.charAt(0).toUpperCase() + o.orderStatus.slice(1).replace(/_/g, ' ') : 'Placed'
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

  getStatusClass(status: string): string {
    const s = status.toLowerCase().replace(/ /g, '_');
    const map: Record<string, string> = {
      delivered:        'bg-green-100 text-green-700',
      shipped:          'bg-blue-100 text-blue-700',
      out_for_delivery: 'bg-emerald-100 text-emerald-700',
      processing:       'bg-amber-100 text-amber-700',
      confirmed:        'bg-amber-100 text-amber-700',
      placed:           'bg-blue-50 text-blue-600',
      cancelled:        'bg-red-100 text-red-600',
    };
    return map[s] || 'bg-neutral-100 text-neutral-600';
  }
}
