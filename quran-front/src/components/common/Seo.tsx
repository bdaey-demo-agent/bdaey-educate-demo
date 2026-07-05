import { Helmet } from 'react-helmet-async'

const SITE_NAME = 'بدائي - Bdaey'
const SITE_URL = 'https://bdaey.com'
const DEFAULT_IMAGE = 'https://bdaey.com/og-image.png'
const TWITTER_HANDLE = '@bdaey'

interface SeoProps {
  title: string
  description: string
  canonical?: string
  image?: string
  type?: string
  publishedAt?: string
  updatedAt?: string
  author?: string
  noIndex?: boolean
}

export default function Seo({ title, description, canonical, image, type = 'website', publishedAt, updatedAt, author, noIndex }: SeoProps) {
  const fullTitle = `${title} | ${SITE_NAME}`
  const url = canonical || SITE_URL
  const img = image || DEFAULT_IMAGE

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      {canonical && <link rel="canonical" href={canonical} />}
      {noIndex && <meta name="robots" content="noindex, nofollow" />}

      {/* Open Graph */}
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={url} />
      <meta property="og:image" content={img} />
      <meta property="og:type" content={type} />
      <meta property="og:site_name" content={SITE_NAME} />
      {publishedAt && <meta property="article:published_time" content={publishedAt} />}
      {updatedAt && <meta property="article:modified_time" content={updatedAt} />}
      {author && <meta property="article:author" content={author} />}

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={img} />
      <meta name="twitter:site" content={TWITTER_HANDLE} />
    </Helmet>
  )
}

export function OrganizationSchema() {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'بدائي',
    alternateName: 'Bdaey',
    url: SITE_URL,
    logo: 'https://bdaey.com/logo.png',
    description: 'منصة رائدة لتحفيظ القرآن الكريم وتعليم التجويد والقراءات العشر أونلاين مع نخبة من المعلمين المعتمدين والمجازين.',
    sameAs: [
      'https://facebook.com/bdaey',
      'https://twitter.com/bdaey',
      'https://instagram.com/bdaey',
    ],
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'customer service',
      url: `${SITE_URL}/contact`,
    },
  }

  return (
    <Helmet>
      <script type="application/ld+json">{JSON.stringify(schema)}</script>
    </Helmet>
  )
}

export function CourseSchema({ name, description, provider, url, image }: { name: string; description: string; provider: string; url?: string; image?: string }) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Course',
    name,
    description,
    provider: {
      '@type': 'Organization',
      name: provider,
      sameAs: SITE_URL,
    },
    ...(url && { url }),
    ...(image && { image }),
  }

  return (
    <Helmet>
      <script type="application/ld+json">{JSON.stringify(schema)}</script>
    </Helmet>
  )
}
