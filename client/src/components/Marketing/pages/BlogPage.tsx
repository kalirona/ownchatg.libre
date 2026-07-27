import { Link } from 'react-router-dom';
import SEO from '../shared/SEO';

const posts = [
  { slug: 'introducing-gpt-4o', title: 'Introducing GPT-4o Support', excerpt: 'We are excited to announce support for OpenAI\'s latest model.', date: '2026-07-20', author: 'Engineering Team', category: 'Product' },
  { slug: 'enterprise-security-2026', title: 'Enterprise Security in 2026', excerpt: 'How we maintain SOC 2 compliance and keep your data safe.', date: '2026-07-15', author: 'Security Team', category: 'Security' },
  { slug: 'rag-best-practices', title: 'RAG Best Practices for Enterprise', excerpt: 'Learn how to get the most out of our Knowledge Workspace.', date: '2026-07-10', author: 'Product Team', category: 'Guide' },
  { slug: 'video-generation-launch', title: 'AI Video Generation is Here', excerpt: 'Generate stunning videos with Runway, Veo, and Luma.', date: '2026-07-05', author: 'Product Team', category: 'Product' },
  { slug: 'team-collaboration-tips', title: '10 Tips for Better Team Collaboration', excerpt: 'Maximize productivity with Shared conversations and workspaces.', date: '2026-06-28', author: 'Customer Success', category: 'Tips' },
  { slug: 'building-custom-chatbots', title: 'Building Custom Chatbots with Our Platform', excerpt: 'A step-by-step guide to creating AI assistants for your use case.', date: '2026-06-20', author: 'Engineering Team', category: 'Guide' },
];

export default function BlogPage() {
  return (
    <>
      <SEO title="Blog" description="Latest updates, guides, and news from OwnChatGPTBusiness." canonical="/blog" />

      <section className="bg-gradient-to-b from-green-50 to-white py-16">
        <div className="mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
          <h1 className="text-4xl font-bold text-gray-900">Blog</h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-gray-600">
            Latest updates, guides, and news from the team.
          </p>
        </div>
      </section>

      <section className="py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {posts.map((post) => (
              <Link key={post.slug} to={`/blog/${post.slug}`} className="group rounded-xl border border-gray-200 bg-white p-6 transition-all hover:border-green-200 hover:shadow-lg">
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <span className="rounded-full bg-green-50 px-2 py-0.5 font-medium text-green-700">{post.category}</span>
                  <span>{new Date(post.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                </div>
                <h2 className="mt-3 text-lg font-semibold text-gray-900 group-hover:text-green-600">{post.title}</h2>
                <p className="mt-2 text-sm text-gray-600">{post.excerpt}</p>
                <p className="mt-4 text-xs text-gray-400">{post.author}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
