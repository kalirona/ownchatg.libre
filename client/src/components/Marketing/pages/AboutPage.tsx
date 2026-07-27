import { Link } from 'react-router-dom';
import SEO from '../shared/SEO';

const team = [
  { name: 'Alex Chen', role: 'CEO & Co-Founder', bio: 'Previously led AI at a Fortune 500 company.' },
  { name: 'Sarah Kim', role: 'CTO & Co-Founder', bio: 'Built distributed systems at scale for 15+ years.' },
  { name: 'Marcus Williams', role: 'Head of Product', bio: 'Product leader with passion for AI UX.' },
  { name: 'Priya Patel', role: 'Head of Engineering', bio: 'Led engineering teams at multiple startups.' },
];

export default function AboutPage() {
  return (
    <>
      <SEO title="About" description="Learn about the team behind OwnChatGPTBusiness and our mission to make AI accessible for every business." canonical="/about" />

      <section className="bg-gradient-to-b from-green-50 to-white py-16">
        <div className="mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
          <h1 className="text-4xl font-bold text-gray-900">Our mission</h1>
          <p className="mx-auto mt-4 max-w-3xl text-lg text-gray-600">
            We believe every business deserves access to powerful AI tools. Our platform makes it easy to deploy, manage,
            and scale AI chat experiences — with enterprise-grade security and without the complexity.
          </p>
        </div>
      </section>

      <section className="py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-gray-900">Our story</h2>
          <div className="mt-6 space-y-4 text-base text-gray-600 leading-relaxed">
            <p>
              OwnChatGPTBusiness was founded in 2024 by a team of AI researchers and software engineers who saw firsthand
              the challenges businesses face when adopting AI. The existing solutions were either too complex, too insecure,
              or too expensive for most organizations.
            </p>
            <p>
              We built OwnChatGPTBusiness to bridge that gap. Our platform provides the power of cutting-edge AI models
              with the security, compliance, and ease-of-use that businesses need. Today, thousands of organizations
              worldwide trust us to power their AI communications.
            </p>
          </div>
        </div>
      </section>

      <section className="bg-gray-50 py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-gray-900">Our team</h2>
          <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {team.map((member) => (
              <div key={member.name} className="rounded-xl border border-gray-200 bg-white p-6 text-center">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-green-500 to-emerald-600 text-xl font-bold text-white">
                  {member.name.split(' ').map((n) => n[0]).join('')}
                </div>
                <h3 className="mt-4 text-sm font-semibold text-gray-900">{member.name}</h3>
                <p className="text-xs text-green-600">{member.role}</p>
                <p className="mt-2 text-xs text-gray-500">{member.bio}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-gray-900">Join us</h2>
          <p className="mt-4 text-gray-600">We are always looking for talented people to join our team.</p>
          <Link to="/contact" className="mt-6 inline-block rounded-xl bg-gradient-to-r from-green-500 to-emerald-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition-all hover:from-green-600 hover:to-emerald-700">
            Get in touch
          </Link>
        </div>
      </section>
    </>
  );
}
