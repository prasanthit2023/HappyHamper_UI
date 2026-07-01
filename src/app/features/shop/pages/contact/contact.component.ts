import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'bb-contact',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  template: `
    <div class="bb-container py-10 page-enter animate-fade-in">
      <!-- Hero Header -->
      <section class="rounded-3xl p-8 md:p-12 mb-10 text-center relative overflow-hidden" style="background: var(--gradient-pastel); border: 1px solid var(--color-border);">
        <div class="relative z-10 max-w-2xl mx-auto space-y-4">
          <span class="inline-block text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full bg-[var(--color-primary-light)] text-[var(--color-primary)]">
            Support Desk
          </span>
          <h1 class="font-display text-3xl md:text-5xl font-black tracking-tight" style="color: var(--color-text);">
            We'd Love to Hear From You
          </h1>
          <p class="text-sm md:text-base leading-relaxed" style="color: var(--color-text-muted);">
            Have a question about sizing, shipping, or returns? Or just want to say hello? Our team is always ready to assist you.
          </p>
        </div>
      </section>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-16">
        <!-- Contact Cards / Info Column -->
        <div class="lg:col-span-1 space-y-6">
          <h2 class="font-display font-bold text-xl uppercase tracking-wider mb-2" style="color: var(--color-text);">
            Contact Channels
          </h2>

          @for (card of contactChannels; track card.title) {
            <a
              [href]="card.link"
              target="_blank"
              class="card p-6 flex items-start gap-4 hover-lift bg-white transition-all hover:border-[var(--color-primary)] hover:shadow-md block focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
            >
              <div class="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0" style="background: var(--color-primary-light); color: var(--color-primary);">
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" [attr.d]="card.svgPath"/>
                </svg>
              </div>
              <div class="space-y-1 min-w-0">
                <h3 class="font-bold text-sm text-[var(--color-text)]">{{ card.title }}</h3>
                <p class="text-xs font-bold text-[var(--color-primary)] truncate">{{ card.detail }}</p>
                <p class="text-[11px] text-[var(--color-text-muted)] leading-tight">{{ card.subtext }}</p>
              </div>
            </a>
          }
        </div>

        <!-- Inquiry Form Column -->
        <div class="lg:col-span-2">
          <div class="card p-6 md:p-8 bg-white space-y-6">
            <div>
              <h2 class="font-display font-bold text-xl uppercase tracking-wider" style="color: var(--color-text);">
                Send a Message
              </h2>
              <p class="text-xs text-[var(--color-text-muted)]">
                Fill out the form below and we will get back to you within 24 hours.
              </p>
            </div>

            @if (submitted()) {
              <div class="bg-[var(--color-primary-light)] border border-[var(--color-primary)] border-opacity-20 text-[var(--color-text)] p-6 rounded-2xl text-center space-y-3 animate-scale-in">
                <div class="w-14 h-14 bg-white rounded-full flex items-center justify-center mx-auto shadow-sm border border-[var(--color-border)]">
                  <svg class="w-8 h-8 text-[var(--color-primary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"/>
                  </svg>
                </div>
                <h3 class="font-bold text-lg text-[var(--color-text)]">Message Sent Successfully!</h3>
                <p class="text-xs text-[var(--color-text-muted)] max-w-sm mx-auto">
                  Thank you for reaching out to Happy Hamper. One of our customer care executives will contact you shortly.
                </p>
                <button (click)="submitted.set(false)" class="btn-secondary py-2 px-6 text-xs mt-2 font-bold">
                  Send Another Message
                </button>
              </div>
            } @else {
              <form [formGroup]="contactForm" (ngSubmit)="onSubmit()" class="space-y-5" novalidate>
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <!-- First Name -->
                  <div class="floating-label-group">
                    <input
                      type="text"
                      id="firstName"
                      formControlName="firstName"
                      placeholder=" "
                      class="floating-label-input"
                      [class.border-red-400]="isInvalid('firstName')"
                    />
                    <label
                      for="firstName"
                      class="floating-label-text"
                    >
                      First Name *
                    </label>
                    @if (isInvalid('firstName')) {
                      <p class="text-red-500 text-[10px] mt-1 flex items-center gap-1 font-semibold" role="alert">
                        First name is required.
                      </p>
                    }
                  </div>

                  <!-- Last Name -->
                  <div class="floating-label-group">
                    <input
                      type="text"
                      id="lastName"
                      formControlName="lastName"
                      placeholder=" "
                      class="floating-label-input"
                      [class.border-red-400]="isInvalid('lastName')"
                    />
                    <label
                      for="lastName"
                      class="floating-label-text"
                    >
                      Last Name *
                    </label>
                    @if (isInvalid('lastName')) {
                      <p class="text-red-500 text-[10px] mt-1 flex items-center gap-1 font-semibold" role="alert">
                        Last name is required.
                      </p>
                    }
                  </div>
                </div>

                <!-- Mobile Number -->
                <div class="floating-label-group">
                  <input
                    type="tel"
                    id="phone"
                    formControlName="phone"
                    placeholder=" "
                    class="floating-label-input"
                    [class.border-red-400]="isInvalid('phone')"
                  />
                  <label
                    for="phone"
                    class="floating-label-text"
                  >
                    Mobile Number *
                  </label>
                  @if (isInvalid('phone')) {
                    <p class="text-red-500 text-[10px] mt-1 flex items-center gap-1 font-semibold" role="alert">
                      Please enter a valid mobile number (e.g. +919876543210).
                    </p>
                  }
                </div>

                <div class="floating-label-group">
                  <select
                    id="subject"
                    formControlName="subject"
                    class="floating-label-input cursor-pointer appearance-none"
                  >
                    <option value="General Inquiry">General Inquiry</option>
                    <option value="Order Support">Order Status & Support</option>
                    <option value="Returns & Refunds">Returns & Refunds</option>
                    <option value="Bulk Purchase">Bulk & Business Inquiries</option>
                    <option value="Other">Other Issues</option>
                  </select>
                  <label
                    for="subject"
                    class="floating-label-text"
                  >
                    Subject
                  </label>
                  <!-- Custom arrow for select -->
                  <div class="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-[var(--color-text-muted)]">
                    <svg class="fill-current h-4 w-4" viewBox="0 0 20 20">
                      <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/>
                    </svg>
                  </div>
                </div>

                <!-- Message -->
                <div class="floating-label-group">
                  <textarea
                    id="message"
                    formControlName="message"
                    rows="5"
                    placeholder=" "
                    class="floating-label-input"
                    [class.border-red-400]="isInvalid('message')"
                  ></textarea>
                  <label
                    for="message"
                    class="floating-label-text"
                  >
                    Message *
                  </label>
                  @if (isInvalid('message')) {
                    <p class="text-red-500 text-[10px] mt-1 flex items-center gap-1 font-semibold" role="alert">
                      Message must be at least 10 characters long.
                    </p>
                  }
                </div>

                <div class="pt-2">
                  <button type="submit" [disabled]="contactForm.invalid" class="btn-primary w-full py-3.5 text-sm font-bold shadow-warm">
                    Submit Inquiry
                  </button>
                </div>
              </form>
            }
          </div>
        </div>
      </div>

      <!-- FAQ Section -->
      <section class="max-w-4xl mx-auto space-y-8">
        <div class="text-center">
          <h2 class="section-title text-2xl md:text-3xl" style="color: var(--color-text);">Frequently Asked Questions</h2>
          <p class="section-subtitle text-sm" style="color: var(--color-text-muted);">Quick answers to common questions about ordering, delivery, and returns</p>
        </div>

        <div class="space-y-4">
          @for (faq of faqs; track faq.q; let idx = $index) {
            <div class="card bg-white overflow-hidden transition-all duration-200">
              <button
                (click)="toggleFaq(idx)"
                class="w-full px-6 py-4 flex items-center justify-between font-semibold text-sm md:text-base text-left transition-colors hover:bg-neutral-50"
                style="color: var(--color-text);"
              >
                <span>{{ faq.q }}</span>
                <svg
                  class="w-5 h-5 transition-transform duration-200"
                  [class.rotate-180]="openFaqIdx() === idx"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
                </svg>
              </button>
              <div
                class="transition-all duration-200"
                [class.max-h-0]="openFaqIdx() !== idx"
                [class.max-h-[300px]]="openFaqIdx() === idx"
                [class.border-t]="openFaqIdx() === idx"
                style="border-color: var(--color-border); overflow: hidden;"
              >
                <p class="px-6 py-4 text-xs md:text-sm leading-relaxed" style="color: var(--color-text-muted);">
                  {{ faq.a }}
                </p>
              </div>
            </div>
          }
        </div>
      </section>
    </div>
  `,
})
export class ContactComponent {
  private fb = inject(FormBuilder);

  submitted = signal<boolean>(false);
  openFaqIdx = signal<number | null>(null);

  contactForm = this.fb.group({
    firstName: ['', [Validators.required]],
    lastName: ['', [Validators.required]],
    phone: ['', [Validators.required, Validators.pattern(/^\+?[1-9]\d{6,14}$/)]],
    subject: ['General Inquiry', [Validators.required]],
    message: ['', [Validators.required, Validators.minLength(10)]],
  });

  contactChannels = [
    {
      title: 'Phone Support',
      detail: '+91 80 4567 8900',
      subtext: 'Mon - Sat: 9:00 AM - 6:00 PM IST',
      link: 'tel:+918045678900',
      svgPath: 'M3 5a2 2 0 012-2h3.28a1 1 0 01.94.725l.548 2.2a1 1 0 01-.321.988l-1.305.98a10.582 10.582 0 004.872 4.872l.98-1.305a1 1 0 01.988-.321l2.2.548a1 1 0 01.725.94V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z',
    },
    {
      title: 'WhatsApp Support',
      detail: '+91 80 4567 8901',
      subtext: 'We respond to messages instantly or within 2 hours.',
      link: 'https://wa.me/918045678901',
      svgPath: 'M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z',
    },
    {
      title: 'Our Headquarters',
      detail: 'Happy Hamper, Bengaluru',
      subtext: 'No 45, Residency Road, Bengaluru, KA - 560025',
      link: 'https://maps.google.com/?q=No+45,+Residency+Road,+Bengaluru,+KA+-+560025',
      svgPath: 'M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z M15 11a3 3 0 11-6 0 3 3 0 016 0z',
    },
  ];

  faqs = [
    {
      q: 'Do you use 100% organic cotton for Happy Hamper products?',
      a: 'Yes! All Happy Hamper products (Jablas, Nappies, Swaddles) are made from 100% GOTS-certified organic cotton. It is ultra-soft, highly breathable, and completely safe for your baby\'s sensitive skin.',
    },
    {
      q: 'How long does shipping take?',
      a: 'We process orders within 1-2 business days. Delivery typically takes 3-5 business days for major cities across India and 5-7 business days for other regions. Shipping is free on all orders above \u20B9499.',
    },
    {
      q: 'What is your return and exchange policy?',
      a: 'We offer a 7-day hassle-free return policy for unused, unwashed clothes in their original packaging. You can easily request a return or size exchange directly from your customer dashboard under "My Orders".',
    },
    {
      q: 'Can I cancel or modify my order?',
      a: 'You can cancel your order directly from your order tracking screen as long as the status is "placed" (not yet processed or shipped). If you need to make changes to the delivery address, please contact support via WhatsApp immediately.',
    },
  ];

  isInvalid(controlName: string) {
    const control = this.contactForm.get(controlName);
    return !!control && control.invalid && (control.dirty || control.touched);
  }

  toggleFaq(idx: number) {
    this.openFaqIdx.update((current) => (current === idx ? null : idx));
  }

  onSubmit() {
    if (this.contactForm.invalid) {
      this.contactForm.markAllAsTouched();
      return;
    }

    this.submitted.set(true);
    this.contactForm.reset({
      firstName: '',
      lastName: '',
      phone: '',
      subject: 'General Inquiry',
      message: '',
    });
  }
}
