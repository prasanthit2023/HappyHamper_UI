import { Component, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'bb-returns-policy',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="bb-container py-12 page-enter max-w-4xl mx-auto">
      <!-- Header -->
      <div class="text-center mb-12">
        <h1 class="font-display font-black text-3xl sm:text-4xl mb-3 text-neutral-900 dark:text-white">
          Return Policy – Newborn Baby & Kids Clothing
        </h1>
        <p class="text-neutral-500 text-sm sm:text-base max-w-xl mx-auto">
          At Happy Hamper, we want you to be happy with your purchase.
        </p>
      </div>

      <!-- Intro Card -->
      <div class="card p-6 sm:p-8 mb-8 bg-white dark:bg-neutral-800/40 border border-neutral-100 dark:border-neutral-700/60 rounded-3xl shadow-sm leading-relaxed text-sm text-neutral-700 dark:text-neutral-300">
        If you receive a product that is damaged, defective, or incorrect, you may request a return subject to the terms below.
      </div>

      <!-- Policy Grid -->
      <div class="space-y-6">
        <!-- 1. Eligibility -->
        <div class="card p-6 bg-white dark:bg-neutral-800/40 border border-neutral-100 dark:border-neutral-700/60 rounded-3xl shadow-sm">
          <h2 class="font-display font-bold text-lg mb-4 text-neutral-900 dark:text-white flex items-center gap-2">
            <span class="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold bg-primary-light text-primary">1</span>
            Eligibility for Return
          </h2>
          <p class="text-sm text-neutral-600 dark:text-neutral-400 mb-3">A return may be requested if:</p>
          <ul class="list-disc pl-5 space-y-2 text-sm text-neutral-700 dark:text-neutral-300">
            <li>The product received is damaged or defective.</li>
            <li>The wrong product, size, colour, or design was delivered.</li>
            <li>The product received is different from the product ordered.</li>
          </ul>
        </div>

        <!-- 2. Time Limit -->
        <div class="card p-6 bg-white dark:bg-neutral-800/40 border border-neutral-100 dark:border-neutral-700/60 rounded-3xl shadow-sm">
          <h2 class="font-display font-bold text-lg mb-4 text-neutral-900 dark:text-white flex items-center gap-2">
            <span class="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold bg-primary-light text-primary">2</span>
            Time Limit
          </h2>
          <p class="text-sm leading-relaxed text-neutral-700 dark:text-neutral-300">
            Return requests must be raised within <strong class="text-neutral-900 dark:text-white font-bold">7 days of delivery</strong>. Requests made after this period may not be accepted.
          </p>
        </div>

        <!-- 3. Product Condition -->
        <div class="card p-6 bg-white dark:bg-neutral-800/40 border border-neutral-100 dark:border-neutral-700/60 rounded-3xl shadow-sm">
          <h2 class="font-display font-bold text-lg mb-4 text-neutral-900 dark:text-white flex items-center gap-2">
            <span class="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold bg-primary-light text-primary">3</span>
            Product Condition
          </h2>
          <p class="text-sm text-neutral-600 dark:text-neutral-400 mb-3">To be eligible for return:</p>
          <ul class="list-disc pl-5 space-y-2 text-sm text-neutral-700 dark:text-neutral-300">
            <li>The product must be unused, unworn, and unwashed.</li>
            <li>All original tags, labels, and packaging should be intact.</li>
            <li>The product must be returned in its original condition.</li>
            <li>The product must not have any stains, odour, damage, or signs of use.</li>
          </ul>
        </div>

        <!-- 4. Proof Required -->
        <div class="card p-6 bg-white dark:bg-neutral-800/40 border border-neutral-100 dark:border-neutral-700/60 rounded-3xl shadow-sm">
          <h2 class="font-display font-bold text-lg mb-4 text-neutral-900 dark:text-white flex items-center gap-2">
            <span class="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold bg-primary-light text-primary">4</span>
            Proof Required
          </h2>
          <p class="text-sm text-neutral-600 dark:text-neutral-400 mb-3">For damaged, defective, or incorrect products, customers may be required to provide:</p>
          <ul class="list-disc pl-5 space-y-2 text-sm text-neutral-700 dark:text-neutral-300">
            <li>Clear photographs of the product.</li>
            <li>A video of the package opening, where applicable.</li>
            <li>The order details or order number.</li>
          </ul>
          <p class="text-xs text-neutral-400 mt-3 italic">This information may be required to verify the return request.</p>
        </div>

        <!-- 5. Wrong Size -->
        <div class="card p-6 bg-white dark:bg-neutral-800/40 border border-neutral-100 dark:border-neutral-700/60 rounded-3xl shadow-sm">
          <h2 class="font-display font-bold text-lg mb-4 text-neutral-900 dark:text-white flex items-center gap-2">
            <span class="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold bg-primary-light text-primary">5</span>
            Wrong Size
          </h2>
          <p class="text-sm leading-relaxed text-neutral-700 dark:text-neutral-300">
            Return for a wrong size ordered by the customer will be accepted <strong class="text-neutral-900 dark:text-white">only if</strong> the product is unused, unworn, unwashed, and available in the required size. Return is subject to stock availability.
          </p>
        </div>

        <!-- 6. Product Availability -->
        <div class="card p-6 bg-white dark:bg-neutral-800/40 border border-neutral-100 dark:border-neutral-700/60 rounded-3xl shadow-sm">
          <h2 class="font-display font-bold text-lg mb-4 text-neutral-900 dark:text-white flex items-center gap-2">
            <span class="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold bg-primary-light text-primary">6</span>
            Product Availability
          </h2>
          <p class="text-sm text-neutral-600 dark:text-neutral-400 mb-3">If the requested return product is unavailable, we may offer:</p>
          <ul class="list-disc pl-5 space-y-2 text-sm text-neutral-700 dark:text-neutral-300">
            <li>An alternative product of similar value; or</li>
            <li>Another suitable resolution at our discretion.</li>
          </ul>
        </div>

        <!-- 7. Shipping Charges -->
        <div class="card p-6 bg-white dark:bg-neutral-800/40 border border-neutral-100 dark:border-neutral-700/60 rounded-3xl shadow-sm">
          <h2 class="font-display font-bold text-lg mb-4 text-neutral-900 dark:text-white flex items-center gap-2">
            <span class="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold bg-primary-light text-primary">7</span>
            Shipping Charges
          </h2>
          <p class="text-sm leading-relaxed text-neutral-700 dark:text-neutral-300 space-y-3">
            <span>If the return is due to an error on our part, such as receiving a damaged, defective, or incorrect product, we will arrange the return according to our applicable shipping process.</span>
            <br/><br/>
            <span>For a customer-requested size or product change, <strong class="text-neutral-900 dark:text-white font-bold">additional shipping charges may apply</strong>.</span>
          </p>
        </div>

        <!-- 8. Non-Returnable Products -->
        <div class="card p-6 bg-white dark:bg-neutral-800/40 border border-neutral-100 dark:border-neutral-700/60 rounded-3xl shadow-sm">
          <h2 class="font-display font-bold text-lg mb-4 text-red-650 flex items-center gap-2">
            <span class="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold bg-red-50 text-red-500">8</span>
            Non-Returnable Products
          </h2>
          <p class="text-sm text-neutral-600 dark:text-neutral-400 mb-3">Products may not be eligible for return if:</p>
          <ul class="list-disc pl-5 space-y-2 text-sm text-neutral-700 dark:text-neutral-300">
            <li>They have been used, worn, washed, or altered.</li>
            <li>They are damaged due to improper use or care.</li>
            <li>They have stains, odour, or other signs of use.</li>
            <li>The product is damaged after delivery due to customer handling.</li>
            <li>The return request is made after the applicable time period.</li>
          </ul>
        </div>

        <!-- 9. Inspection and Approval -->
        <div class="card p-6 bg-white dark:bg-neutral-800/40 border border-neutral-100 dark:border-neutral-700/60 rounded-3xl shadow-sm">
          <h2 class="font-display font-bold text-lg mb-4 text-neutral-900 dark:text-white flex items-center gap-2">
            <span class="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold bg-primary-light text-primary">9</span>
            Inspection and Approval
          </h2>
          <p class="text-sm leading-relaxed text-neutral-700 dark:text-neutral-300">
            All return requests are subject to inspection and approval by Happy Hamper. We reserve the right to reject a return request if the product does not meet the conditions stated in this policy.
          </p>
        </div>

        <!-- 10. How to Request -->
        <div class="card p-6 sm:p-8 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-3xl shadow-sm text-center">
          <h2 class="font-display font-black text-xl mb-4 text-neutral-900 dark:text-white flex items-center justify-center gap-2">
            <span class="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold bg-primary text-white">10</span>
            How to Request a Return
          </h2>
          <p class="text-sm text-neutral-600 dark:text-neutral-400 mb-6 max-w-md mx-auto">
            To request a return, please contact our customer support team through the official contact channel and provide:
          </p>
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6 max-w-xl mx-auto">
            <div class="bg-white dark:bg-neutral-900 p-4 rounded-2xl border border-neutral-100 dark:border-neutral-700">
              <span class="text-xs font-bold text-neutral-400 block mb-1">STEP 1</span>
              <p class="text-sm font-bold text-neutral-700 dark:text-neutral-300">Order Number</p>
            </div>
            <div class="bg-white dark:bg-neutral-900 p-4 rounded-2xl border border-neutral-100 dark:border-neutral-700">
              <span class="text-xs font-bold text-neutral-400 block mb-1">STEP 2</span>
              <p class="text-sm font-bold text-neutral-700 dark:text-neutral-300">Reason for return</p>
            </div>
            <div class="bg-white dark:bg-neutral-900 p-4 rounded-2xl border border-neutral-100 dark:border-neutral-700">
              <span class="text-xs font-bold text-neutral-400 block mb-1">STEP 3</span>
              <p class="text-sm font-bold text-neutral-700 dark:text-neutral-300">Photos/Videos if required</p>
            </div>
          </div>
          <p class="text-xs text-neutral-400 max-w-sm mx-auto leading-relaxed">
            Our support team will review your request and provide further instructions. By placing an order with Happy Hamper, you agree to these Return Terms & Conditions.
          </p>
        </div>
      </div>
    </div>
  `,
})
export class ReturnsComponent {}
