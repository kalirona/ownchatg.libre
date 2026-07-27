import SEO from '../shared/SEO';

const categories = [
  {
    title: 'Getting Started',
    items: [
      { q: 'How do I sign up?', a: 'Click "Get Started" and create your account with your work email. You will be up and running in under 2 minutes.' },
      { q: 'Is there a free trial?', a: 'Yes, we offer a 14-day free trial on all plans. No credit card required.' },
      { q: 'Can I invite my team?', a: 'Yes, you can invite team members from the workspace settings. They will receive an email invitation.' },
    ],
  },
  {
    title: 'Billing & Plans',
    items: [
      { q: 'What payment methods do you accept?', a: 'We accept all major credit cards (Visa, Mastercard, Amex), PayPal, and wire transfers for Enterprise plans.' },
      { q: 'Can I change my plan?', a: 'Yes, you can upgrade or downgrade at any time. Changes take effect immediately.' },
      { q: 'What happens when I downgrade?', a: 'Your access is adjusted to match the new plan limits. No data is lost, and you can upgrade again anytime.' },
    ],
  },
  {
    title: 'Security & Compliance',
    items: [
      { q: 'Is my data encrypted?', a: 'Yes, all data is encrypted at rest (AES-256) and in transit (TLS 1.3).' },
      { q: 'Are you SOC 2 certified?', a: 'Yes, we are SOC 2 Type II certified with zero findings in our latest audit.' },
      { q: 'Where is my data stored?', a: 'Data is stored in US-based data centers by default. Enterprise plans can configure data residency in EU, APAC, or other regions.' },
    ],
  },
  {
    title: 'Technical',
    items: [
      { q: 'Which AI models do you support?', a: 'We support GPT-4o, GPT-4 Turbo, Claude 4, Gemini 2.5, and many open-source models including Llama and Mistral.' },
      { q: 'Do you have an API?', a: 'Yes, we provide a comprehensive REST API and WebSocket support for real-time streaming.' },
      { q: 'Can I use my own API keys?', a: 'Yes, you can bring your own API keys for supported providers. This is especially popular with Enterprise customers.' },
    ],
  },
];

export default function FAQPage() {
  return (
    <>
      <SEO title="FAQ" description="Frequently asked questions about OwnChatGPTBusiness - plans, security, technical, and more." canonical="/faq" />

      <section className="bg-gradient-to-b from-green-50 to-white py-16">
        <div className="mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
          <h1 className="text-4xl font-bold text-gray-900">Frequently asked questions</h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-gray-600">
            Everything you need to know about OwnChatGPTBusiness.
          </p>
        </div>
      </section>

      <section className="py-16">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="space-y-12">
            {categories.map((cat) => (
              <div key={cat.title}>
                <h2 className="mb-6 text-xl font-bold text-gray-900">{cat.title}</h2>
                <div className="space-y-3">
                  {cat.items.map((item, i) => (
                    <details key={i} className="group rounded-xl border border-gray-200 bg-white">
                      <summary className="flex cursor-pointer items-center justify-between px-6 py-4 text-sm font-medium text-gray-900">
                        {item.q}
                        <svg className="h-4 w-4 shrink-0 text-gray-500 transition-transform group-open:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </summary>
                      <div className="px-6 pb-4 text-sm text-gray-600">{item.a}</div>
                    </details>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
