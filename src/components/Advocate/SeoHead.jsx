import React from 'react';
import { Helmet } from 'react-helmet-async';

export default function SeoHead({ title, description, ogImage, canonicalUrl, advocateData }) {
  let schemaMarkup = null;
  if (advocateData) {
    schemaMarkup = {
      "@context": "https://schema.org",
      "@type": "LegalService",
      "name": advocateData.title || title,
      "image": advocateData.profile_image_url || ogImage,
      "description": advocateData.bio || description,
      "url": canonicalUrl,
    };

    if (advocateData.phone) {
      schemaMarkup.telephone = advocateData.phone;
    }

    if (advocateData.location) {
      const parts = advocateData.location.split(',').map(p => p.trim());
      schemaMarkup.address = {
        "@type": "PostalAddress",
        "addressLocality": parts[0] || "",
        "addressRegion": parts[1] || "",
        "addressCountry": "IN"
      };
    }

    if (advocateData.consultation_fee) {
      schemaMarkup.priceRange = `₹${advocateData.consultation_fee}`;
    }

    if (advocateData.social_links) {
      try {
        let links = typeof advocateData.social_links === 'string' 
          ? JSON.parse(advocateData.social_links) 
          : advocateData.social_links;
        
        const validUrls = Object.values(links)
          .filter(url => url && typeof url === 'string' && url.startsWith('http'));
          
        if (validUrls.length > 0) {
          schemaMarkup.sameAs = validUrls;
        }
      } catch (e) {
        // ignore parse error
      }
    }
  }

  return (
    <Helmet>
      {/* Basic HTML Meta Tags */}
      <title>{title || 'Draftmate | AI Legal Assistant'}</title>
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
