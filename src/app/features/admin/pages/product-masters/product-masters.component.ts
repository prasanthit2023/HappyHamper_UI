import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PermissionStore } from '../../../../state/permission.store';
import { AdminCategoriesComponent } from '../categories/admin-categories.component';
import { AdminBrandsComponent } from '../brands/admin-brands.component';
import { AdminSizesComponent } from '../sizes/admin-sizes.component';

interface Tab {
  id: string;
  label: string;
  icon: string;
  permission: string;
}

@Component({
  selector: 'bb-product-masters',
  standalone: true,
  imports: [
    CommonModule,
    AdminCategoriesComponent,
    AdminBrandsComponent,
    AdminSizesComponent
  ],
  template: `
    <div class="space-y-6 page-enter animate-fade-in max-w-6xl mx-auto px-2">
      <!-- Header -->
      <div class="flex flex-col md:flex-row md:items-center md:justify-between border-b border-beige pb-4 gap-2">
        <div>
          <h1 class="text-2xl font-bold font-display text-neutral-800 dark:text-white">Product Masters</h1>
          <p class="text-xs text-neutral-500 mt-1">
            Manage product configuration details such as categories, brands, and sizing parameters.
          </p>
        </div>
      </div>

      <!-- Tabs Bar -->
      <div class="flex border-b border-beige overflow-x-auto scrollbar-none">
        @for (tab of availableTabs(); track tab.id) {
          <button
            (click)="activeTab.set(tab.id)"
            class="py-3 px-6 text-xs font-bold whitespace-nowrap transition-all border-b-2 outline-none flex items-center gap-1.5"
            [class.border-primary]="activeTab() === tab.id"
            [class.text-primary]="activeTab() === tab.id"
            [class.border-transparent]="activeTab() !== tab.id"
            [class.text-neutral-400]="activeTab() !== tab.id"
          >
            <span>{{ tab.icon }}</span>
            {{ tab.label }}
          </button>
        }
      </div>

      <!-- Tab Content Area -->
      <div class="mt-4">
        @if (activeTab() === 'categories' && hasAccess('Categories')) {
          <bb-admin-categories></bb-admin-categories>
        } @else if (activeTab() === 'brands' && hasAccess('Brands')) {
          <bb-admin-brands></bb-admin-brands>
        } @else if (activeTab() === 'sizes' && hasAccess('Sizes')) {
          <bb-admin-sizes></bb-admin-sizes>
        } @else {
          <div class="card p-12 text-center text-neutral-400">
            <i class="pi pi-lock text-3xl mb-2"></i>
            <div class="font-bold">Access Denied</div>
            <div class="text-xs mt-1">You do not have permission to view this master tab.</div>
          </div>
        }
      </div>
    </div>
  `
})
export class ProductMastersComponent implements OnInit {
  private readonly permissionStore = inject(PermissionStore);

  readonly allTabs: Tab[] = [
    { id: 'categories', label: 'Categories', icon: '🏷️', permission: 'Categories' },
    { id: 'brands', label: 'Brands', icon: '🏢', permission: 'Brands' },
    { id: 'sizes', label: 'Sizes', icon: '📏', permission: 'Sizes' }
  ];

  readonly availableTabs = computed(() => {
    return this.allTabs.filter(tab => this.hasAccess(tab.permission));
  });

  readonly activeTab = signal<string>('');

  ngOnInit() {
    // Set the first available tab as active
    const available = this.availableTabs();
    if (available.length > 0) {
      this.activeTab.set(available[0].id);
    }
  }

  hasAccess(menuName: string): boolean {
    return this.permissionStore.canAccess(menuName, 'view');
  }
}
