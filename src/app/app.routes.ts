import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { adminGuard } from './core/guards/admin.guard';

export const routes: Routes = [
  // ─── Public Shop Routes ────────────────────────────────
  {
    path: '',
    loadComponent: () =>
      import('./features/shop/layout/shop-layout.component').then((m) => m.ShopLayoutComponent),
    children: [
      {
        path: '',
        pathMatch: 'full',
        redirectTo: 'products',
      },
      {
        path: 'products',
        title: 'Shop All Products – Happy Hamper',
        loadComponent: () =>
          import('./features/shop/pages/product-listing/product-listing.component').then(
            (m) => m.ProductListingComponent,
          ),
      },
      {
        path: 'products/:slug',
        title: 'Product Details – Happy Hamper',
        loadComponent: () =>
          import('./features/shop/pages/product-detail/product-detail.component').then(
            (m) => m.ProductDetailComponent,
          ),
      },
      {
        path: 'category/:slug',
        title: 'Category – Happy Hamper',
        loadComponent: () =>
          import('./features/shop/pages/product-listing/product-listing.component').then(
            (m) => m.ProductListingComponent,
          ),
      },
      {
        path: 'search',
        title: 'Search – Happy Hamper',
        loadComponent: () =>
          import('./features/shop/pages/search-results/search-results.component').then(
            (m) => m.SearchResultsComponent,
          ),
      },
      {
        path: 'cart',
        title: 'Shopping Cart – Happy Hamper',
        loadComponent: () =>
          import('./features/shop/pages/cart/cart.component').then((m) => m.CartComponent),
      },
      {
        path: 'checkout',
        title: 'Checkout – Happy Hamper',
        canActivate: [authGuard],
        loadComponent: () =>
          import('./features/shop/pages/checkout/checkout.component').then(
            (m) => m.CheckoutComponent,
          ),
      },
      {
        path: 'checkout/success',
        title: 'Order Confirmed – Happy Hamper',
        canActivate: [authGuard],
        loadComponent: () =>
          import('./features/shop/pages/order-success/order-success.component').then(
            (m) => m.OrderSuccessComponent,
          ),
      },
      {
        path: 'contact',
        title: 'Contact Us – Happy Hamper',
        loadComponent: () =>
          import('./features/shop/pages/contact/contact.component').then(
            (m) => m.ContactComponent,
          ),
      },
    ],
  },

  // ─── Auth Routes ───────────────────────────────────────
  {
    path: 'auth',
    loadComponent: () =>
      import('./features/auth/auth-layout/auth-layout.component').then(
        (m) => m.AuthLayoutComponent,
      ),
    children: [
      {
        path: 'login',
        title: 'Sign In – Happy Hamper',
        loadComponent: () =>
          import('./features/auth/pages/login/login.component').then((m) => m.LoginComponent),
      },
      {
        path: 'register',
        title: 'Create Account – Happy Hamper',
        loadComponent: () =>
          import('./features/auth/pages/register/register.component').then(
            (m) => m.RegisterComponent,
          ),
      },
      {
        path: 'verify-otp',
        title: 'Verify Mobile Number – Happy Hamper',
        loadComponent: () =>
          import('./features/auth/pages/verify-otp/verify-otp.component').then(
            (m) => m.VerifyOtpComponent,
          ),
      },
      {
        path: 'forgot-password',
        title: 'Forgot Password – Happy Hamper',
        loadComponent: () =>
          import('./features/auth/pages/forgot-password/forgot-password.component').then(
            (m) => m.ForgotPasswordComponent,
          ),
      },
      {
        path: 'callback',
        loadComponent: () =>
          import('./features/auth/pages/oauth-callback/oauth-callback.component').then(
            (m) => m.OAuthCallbackComponent,
          ),
      },
    ],
  },

  // ─── Customer Account Routes ───────────────────────────
  {
    path: 'account',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/account/profile-layout/profile-layout.component').then(
        (m) => m.ProfileLayoutComponent,
      ),
    children: [
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full',
      },
      {
        path: 'dashboard',
        title: 'My Account – Happy Hamper',
        loadComponent: () =>
          import('./features/account/pages/dashboard/account-dashboard.component').then(
            (m) => m.AccountDashboardComponent,
          ),
      },
      {
        path: 'orders',
        title: 'My Orders – Happy Hamper',
        loadComponent: () =>
          import('./features/account/pages/orders/orders.component').then(
            (m) => m.OrdersComponent,
          ),
      },
      {
        path: 'orders/:id',
        title: 'Order Details – Happy Hamper',
        loadComponent: () =>
          import('./features/account/pages/order-detail/order-detail.component').then(
            (m) => m.OrderDetailComponent,
          ),
      },
      {
        path: 'wishlist',
        title: 'My Wishlist – Happy Hamper',
        loadComponent: () =>
          import('./features/account/pages/wishlist/wishlist.component').then(
            (m) => m.WishlistComponent,
          ),
      },
      {
        path: 'addresses',
        title: 'My Addresses – Happy Hamper',
        loadComponent: () =>
          import('./features/account/pages/addresses/addresses.component').then(
            (m) => m.AddressesComponent,
          ),
      },
      {
        path: 'profile',
        title: 'Edit Profile – Happy Hamper',
        loadComponent: () =>
          import('./features/account/pages/profile-edit/profile-edit.component').then(
            (m) => m.ProfileEditComponent,
          ),
      },
      {
        path: 'notifications',
        title: 'Notifications – Happy Hamper',
        loadComponent: () =>
          import('./features/account/pages/notifications/notifications.component').then(
            (m) => m.NotificationsComponent,
          ),
      },
    ],
  },

  // ─── Admin Dashboard Routes ────────────────────────────
  {
    path: 'admin',
    canActivate: [adminGuard],
    loadComponent: () =>
      import('./features/admin/admin-layout/admin-layout.component').then(
        (m) => m.AdminLayoutComponent,
      ),
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      {
        path: 'dashboard',
        title: 'Admin Dashboard – Happy Hamper',
        loadComponent: () =>
          import('./features/admin/pages/dashboard/admin-dashboard.component').then(
            (m) => m.AdminDashboardComponent,
          ),
      },
      {
        path: 'products',
        title: 'Products – Admin',
        loadComponent: () =>
          import('./features/admin/pages/products/admin-products.component').then(
            (m) => m.AdminProductsComponent,
          ),
      },
      {
        path: 'products/new',
        title: 'Add Product – Admin',
        loadComponent: () =>
          import('./features/admin/pages/product-form/product-form.component').then(
            (m) => m.ProductFormComponent,
          ),
      },
      {
        path: 'products/:id/edit',
        title: 'Edit Product – Admin',
        loadComponent: () =>
          import('./features/admin/pages/product-form/product-form.component').then(
            (m) => m.ProductFormComponent,
          ),
      },
      {
        path: 'categories',
        title: 'Categories – Admin',
        loadComponent: () =>
          import('./features/admin/pages/categories/admin-categories.component').then(
            (m) => m.AdminCategoriesComponent,
          ),
      },
      {
        path: 'orders',
        title: 'Orders – Admin',
        loadComponent: () =>
          import('./features/admin/pages/orders/admin-orders.component').then(
            (m) => m.AdminOrdersComponent,
          ),
      },
      {
        path: 'inventory',
        title: 'Inventory – Admin',
        loadComponent: () =>
          import('./features/admin/pages/inventory/admin-inventory.component').then(
            (m) => m.AdminInventoryComponent,
          ),
      },
      {
        path: 'customers',
        title: 'Customers – Admin',
        loadComponent: () =>
          import('./features/admin/pages/customers/admin-customers.component').then(
            (m) => m.AdminCustomersComponent,
          ),
      },
      {
        path: 'coupons',
        title: 'Coupons – Admin',
        loadComponent: () =>
          import('./features/admin/pages/coupons/admin-coupons.component').then(
            (m) => m.AdminCouponsComponent,
          ),
      },
      {
        path: 'banners',
        title: 'Banners – Admin',
        loadComponent: () =>
          import('./features/admin/pages/banners/admin-banners.component').then(
            (m) => m.AdminBannersComponent,
          ),
      },
      {
        path: 'returns',
        title: 'Returns – Admin',
        loadComponent: () =>
          import('./features/admin/pages/returns/admin-returns.component').then(
            (m) => m.AdminReturnsComponent,
          ),
      },
    ],
  },

  // ─── Fallback ──────────────────────────────────────────
  {
    path: '**',
    title: 'Page Not Found – Happy Hamper',
    loadComponent: () =>
      import('./shared/components/not-found/not-found.component').then(
        (m) => m.NotFoundComponent,
      ),
  },
];
