import { Link } from 'react-router-dom';
import SEO from '../shared/SEO';

const categories = [
  {
    title: 'Multi-Model AI Chat',
    desc: 'Access leading models from a single interface.',
    items: [
      'GPT-4o, GPT-4 Turbo, GPT-3.5 Turbo',
      'Claude 4 Opus, Claude 3.5 Sonnet',
      'Gemini 2.5 Pro, Gemini 2.0 Flash',
      'Open-source models (Llama, Mistral)',
      'Custom model endpoints',
      'Model comparison side-by-side',
    ],
  },
  {
    title: 'Enterprise Security',
    desc: 'Your data stays yours. Always.',
    items: [
      'SOC 2 Type II certified',
      'End-to-end encryption',
      'SSO / SAML / OIDC',
      'Role-based access control',
      'Audit logging & compliance',
      'Data residency controls',
    ],
  },
  {
    title: 'Knowledge Workspace',
    desc: 'Chat with your own documents and data.',
    items: [
      'Upload PDFs, Word, CSV, images',
      'RAG-powered semantic search',
      'Multi-collection organization',
      'Automatic chunking & embedding',
      'Citation & source tracking',
      'Batch document processing',
    ],
  },
  {
    title: 'Media Generation',
    desc: 'Create images and videos with AI.',
    items: [
      'Image generation (DALL-E, Stable Diffusion, Flux)',
      'Video generation (Runway, Veo, Luma)',
      'Batch generation & history',
      'Custom style presets',
      'Resolution & quality controls',
      'Direct download & share',
    ],
  },
  {
    title: 'Integrations',
    desc: 'Connect with the tools you already use.',
    items: [
      'Slack & Discord bots',
      'Zapier & Make automations',
      'REST API & Webhooks',
      'IFrame embed for websites',
      'Zendesk & Intercom',
      'Custom connector SDK',
    ],
  },
  {
    title: 'Team Collaboration',
    desc: 'Work better together.',
    items: [
      'Shared conversations & threads',
      'Team workspaces & projects',
      'Real-time collaboration',
      'Conversation tagging & search',
      'Export & reporting',
      'Usage analytics dashboard',
    ],
  },
];

export default function FeaturesPage() {
  return (
    <>
      <SEO title="Features" description="Explore all features of OwnChatGPTBusiness - multi-model AI chat, enterprise security, knowledge base, media generation, and more." canonical="/features" />

      <section className="bg-gradient-to-b from-green-50 to-white py-16">
        <div className="mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
          <h1 className="text-4xl font-bold text-gray-900">Everything you need in one platform</h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-gray-600">
            From AI-powered chat to media generation, we provide a complete suite of tools for modern teams.
          </p>
        </div>
      </section>

      <section className="py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="space-y-16">
            {categories.map((cat) => (
              <div key={cat.title} className="rounded-2xl border border-gray-200 bg-white p-8">
                <h2 className="text-2xl font-bold text-gray-900">{cat.title}</h2>
                <p className="mt-2 text-gray-600">{cat.desc}</p>
                <ul className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {cat.items.map((item) => (
                    <li key={item} className="flex items-center gap-2 text-sm text-gray-700">
                      <svg className="h-4 w-4 shrink-0 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-gradient-to-r from-green-500 to-emerald-600 py-16">
        <div className="mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-white">Ready to try it?</h2>
          <p className="mt-4 text-lg text-green-100">Start your free trial today. No credit card required.</p>
          <Link to="/register" className="mt-8 inline-block rounded-xl bg-white px-8 py-3.5 text-base font-semibold text-green-700 shadow-lg transition-all hover:bg-gray-50">
            Get Started Free
          </Link>
        </div>
      </section>
    </>
  );
}
