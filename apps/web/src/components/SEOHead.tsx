import { Helmet } from "react-helmet-async";
import { useLocation } from "react-router-dom";

const SITE_NAME = "Pebric";
const SITE_URL = "https://pebric.vercel.app";
const DEFAULT_IMAGE = "/hero-1.jpg";

interface SEOHeadProps {
  title: string;
  description: string;
  keywords?: string;
  image?: string;
  type?: string;
  noindex?: boolean;
  jsonLd?: Record<string, unknown> | Record<string, unknown>[];
}

export function SEOHead({
  title,
  description,
  keywords,
  image,
  type = "website",
  noindex = false,
  jsonLd,
}: SEOHeadProps) {
  const location = useLocation();
  const canonicalUrl = `${SITE_URL}${location.pathname}`;
  const fullTitle = location.pathname === "/" ? title : `${title} | ${SITE_NAME}`;
  const ogImage = image?.startsWith("http") ? image : `${SITE_URL}${image || DEFAULT_IMAGE}`;

  return (
    <Helmet>
      {/* Primary */}
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      {keywords && <meta name="keywords" content={keywords} />}
      <link rel="canonical" href={canonicalUrl} />
      {noindex && <meta name="robots" content="noindex, nofollow" />}

      {/* Open Graph */}
      <meta property="og:type" content={type} />
      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:image" content={ogImage} />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={ogImage} />

      {/* JSON-LD Structured Data */}
      {jsonLd && (
        <script type="application/ld+json">
          {JSON.stringify(Array.isArray(jsonLd) ? jsonLd : jsonLd)}
        </script>
      )}
    </Helmet>
  );
}
