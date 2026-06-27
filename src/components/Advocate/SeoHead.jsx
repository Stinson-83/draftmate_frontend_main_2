import React from 'react';
import { Helmet } from 'react-helmet-async';

export default function SeoHead({ title, description, ogImage, canonicalUrl, advocateData }) {
  // Generate Schema.org JSON-LD for an Advocate (LegalService/LocalBusiness)
  const schemaMarkup = advocateData ? {
    "@context": "https://schema.org",
    "@type": "LegalService",
    "name": advocateData.title,
    "image": advocateData.profile_image_url || ogImage,
    "description": advocateData.bio || description,
    "url": canonicalUrl,
    "telephone": "+91 0000000000", // Would be dynamic in a real app
    "address": {
      "@type": "PostalAddress",
      "addressLocality": advocateData.location?.split(',')[0]?.trim() || "New Delhi",
      "addressRegion": advocateData.location?.split(',')[1]?.trim() || "Delhi",
      "addressCountry": "IN"
    },
    "priceRange": `₹${advocateData.consultation_fee || '0'}`,
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": "4.8",
      "reviewCount": "24"
    }
  } : null;

  return (
    <Helmet>
      {/* Basic HTML Meta Tags */}
      <title>{title ? `${title} | Draftmate Verified Advocate` : 'Draftmate | AI Legal Assistant'}</title>
      <meta name="description" content={description || "Discover verified legal professionals on Draftmate."} />
      {canonicalUrl && <link rel="canonical" href={canonicalUrl} />}

      {/* Open Graph / Facebook */}
      <meta property="og:type" content="profile" />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={ogImage || 'https://draftmate.ai/default-og.jpg'} />
      {canonicalUrl && <meta property="og:url" content={canonicalUrl} />}

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={ogImage || 'https://draftmate.ai/default-og.jpg'} />

      {/* Schema.org Structured Data */}
      {schemaMarkup && (
        <script type="application/ld+json">
          {JSON.stringify(schemaMarkup)}
        </script>
      )}
    </Helmet>
  );
}
