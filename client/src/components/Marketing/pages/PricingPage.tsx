import { Link } from 'react-router-dom';
import SEO from '../shared/SEO';

const plans = [
  {
    name: 'Starter',
    price: '$29',
    period: '/month',
    desc: 'For small teams getting started with AI chat.',
    features: [
      'Up to 5 team members',
      'All AI models included',
      '1GB knowledge base storage',
      'Basic analytics',
      'Email support',
      'Community access',
    ],
    cta: 'Start Free Trial',
    popular: false,
  },
  {
    name: 'Professional',
    price: '$99',
    period: '/month',
    desc: 'For growing teams that need more power and control.',
    features: [
      'Up to 25 team members',
      'Priority model access',
      '10GB knowledge base storage',
      'Advanced analytics & reporting',
      'SSO / SAML',
      'Priority support',
      'API access',
      'Custom integrations',
    ],
    cta: 'Start Free Trial',
    popular: true,
  },
  {
    name: 'Enterprise',
    price: 'Custom',
    period: '',
    desc: 'For large organizations with advanced requirements.',
    features: [
      'Unlimited team members',
      'Dedicated infrastructure',
      'Unlimited knowledge base',
      'Custom AI model fine-tuning',
      'SOC 2 compliance',
      'Dedicated account manager',
      'SLA guarantee',
      'On-premise deployment',
      'Custom contract & invoicing',
    ],
    cta: 'Contact Sales',
    popular: false,
  },
];

const faqs = [
  { q: 'Can I upgrade or downgrade my plan?', a: 'Yes, you can upgrade or downgrade at any time. Changes take effect immediately.' },
  { q: 'Is there a free trial?', a: 'Yes, we offer a 14-day free trial on all plans. No credit card required.' },
  { q: 'What payment methods do you accept?', a: 'We accept all major credit cards, PayPal, and wire transfers for Enterprise plans.' },
  { q: 'Can I cancel my subscription?', a: 'You can cancel anytime. Your access continues until the end of the billing period.' },
  { q: 'Do you offer discounts for nonprofits?', a: 'Yes, we offer special pricing for nonprofit organizations. Contact our sales team.' },
  { q: 'Is my data secure?', a: 'Absolutely. We are SOC 2 Type II certified and use enterprise-grade encryption at rest and in transit.' },
];

export default function PricingPage() {
  return (
    <>
      <SEO title="Pricing" description="Simple, transparent pricing for teams of all sizes. Start free, scale as you grow." canonical="/pricing"
        structuredData={{
          '@context': 'https://schema.org',
          '@type': 'Product',
          name: 'OwnChatGPTBusiness Pricing',
          offers: plans.map((p) => ({
            '@type': 'Offer',
            name: p.name,
            price: p.price.replace('$', ''),
            priceCurrency: 'USD',
            description: p.desc,
          })),
        }}
      />

      <section className="bg-gradient-to-b from-green-50 to-white py-16">
        <div className="mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
          <h1 className="text-4xl font-bold text-gray-900">Simple, transparent pricing</h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-gray-600">
            Start free. Scale as you grow. No hidden fees.
          </p>
        </div>
      </section>

      <section className="-mt-8 pb-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {plans.map((plan) => (
              <div
                key={plan.name}
                className={`relative rounded-2xl border bg-white p-8 shadow-sm ${
                  plan.popular ? 'border-green-500 ring-2 ring-green-500' : 'border-gray-200'
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-r from-green-500 to-emerald-600 px-4 py-1 text-xs font-semibold text-white">
                    Most Popular
                  </div>
                )}
                <h2 className="text-lg font-semibold text-gray-900">{plan.name}</h2>
                <p className="mt-1 text-sm text-gray-500">{plan.desc}</p>
                <div className="mt-4 flex items-baseline gap-1">
                  <span className="text-4xl font-bold text-gray-900">{plan.price}</span>
                  <span className="text-sm text-gray-500">{plan.period}</span>
                </div>
                <ul className="mt-6 space-y-3">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm text-gray-600">
                      <svg className="h-4 w-4 shrink-0 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      {f}
                    </li>
                  ))}
                </ul>
                <Link
                  to={plan.name === 'Enterprise' ? '/contact' : '/register'}
                  className={`mt-8 block w-full rounded-xl py-3 text-center text-sm font-semibold shadow-sm transition-all ${
                    plan.popular
                      ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white hover:from-green-600 hover:to-emerald-700'
                      : 'border border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {plan.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-gray-50 py-20">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-center text-2xl font-bold text-gray-900">Frequently asked questions</h2>
          <div className="mt-8 space-y-4">
            {faqs.map((faq) => (
              <details key={faq.q} className="group rounded-xl border border-gray-200 bg-white">
                <summary className="flex cursor-pointer items-center justify-between px-6 py-4 text-sm font-medium text-gray-900">
                  {faq.q}
                  <svg className="h-4 w-4 text-gray-500 transition-transform group-open:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </summary>
                <div className="px-6 pb-4 text-sm text-gray-600">{faq.a}</div>
              </details>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
