import { useState } from 'react';
import SEO from '../shared/SEO';

export default function ContactPage() {
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <>
      <SEO title="Contact" description="Get in touch with the OwnChatGPTBusiness team. We are here to help." canonical="/contact" />

      <section className="bg-gradient-to-b from-green-50 to-white py-16">
        <div className="mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
          <h1 className="text-4xl font-bold text-gray-900">Get in touch</h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-gray-600">
            Have a question? We would love to hear from you. Send us a message and we will respond as soon as possible.
          </p>
        </div>
      </section>

      <section className="py-16">
        <div className="mx-auto max-w-lg px-4 sm:px-6 lg:px-8">
          {submitted ? (
            <div className="rounded-xl border border-green-200 bg-green-50 p-8 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
                <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="mt-4 text-lg font-semibold text-green-800">Message sent!</h2>
              <p className="mt-2 text-sm text-green-600">We will get back to you within 24 hours.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4" aria-label="Contact form">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="firstName" className="block text-sm font-medium text-gray-700">First name</label>
                  <input id="firstName" name="firstName" type="text" required aria-required="true" className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500" />
                </div>
                <div>
                  <label htmlFor="lastName" className="block text-sm font-medium text-gray-700">Last name</label>
                  <input id="lastName" name="lastName" type="text" required aria-required="true" className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500" />
                </div>
              </div>
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email</label>
                <input id="email" name="email" type="email" required aria-required="true" className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500" />
              </div>
              <div>
                <label htmlFor="company" className="block text-sm font-medium text-gray-700">Company</label>
                <input id="company" name="company" type="text" className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500" />
              </div>
              <div>
                <label htmlFor="message" className="block text-sm font-medium text-gray-700">Message</label>
                <textarea id="message" name="message" rows={5} required aria-required="true" className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500" />
              </div>
              <button type="submit" className="w-full rounded-xl bg-gradient-to-r from-green-500 to-emerald-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition-all hover:from-green-600 hover:to-emerald-700">
                Send message
              </button>
            </form>
          )}
        </div>
      </section>
    </>
  );
}
