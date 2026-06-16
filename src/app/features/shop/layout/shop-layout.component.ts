import { Component, OnInit, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NavbarComponent } from '../../../shared/components/navbar/navbar.component';
import { CartDrawerComponent } from '../../../shared/components/cart-drawer/cart-drawer.component';
import { FooterComponent } from '../../../shared/components/footer/footer.component';
import { ToastComponent } from '../../../shared/components/toast/toast.component';
import { AuthStore } from '../../../state/auth.store';
import { CartStore } from '../../../state/cart.store';
import { WishlistStore } from '../../../state/wishlist.store';

@Component({
  selector: 'bb-shop-layout',
  standalone: true,
  imports: [RouterOutlet, NavbarComponent, CartDrawerComponent, FooterComponent, ToastComponent],
  template: `
    <div class="min-h-screen flex flex-col transition-colors duration-300" style="background: var(--color-bg);">
      <bb-navbar />
      <main class="flex-1 page-enter">
        <router-outlet />
      </main>
      <bb-footer />
      <bb-cart-drawer />
      <bb-toast />
    </div>
  `,
})
export class ShopLayoutComponent implements OnInit {
  private authStore     = inject(AuthStore);
  private cartStore     = inject(CartStore);
  private wishlistStore = inject(WishlistStore);

  ngOnInit() {
    // Wait for auth hydration to complete before loading user-specific data.
    // This prevents the cart/wishlist from not loading when the user is already
    // logged in on a fresh page load (tokens in localStorage).
    this.authStore.hydrationComplete.then((isLoggedIn) => {
      if (isLoggedIn || this.authStore.isLoggedIn()) {
        this.cartStore.loadCart().subscribe();
        this.wishlistStore.loadWishlist().subscribe();
      }
    });
  }
}
