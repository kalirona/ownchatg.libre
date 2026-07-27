import { Helmet } from 'react-helmet-async';

interface SEOProps {
  title?: string;
  description?: string;
  canonical?: string;
  structuredData?: Record<string, unknown>;
}

const BASE_URL = 'https://ownchatgptbusiness.com';
const SITE_NAME = 'OwnChatGPTBusiness';
const DEFAULT_DESC = 'Enterprise-grade AI chat platform for your business. Secure, customizable, and scalable.';

export default function SEO({ title, description, canonical, structuredData }: SEOProps) {
  const pageTitle = title ? `${title} | ${SITE_NAME}` : SITE_NAME;
  const desc = description || DEFAULT_DESC;
  const url = canonical ? `${BASE_URL}${canonical}` : BASE_URL;

  return (
    <Helmet>
      <title>{pageTitle}</title>
      <meta name="description" content={desc} />
      <meta property="og:title" content={pageTitle} />
      <meta property="og:description" content={desc} />
      <meta property="og:url" content={url} />
      <meta property="og:type" content="website" />
      <meta property="og:site_name" content={SITE_NAME} />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={pageTitle} />
      <meta name="twitter:description" content={desc} />
      <link rel="canonical" href={url} />
      {structuredData && (
        <script type="application/ld+json">{JSON.stringify(structuredData)}</script>
      )}
    </Helmet>
  );
}
