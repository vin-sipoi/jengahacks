import { useEffect } from "react";

interface SEOProps {
  title?: string;
  description?: string;
  image?: string;
  url?: string;
  type?: string;
}

const SEO = ({ 
  title = "JengaHacks 2026 | Nairobi's Premier Hackathon",
  description = "Join JengaHacks 2026, East Africa's premier 48-hour hackathon in Nairobi, Kenya. February 21-22, 2026.",
  image = "https://jengahacks.com/jengahacks-og-image.jpg",
  url = "https://jengahacks.com",
  type = "website"
}: SEOProps) => {
  useEffect(() => {
    // Update document title
    document.title = title;

    // Update or create meta tags
    const updateMetaTag = (property: string, content: string, isProperty = false) => {
      const selector = isProperty ? `meta[property="${property}"]` : `meta[name="${property}"]`;
      let meta = document.querySelector(selector) as HTMLMetaElement;
      
      if (!meta) {
        meta = document.createElement("meta");
        if (isProperty) {
          meta.setAttribute("property", property);
        } else {
          meta.setAttribute("name", property);
        }
        document.head.appendChild(meta);
      }
      meta.setAttribute("content", content);
    };

    // Update description
    updateMetaTag("description", description);
    
    // Update Open Graph tags
    updateMetaTag("og:title", title, true);
    updateMetaTag("og:description", description, true);
    updateMetaTag("og:image", image, true);
    updateMetaTag("og:url", url, true);
    updateMetaTag("og:type", type, true);
    
    // Update Twitter tags
    updateMetaTag("twitter:title", title);
    updateMetaTag("twitter:description", description);
    updateMetaTag("twitter:image", image);
    
    // Update canonical URL
    let canonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement;
    if (!canonical) {
      canonical = document.createElement("link");
      canonical.setAttribute("rel", "canonical");
      document.head.appendChild(canonical);
    }
    canonical.setAttribute("href", url);
  }, [title, description, image, url, type]);

  return null;
};

export default SEO;


