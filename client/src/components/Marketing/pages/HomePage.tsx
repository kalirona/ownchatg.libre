import { Link } from 'react-router-dom';
import SEO from '../shared/SEO';

const features = [
  { icon: '🤖', title: 'AI-Powered Chat', desc: 'Multi-model AI chat with GPT-4, Claude, Gemini and more.' },
  { icon: '🛡️', title: 'Enterprise Security', desc: 'SOC 2 compliant, end-to-end encryption, SSO, and audit logs.' },
  { icon: '🧠', title: 'Knowledge Base', desc: 'Upload documents and chat with your data using RAG.' },
  { icon: '🎨', title: 'Image & Video Gen', desc: 'Generate images and videos with leading AI models.' },
  { icon: '🔌', title: 'Integrations', desc: 'Connect Slack, Discord, Zapier, and 100+ tools.' },
  { icon: '📊', title: 'Analytics & Insights', desc: 'Track usage, costs, and team performance.' },
];

const testimonials = [
  { quote: 'Transformed our customer support. Response time dropped by 80%.', author: 'Sarah Chen', role: 'CTO, TechFlow Inc.' },
  { quote: 'The knowledge base feature alone saved us thousands of hours.', author: 'Marcus Johnson', role: 'Head of Product, DataSync' },
  { quote: 'Enterprise-grade security without the enterprise complexity.', author: 'Emily Rodriguez', role: 'CISO, FinSecure' },
];

export default function HomePage() {
  return (
    <>
      <SEO title="Enterprise AI Chat Platform" />

      <section className="relative overflow-hidden bg-gradient-to-b from-green-50 via-white to-white">
        <div className="mx-auto max-w-7xl px-4 pb-20 pt-16 sm:px-6 lg:px-8 lg:pb-28 lg:pt-24">
          <div className="text-center">
            <div className="mb-6 inline-flex items-center rounded-full border border-green-200 bg-green-50 px-4 py-1 text-xs font-medium text-green-700">
              Now supporting GPT-4o, Claude 4, Gemini 2.5 and more
            </div>
            <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl md:text-6xl">
              AI Chat Platform
              <br />
              <span className="bg-gradient-to-r from-green-500 to-emerald-600 bg-clip-text text-transparent">Built for Business</span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg text-gray-600">
              Deploy secure, customizable AI chat experiences for your team. Multi-model support, enterprise security, and deep integrations out of the box.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link
                to="/register"
                className="rounded-xl bg-gradient-to-r from-green-500 to-emerald-600 px-8 py-3.5 text-base font-semibold text-white shadow-lg transition-all hover:from-green-600 hover:to-emerald-700 hover:shadow-xl"
              >
                Start Free Trial
              </Link>
              <Link
                to="/contact"
                className="rounded-xl border border-gray-300 bg-white px-8 py-3.5 text-base font-semibold text-gray-700 transition-all hover:bg-gray-50"
              >
                Talk to Sales
              </Link>
            </div>
            <p className="mt-4 text-xs text-gray-400">No credit card required. 14-day free trial.</p>
          </div>
        </div>
        <div className="absolute -bottom-2 left-0 right-0 h-32 bg-gradient-to-t from-white to-transparent" />
      </section>

      <section className="py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-gray-900">Everything your team needs</h2>
            <p className="mt-4 text-lg text-gray-600">One platform for all your AI communications.</p>
          </div>
          <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((f) => (
              <div key={f.title} className="group rounded-xl border border-gray-200 bg-white p-6 transition-all hover:border-green-200 hover:shadow-lg">
                <span className="text-3xl">{f.icon}</span>
                <h3 className="mt-4 text-lg font-semibold text-gray-900">{f.title}</h3>
                <p className="mt-2 text-sm text-gray-600">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-gray-50 py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-center text-3xl font-bold text-gray-900">Trusted by industry leaders</h2>
          <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-3">
            {testimonials.map((t) => (
              <div key={t.author} className="rounded-xl border border-gray-200 bg-white p-6">
                <div className="mb-4 flex gap-1 text-green-500">
                  {[...Array(5)].map((_, i) => (
                    <svg key={i} className="h-5 w-5 fill-current" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                  ))}
                </div>
                <p className="text-sm italic text-gray-600">&ldquo;{t.quote}&rdquo;</p>
                <div className="mt-4 border-t border-gray-100 pt-4">
                  <p className="text-sm font-semibold text-gray-900">{t.author}</p>
                  <p className="text-xs text-gray-500">{t.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20">
        <div className="mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-gray-900">Ready to get started?</h2>
          <p className="mt-4 text-lg text-gray-600">Join thousands of teams already using OwnChatGPTBusiness.</p>
          <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              to="/register"
              className="rounded-xl bg-gradient-to-r from-green-500 to-emerald-600 px-8 py-3.5 text-base font-semibold text-white shadow-lg transition-all hover:from-green-600 hover:to-emerald-700"
            >
              Start Free Trial
            </Link>
            <Link
              to="/pricing"
              className="rounded-xl border border-gray-300 bg-white px-8 py-3.5 text-base font-semibold text-gray-700 transition-all hover:bg-gray-50"
            >
              View Pricing
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
