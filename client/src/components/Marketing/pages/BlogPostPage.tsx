import { useParams, Link } from 'react-router-dom';
import SEO from '../shared/SEO';

const posts: Record<string, { title: string; content: string[]; date: string; author: string }> = {
  'introducing-gpt-4o': {
    title: 'Introducing GPT-4o Support',
    date: '2026-07-20',
    author: 'Engineering Team',
    content: [
      'We are thrilled to announce that OwnChatGPTBusiness now supports OpenAI\'s latest model, GPT-4o.',
      'GPT-4o brings significant improvements in reasoning, code generation, and multimodal understanding. With native vision capabilities, it can analyze images, charts, and diagrams directly within your chat conversations.',
      'Key features include faster response times, improved accuracy on complex tasks, and the ability to process both text and images in a single request.',
      'To start using GPT-4o, simply select it from the model picker in any conversation. Enterprise customers can also configure GPT-4o as the default model for their organization.',
    ],
  },
  'enterprise-security-2026': {
    title: 'Enterprise Security in 2026',
    date: '2026-07-15',
    author: 'Security Team',
    content: [
      'Security remains our top priority at OwnChatGPTBusiness. In 2026, we are raising the bar even higher.',
      'We have achieved SOC 2 Type II certification with zero findings. Our annual penetration testing and regular security audits ensure your data remains protected.',
      'New this year: end-to-end encryption for all conversations, hardware security module (HSM) integration for key management, and AI-powered threat detection that monitors for unusual access patterns in real-time.',
      'Our security team has also implemented a comprehensive bug bounty program, inviting researchers worldwide to help us identify and fix potential vulnerabilities before they can be exploited.',
    ],
  },
  'rag-best-practices': {
    title: 'RAG Best Practices for Enterprise',
    date: '2026-07-10',
    author: 'Product Team',
    content: [
      'Retrieval-Augmented Generation (RAG) is transforming how enterprises interact with their data. Here are our top recommendations.',
      'First, organize your documents into logical collections. Instead of uploading everything into a single bucket, create separate collections for different departments or use cases. This improves search accuracy and makes maintenance easier.',
      'Second, use descriptive file names and metadata. The more context you provide during upload, the better your search results will be.',
      'Third, leverage our chunking configuration to optimize for your specific use case. Smaller chunks work better for factual Q&A, while larger chunks are ideal for summarization tasks.',
      'Finally, regularly review and update your knowledge base. Stale information can lead to incorrect responses. Set up a schedule to refresh your collections. to refresh your collections.',
    ],
  },
};

export default function BlogPostPage() {
  const { slug } = useParams();
  const post = slug ? posts[slug] : null;

  if (!post) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900">Post not found</h1>
          <p className="mt-2 text-gray-600">The blog post you are looking for does not exist.</p>
          <Link to="/blog" className="mt-4 inline-block text-green-600 hover:underline">Back to blog</Link>
        </div>
      </div>
    );
  }

  return (
    <>
      <SEO title={post.title} description={post.content[0]} canonical={`/blog/${slug}`}
        structuredData={{
          '@context': 'https://schema.org',
          '@type': 'BlogPosting',
          headline: post.title,
          datePublished: post.date,
          author: { '@type': 'Organization', name: post.author },
        }}
      />

      <article className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
        <Link to="/blog" className="text-sm text-green-600 hover:underline">&larr; Back to blog</Link>
        <h1 className="mt-4 text-3xl font-bold text-gray-900 sm:text-4xl">{post.title}</h1>
        <div className="mt-2 flex items-center gap-3 text-sm text-gray-500">
          <span>{post.author}</span>
          <span>&middot;</span>
          <span>{new Date(post.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
        </div>
        <div className="mt-8 space-y-4 text-base leading-relaxed text-gray-700">
          {post.content.map((p, i) => (
            <p key={i}>{p}</p>
          ))}
        </div>
      </article>
    </>
  );
}
