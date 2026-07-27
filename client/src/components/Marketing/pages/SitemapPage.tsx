import { Link } from 'react-router-dom';
import SEO from '../shared/SEO';

const sections = [
  {
    title: 'Main Pages',
    links: [
      { path: '/', label: 'Home' },
      { path: '/features', label: 'Features' },
      { path: '/pricing', label: 'Pricing' },
      { path: '/enterprise', label: 'Enterprise' },
      { path: '/faq', label: 'FAQ' },
      { path: '/contact', label: 'Contact' },
      { path: '/about', label: 'About' },
    ],
  },
  {
    title: 'Blog',
    links: [
      { path: '/blog', label: 'Blog Home' },
      { path: '/blog/introducing-gpt-4o', label: 'Introducing GPT-4o Support' },
      { path: '/blog/enterprise-security-2026', label: 'Enterprise Security in 2026' },
      { path: '/blog/rag-best-practices', label: 'RAG Best Practices' },
      { path: '/blog/video-generation-launch', label: 'AI Video Generation Launch' },
      { path: '/blog/team-collaboration-tips', label: 'Team Collaboration Tips' },
      { path: '/blog/building-custom-chatbots', label: 'Building Custom Chatbots' },
    ],
  },
  {
    title: 'Legal',
    links: [
      { path: '/legal', label: 'Legal Overview' },
      { path: '/legal/privacy', label: 'Privacy Policy' },
      { path: '/legal/terms', label: 'Terms of Service' },
      { path: '/legal/cookies', label: 'Cookie Policy' },
      { path: '/legal/dpa', label: 'Data Processing Agreement' },
    ],
  },
];

export default function SitemapPage() {
  return (
    <>
      <SEO title="Sitemap" canonical="/sitemap" />

      <section className="bg-gradient-to-b from-green-50 to-white py-16">
        <div className="mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
          <h1 className="text-4xl font-bold text-gray-900">Sitemap</h1>
          <p className="mx-auto mt-4 text-lg text-gray-600">A complete overview of all pages on OwnChatGPTBusiness.</p>
        </div>
      </section>

      <section className="py-16">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="space-y-10">
            {sections.map((section) => (
              <div key={section.title}>
                <h2 className="mb-4 text-xl font-bold text-gray-900">{section.title}</h2>
                <ul className="space-y-2">
                  {section.links.map((link) => (
                    <li key={link.path}>
                      <Link to={link.path} className="text-green-600 hover:underline">
                        {link.label}
                      </Link>
                      <span className="ml-2 text-xs text-gray-400">{link.path}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-gray-50 py-8">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">XML Sitemap</h2>
          <p className="text-sm text-gray-600">
            For search engines:{' '}
            <a href="/sitemap.xml" className="text-green-600 hover:underline">/sitemap.xml</a>
          </p>
        </div>
      </section>
    </>
  );
}
