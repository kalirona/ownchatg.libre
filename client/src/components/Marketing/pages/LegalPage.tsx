import { useParams, Link } from 'react-router-dom';
import SEO from '../shared/SEO';

const sections = {
  privacy: {
    title: 'Privacy Policy',
    content: `Last updated: July 1, 2026

1. Information We Collect
We collect information you provide when creating an account, including your name, email address, and company details. We also collect usage data including conversations, messages, and interactions with our platform.

2. How We Use Your Information
We use your information to provide and improve our services, process billing, send product updates, and ensure platform security. We do not train our AI models on your conversations without explicit consent.

3. Data Sharing
We do not sell your personal information. We may share data with trusted service providers who help us operate our platform (e.g., cloud infrastructure, payment processing) under strict data processing agreements.

4. Data Security
We implement industry-standard security measures including encryption at rest (AES-256) and in transit (TLS 1.3). We are SOC 2 Type II certified.

5. Your Rights
You have the right to access, correct, or delete your personal data. You can export your data from your account settings at any time.

6. Contact
For privacy-related inquiries, contact privacy@ownchatgptbusiness.com.`,
  },
  terms: {
    title: 'Terms of Service',
    content: `Last updated: July 1, 2026

1. Acceptance of Terms
By using OwnChatGPTBusiness, you agree to these terms. If you are using the platform on behalf of an organization, you represent that you have the authority to bind that organization.

2. Service Description
We provide an AI chat platform that includes multi-model chat, knowledge management, media generation, and related services. Features may vary by plan.

3. User Responsibilities
You are responsible for maintaining the confidentiality of your account credentials and for all activities under your account. You may not use the platform for any illegal purpose.

4. Acceptable Use
You agree not to use the platform to generate harmful, abusive, or misleading content. We reserve the right to suspend accounts that violate this policy.

5. Payment Terms
Fees are billed in advance on a monthly or annual basis. Refunds are provided on a prorated basis for unused time.

6. Limitation of Liability
OwnChatGPTBusiness is provided "as is" without warranty. Our liability is limited to the amount paid in the 12 months preceding a claim.`,
  },
  cookies: {
    title: 'Cookie Policy',
    content: `Last updated: July 1, 2026

1. What Are Cookies
Cookies are small text files stored on your device that help us provide and improve our services.

2. How We Use Cookies
We use essential cookies for authentication and security. We use analytics cookies to understand how our platform is used. We do not use advertising cookies.

3. Types of Cookies We Use
- Essential: Session cookies for login, CSRF tokens
- Analytics: Page views, feature usage (anonymized)
- Preference: Theme selection, language settings

4. Managing Cookies
You can control cookies through your browser settings. Disabling certain cookies may affect platform functionality.

5. Third-Party Cookies
We use Stripe for payment processing and may set cookies related to payment flow.`,
  },
  dpa: {
    title: 'Data Processing Agreement',
    content: `Last updated: July 1, 2026

This Data Processing Agreement ("DPA") forms part of the Terms of Service.

1. Definitions
"Personal Data" means any information relating to an identified or identifiable natural person processed under this DPA.

2. Processing Details
- Nature: AI chat platform services
- Duration: Term of the agreement
- Categories of Data Subjects: Users, customers, employees
- Types of Personal Data: Names, email addresses, IP addresses, chat content

3. Processor Obligations
We process Personal Data only on documented instructions. We ensure appropriate technical and organizational measures are in place.

4. Sub-processors
Current sub-processors include: AWS (cloud infrastructure), Stripe (payment processing), and OpenAI/Anthropic/Google (AI model providers).

5. Data Subject Rights
We assist you in fulfilling data subject requests under applicable data protection laws.

6. Security Measures
- Encryption at rest and in transit
- Access controls and authentication
- Regular security testing
- Incident response procedures

7. Governing Law
This DPA is governed by the laws of the United States.`,
  },
};

export default function LegalPage() {
  const { section } = useParams();
  const activeSection = section && sections[section as keyof typeof sections]
    ? sections[section as keyof typeof sections]
    : null;

  if (!activeSection) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
        <SEO title="Legal" canonical="/legal" />
        <h1 className="text-3xl font-bold text-gray-900">Legal</h1>
        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
          {Object.entries(sections).map(([key, s]) => (
            <Link
              key={key}
              to={`/legal/${key}`}
              className="rounded-xl border border-gray-200 bg-white p-6 transition-all hover:border-green-200 hover:shadow-md"
            >
              <h2 className="text-lg font-semibold text-gray-900">{s.title}</h2>
            </Link>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
      <SEO title={activeSection.title} canonical={`/legal/${section}`} />
      <Link to="/legal" className="text-sm text-green-600 hover:underline">&larr; All legal documents</Link>
      <h1 className="mt-4 text-3xl font-bold text-gray-900">{activeSection.title}</h1>
      <div className="mt-8 whitespace-pre-line text-base leading-relaxed text-gray-700">
        {activeSection.content}
      </div>
    </div>
  );
}
