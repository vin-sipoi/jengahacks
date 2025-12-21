import { Button } from "@/components/ui/button";
import { Share2, Twitter, Facebook, Linkedin, MessageCircle, Link as LinkIcon, Mail, Send } from "lucide-react";
import { toast } from "sonner";
import { trackSocialShare } from "@/lib/analytics";
import { useTranslation } from "@/hooks/useTranslation";

interface SocialShareProps {
  title?: string;
  description?: string;
  url?: string;
  className?: string;
  variant?: "default" | "compact" | "icon-only";
}

const SocialShare = ({ 
  title,
  description,
  url,
  className = "",
  variant = "default"
}: SocialShareProps) => {
  const { t } = useTranslation();
  
  // Default values with translations
  const defaultTitle = title || "JengaHacks 2026 - East Africa's Premier Hackathon";
  const defaultDescription = description || "Join us for 48 hours of innovation, collaboration, and building solutions that matter. February 21-22, 2026 at iHub, Nairobi.";
  const shareUrl = url || (typeof window !== "undefined" ? window.location.href : "https://jengahacks.com");
  
  const encodedUrl = encodeURIComponent(shareUrl);
  const encodedTitle = encodeURIComponent(defaultTitle);
  const encodedDescription = encodeURIComponent(defaultDescription);
  const encodedText = encodeURIComponent(`${defaultTitle} - ${defaultDescription}`);

  const shareLinks = {
    twitter: `https://twitter.com/intent/tweet?text=${encodedTitle}&url=${encodedUrl}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
    whatsapp: `https://wa.me/?text=${encodedText}`,
    reddit: `https://reddit.com/submit?url=${encodedUrl}&title=${encodedTitle}`,
    telegram: `https://t.me/share/url?url=${encodedUrl}&text=${encodedTitle}`,
    email: `mailto:?subject=${encodedTitle}&body=${encodedText}%0A%0A${encodedUrl}`,
  };

  const handleShare = async (platform: string, link: string) => {
    // Try native Web Share API first (mobile)
    let nativeShareFailed = false;
    if (navigator.share && platform === "native") {
      try {
        await navigator.share({
          title: defaultTitle,
          text: defaultDescription,
          url: shareUrl,
        });
        // Track successful native share BEFORE returning
        trackSocialShare("native_share", "event");
        return;
      } catch (error) {
        // User cancelled or error, fall through to copy link
        if ((error as Error).name !== "AbortError") {
          console.error("Share error:", error);
          // Track failed share attempt
          trackSocialShare("native_share_failed", "event");
          // Mark that native share failed so we can fall back to copy
          nativeShareFailed = true;
        } else {
          // User cancelled - don't track as it's intentional
          return;
        }
      }
    }

    // Handle email separately (opens mail client)
    if (platform === "email") {
      trackSocialShare("email", "event");
      window.location.href = link;
      return;
    }

    // Copy to clipboard for native share fallback or link copy
    // Include nativeShareFailed to handle fallback when navigator.share exists but failed
    const shouldCopyLink = platform === "copy" || 
      (platform === "native" && (!navigator.share || nativeShareFailed));
    if (shouldCopyLink) {
      try {
        await navigator.clipboard.writeText(shareUrl);
        trackSocialShare(platform === "copy" ? "copy_link" : "native_share", "event");
        toast.success(t("socialShare.linkCopied"));
        return;
      } catch (error) {
        console.error("Copy error:", error);
        // Fallback for older browsers
        try {
          const textArea = document.createElement("textarea");
          textArea.value = shareUrl;
          textArea.style.position = "fixed";
          textArea.style.opacity = "0";
          document.body.appendChild(textArea);
          textArea.select();
          document.execCommand("copy");
          document.body.removeChild(textArea);
          trackSocialShare(platform === "copy" ? "copy_link" : "native_share", "event");
          toast.success(t("socialShare.linkCopied"));
          return;
        } catch (fallbackError) {
          console.error("Fallback copy error:", fallbackError);
          toast.error(t("socialShare.copyFailed"));
          return;
        }
      }
    }

    // Track social share
    const platformName = link.includes("twitter") ? "twitter" :
                         link.includes("facebook") ? "facebook" :
                         link.includes("linkedin") ? "linkedin" :
                         link.includes("wa.me") ? "whatsapp" :
                         link.includes("reddit") ? "reddit" :
                         link.includes("t.me") ? "telegram" :
                         link.includes("mailto") ? "email" : platform;
    trackSocialShare(platformName, "event");

    // Open share link in new window (except email)
    if (platform !== "email") {
      window.open(link, "_blank", "noopener,noreferrer,width=600,height=400");
    }
  };

  if (variant === "icon-only") {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        {navigator.share && (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => handleShare("native", "")}
            className="h-9 w-9"
            aria-label={t("socialShare.share")}
          >
            <Share2 className="h-4 w-4" />
          </Button>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => handleShare("twitter", shareLinks.twitter)}
          className="h-9 w-9 hover:bg-blue-500/10 hover:text-blue-500"
          aria-label={`${t("socialShare.share")} ${t("socialShare.twitter")}`}
        >
          <Twitter className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => handleShare("facebook", shareLinks.facebook)}
          className="h-9 w-9 hover:bg-blue-600/10 hover:text-blue-600"
          aria-label={`${t("socialShare.share")} ${t("socialShare.facebook")}`}
        >
          <Facebook className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => handleShare("linkedin", shareLinks.linkedin)}
          className="h-9 w-9 hover:bg-blue-700/10 hover:text-blue-700"
          aria-label={`${t("socialShare.share")} ${t("socialShare.linkedin")}`}
        >
          <Linkedin className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => handleShare("whatsapp", shareLinks.whatsapp)}
          className="h-9 w-9 hover:bg-green-500/10 hover:text-green-500"
          aria-label={`${t("socialShare.share")} ${t("socialShare.whatsapp")}`}
        >
          <MessageCircle className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => handleShare("reddit", shareLinks.reddit)}
          className="h-9 w-9 hover:bg-orange-500/10 hover:text-orange-500"
          aria-label={`${t("socialShare.share")} ${t("socialShare.reddit")}`}
        >
          <Send className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => handleShare("telegram", shareLinks.telegram)}
          className="h-9 w-9 hover:bg-blue-400/10 hover:text-blue-400"
          aria-label={`${t("socialShare.share")} ${t("socialShare.telegram")}`}
        >
          <Send className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => handleShare("copy", "")}
          className="h-9 w-9"
          aria-label={t("socialShare.copyLink")}
        >
          <LinkIcon className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  if (variant === "compact") {
    return (
      <div className={`flex flex-wrap items-center gap-2 ${className}`}>
        <span className="text-sm text-muted-foreground">{t("socialShare.shareLabel")}</span>
        {navigator.share && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleShare("native", "")}
            className="h-8"
          >
            <Share2 className="h-3 w-3 mr-1.5" />
            {t("socialShare.nativeShare")}
          </Button>
        )}
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleShare("twitter", shareLinks.twitter)}
          className="h-8"
        >
          <Twitter className="h-3 w-3 mr-1.5" />
          {t("socialShare.twitter")}
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleShare("facebook", shareLinks.facebook)}
          className="h-8"
        >
          <Facebook className="h-3 w-3 mr-1.5" />
          {t("socialShare.facebook")}
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleShare("linkedin", shareLinks.linkedin)}
          className="h-8"
        >
          <Linkedin className="h-3 w-3 mr-1.5" />
          {t("socialShare.linkedin")}
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleShare("whatsapp", shareLinks.whatsapp)}
          className="h-8"
        >
          <MessageCircle className="h-3 w-3 mr-1.5" />
          {t("socialShare.whatsapp")}
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleShare("copy", "")}
          className="h-8"
        >
          <LinkIcon className="h-3 w-3 mr-1.5" />
          {t("socialShare.copyLink")}
        </Button>
      </div>
    );
  }

  return (
    <div className={`space-y-3 ${className}`}>
      <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
        <Share2 className="h-4 w-4" />
        <span>{t("socialShare.shareThis")}</span>
      </div>
      <div className="flex flex-wrap items-center justify-center gap-2">
        {navigator.share && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleShare("native", "")}
            className="flex items-center gap-2"
          >
            <Share2 className="h-4 w-4" />
            <span>{t("socialShare.nativeShare")}</span>
          </Button>
        )}
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleShare("twitter", shareLinks.twitter)}
          className="flex items-center gap-2"
        >
          <Twitter className="h-4 w-4" />
          <span>{t("socialShare.twitter")}</span>
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleShare("facebook", shareLinks.facebook)}
          className="flex items-center gap-2"
        >
          <Facebook className="h-4 w-4" />
          <span>{t("socialShare.facebook")}</span>
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleShare("linkedin", shareLinks.linkedin)}
          className="flex items-center gap-2"
        >
          <Linkedin className="h-4 w-4" />
          <span>{t("socialShare.linkedin")}</span>
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleShare("whatsapp", shareLinks.whatsapp)}
          className="flex items-center gap-2"
        >
          <MessageCircle className="h-4 w-4" />
          <span>{t("socialShare.whatsapp")}</span>
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleShare("reddit", shareLinks.reddit)}
          className="flex items-center gap-2"
        >
          <Send className="h-4 w-4" />
          <span>{t("socialShare.reddit")}</span>
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleShare("telegram", shareLinks.telegram)}
          className="flex items-center gap-2"
        >
          <Send className="h-4 w-4" />
          <span>{t("socialShare.telegram")}</span>
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleShare("email", shareLinks.email)}
          className="flex items-center gap-2"
        >
          <Mail className="h-4 w-4" />
          <span>{t("socialShare.email")}</span>
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleShare("copy", "")}
          className="flex items-center gap-2"
        >
          <LinkIcon className="h-4 w-4" />
          <span>{t("socialShare.copyLink")}</span>
        </Button>
      </div>
    </div>
  );
};

export default SocialShare;
