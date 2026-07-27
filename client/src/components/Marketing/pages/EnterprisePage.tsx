import { Link } from 'react-router-dom';
import SEO from '../shared/SEO';

const highlights = [
  { title: 'Dedicated Infrastructure', desc: 'Isolated instances with dedicated compute resources. No noisy neighbors.' },
  { title: 'Custom AI Models', desc: 'Fine-tune models on your data. Train custom models for domain-specific tasks.' },
  { title: 'Advanced Compliance', desc: 'SOC 2 Type II, HIPAA BAA, GDPR, and data residency controls.' },
  { title: '99.99% Uptime SLA', desc: 'Enterprise-grade reliability with multi-region deployment and automatic failover.' },
  { title: 'On-Premise Deployment', desc: 'Deploy in your own VPC or data center. Full control over your infrastructure.' },
  { title: '24/7 Premium Support', desc: 'Dedicated account manager, priority support, and emergency hotline.' },
];

export default function EnterprisePage() {
  return (
    <>
      <SEO title="Enterprise" description="Enterprise-grade AI chat platform with dedicated infrastructure, custom models, compliance, and premium support." canonical="/enterprise" />

      <section className="relative overflow-hidden bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 py-24">
        <div className="mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
          <h1 className="text-4xl font-bold text-white sm:text-5xl">Built for the enterprise</h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-gray-300">
            Deploy AI chat at scale with dedicated infrastructure, custom models, and enterprise-grade security.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link to="/contact" className="rounded-xl bg-white px-8 py-3.5 text-base font-semibold text-gray-900 shadow-lg transition-all hover:bg-gray-100">
              Talk to Sales
            </Link>
            <Link to="/register" className="rounded-xl border border-gray-500 px-8 py-3.5 text-base font-semibold text-white transition-all hover:bg-gray-800">
              Start Free Trial
            </Link>
          </div>
        </div>
      </section>

      <section className="py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {highlights.map((h) => (
              <div key={h.title} className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                <h3 className="text-lg font-semibold text-gray-900">{h.title}</h3>
                <p className="mt-2 text-sm text-gray-600">{h.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-gray-50 py-20">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-gray-900">Why enterprises choose us</h2>
          <div className="mt-8 space-y-6">
            {[
              { stat: '99.99%', label: 'Uptime SLA' },
              { stat: '50M+', label: 'Messages processed daily' },
              { stat: '10K+', label: 'Enterprise deployments' },
              { stat: '<100ms', label: 'Average response time' },
            ].map((item) => (
              <div key={item.label} className="flex items-center justify-between rounded-xl border border-gray-200 bg-white px-6 py-4">
                <span className="text-lg font-bold text-green-600">{item.stat}</span>
                <span className="text-sm text-gray-600">{item.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
