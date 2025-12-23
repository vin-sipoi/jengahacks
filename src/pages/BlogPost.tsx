import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { Calendar, Clock, ArrowLeft, ExternalLink, Share2 } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SEO from "@/components/SEO";
import { fetchBlogPost, formatBlogDate, type BlogPost } from "@/lib/blog";
import { sanitizeForRender } from "@/lib/sanitize";
import { useTranslation } from "@/hooks/useTranslation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import SocialShare from "@/components/SocialShare";
import { trackPageView } from "@/lib/analytics";
import { logger } from "@/lib/logger";

const BlogPost = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [post, setPost] = useState<BlogPost | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { t } = useTranslation();

  useEffect(() => {
    const loadPost = async () => {
      if (!id) {
        setError(t("blogPost.notFound"));
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);
      try {
        const data = await fetchBlogPost(id);
        if (data) {
          setPost(data);
          // Track page view
          trackPageView(`/blog/${id}`, data.title);
        } else {
          setError(t("blogPost.notFound"));
        }
      } catch (err) {
        logger.error("Error loading blog post", err instanceof Error ? err : new Error(String(err)), { id });
        setError(t("blogPost.error"));
      } finally {
        setIsLoading(false);
      }
    };

    loadPost();
  }, [id, t]);

  if (isLoading) {
    return (
      <>
        <SEO title="Loading..." />
        <div className="min-h-screen bg-background">
          <Navbar />
          <main id="main-content" tabIndex={-1} className="pt-24 sm:pt-28">
            <div className="container mx-auto px-4 sm:px-6">
              <div className="flex items-center justify-center py-12" role="status" aria-live="polite">
                <div className="text-center">
                  <div className="mb-4 h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto" aria-label="Loading blog post" />
                  <p className="text-muted-foreground">{t("blogPost.loading")}</p>
                </div>
              </div>
            </div>
          </main>
          <Footer />
        </div>
      </>
    );
  }

  if (error || !post) {
    return (
      <>
        <SEO title="Post Not Found | JengaHacks 2026" />
        <div className="min-h-screen bg-background">
          <Navbar />
          <main id="main-content" tabIndex={-1} className="pt-24 sm:pt-28">
            <div className="container mx-auto px-4 sm:px-6">
              <div className="text-center py-12" role="alert" aria-live="assertive">
                <h1 className="text-3xl font-bold mb-4">{t("blogPost.notFound")}</h1>
                <p className="text-muted-foreground mb-6">{error || t("blogPost.notFoundMessage")}</p>
                <div className="flex gap-4 justify-center">
                  <Button variant="outline" asChild>
                    <Link to="/blog">{t("blogPost.backToBlog")}</Link>
                  </Button>
                  <Button variant="hero" asChild>
                    <Link to="/">{t("common.home")}</Link>
                  </Button>
                </div>
              </div>
            </div>
          </main>
          <Footer />
        </div>
      </>
    );
  }

  return (
    <>
      <SEO 
        title={`${post.title} | JengaHacks 2026`}
        description={post.excerpt}
        image={post.imageUrl}
      />
      <div className="min-h-screen bg-background">
        <Navbar />
        <main id="main-content" tabIndex={-1}>
          {/* Header */}
          <article className="pt-24 sm:pt-28 pb-12 sm:pb-16">
            <div className="container mx-auto px-4 sm:px-6 max-w-4xl">
              {/* Back Button */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate(-1)}
                className="mb-6 -ml-2"
                aria-label={t("blogPost.backToBlog")}
              >
                <ArrowLeft className="w-4 h-4 mr-2" aria-hidden="true" />
                {t("blogPost.backToBlog")}
              </Button>

              {/* Post Header */}
              <header className="mb-8">
                {post.tags && post.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-4">
                    {post.tags.map((tag) => (
                      <span
                        key={tag}
                        className="px-3 py-1 text-xs font-medium rounded-full bg-primary/10 text-primary border border-primary/20"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
                
                <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4">
                  {post.title}
                </h1>

                <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-6">
                  {post.author && (
                    <div className="flex items-center gap-2">
                      <span className="sr-only">{t("blog.by")} </span>
                      <span>{post.author}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-1" aria-label={`Published on ${formatBlogDate(post.publishedAt)}`}>
                    <Calendar className="w-4 h-4" aria-hidden="true" />
                    <time dateTime={post.publishedAt}>{formatBlogDate(post.publishedAt)}</time>
                  </div>
                  {post.readTime && (
                    <div className="flex items-center gap-1" aria-label={`Reading time: ${post.readTime} minutes`}>
                      <Clock className="w-4 h-4" aria-hidden="true" />
                      <span>{t("blog.readTime", { minutes: post.readTime })}</span>
                    </div>
                  )}
                </div>

                {/* Featured Image */}
                {post.imageUrl && (
                  <div className="aspect-video w-full overflow-hidden rounded-lg bg-muted mb-8">
                    <img
                      src={post.imageUrl}
                      alt=""
                      className="w-full h-full object-cover"
                      aria-hidden="true"
                    />
                  </div>
                )}
              </header>

              {/* Post Content */}
              <div className="prose prose-invert prose-lg max-w-none prose-headings:text-foreground prose-p:text-foreground prose-a:text-primary prose-strong:text-foreground prose-code:text-foreground">
                {post.content ? (
                  <div 
                    className="text-foreground"
                    dangerouslySetInnerHTML={sanitizeForRender(post.content)}
                  />
                ) : (
                  <div className="text-foreground space-y-4">
                    <p className="text-lg leading-relaxed">{post.excerpt}</p>
                    {post.externalUrl && (
                      <Card className="mt-8">
                        <CardContent className="pt-6">
                          <p className="mb-4 text-muted-foreground">
                            {t("blogPost.externalContent")}
                          </p>
                          <Button asChild>
                            <a
                              href={post.externalUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-2"
                            >
                              {t("blogPost.readFullArticle")}
                              <ExternalLink className="w-4 h-4" aria-hidden="true" />
                            </a>
                          </Button>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                )}
              </div>

              {/* Share Section */}
              <div className="mt-12 pt-8 border-t border-border">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div>
                    <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
                      <Share2 className="w-5 h-5" aria-hidden="true" />
                      {t("blogPost.share")}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {t("blogPost.shareDescription")}
                    </p>
                  </div>
                  <SocialShare
                    url={window.location.href}
                    title={post.title}
                    description={post.excerpt}
                    hideHeader={true}
                  />
                </div>
              </div>

              {/* Navigation */}
              <div className="mt-12 pt-8 border-t border-border">
                <Button variant="outline" asChild className="w-full sm:w-auto">
                  <Link to="/blog">
                    <ArrowLeft className="w-4 h-4 mr-2" aria-hidden="true" />
                    {t("blogPost.backToBlog")}
                  </Link>
                </Button>
              </div>
            </div>
          </article>
        </main>
        <Footer />
      </div>
    </>
  );
};

export default BlogPost;

