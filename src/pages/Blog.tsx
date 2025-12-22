import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, ArrowRight, ExternalLink } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SEO from "@/components/SEO";
import { fetchBlogPosts, formatBlogDate, type BlogPost } from "@/lib/blog";
import { useTranslation } from "@/hooks/useTranslation";
import { logger } from "@/lib/logger";

const Blog = () => {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { t } = useTranslation();

  useEffect(() => {
    const loadPosts = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const data = await fetchBlogPosts();
        setPosts(data);
      } catch (err) {
        logger.error("Error loading blog posts", err instanceof Error ? err : new Error(String(err)));
        setError(t("blog.error"));
      } finally {
        setIsLoading(false);
      }
    };

    loadPosts();
  }, [t]);

  return (
    <>
      <SEO 
        title="Blog & News | JengaHacks 2026"
        description="Stay updated with the latest news, announcements, and insights from JengaHacks 2026."
      />
      <div className="min-h-screen bg-background">
        <Navbar />
        <main id="main-content" tabIndex={-1}>
          {/* Header */}
          <section className="pt-24 sm:pt-28 pb-12 sm:pb-16 bg-gradient-to-b from-card/50 to-background" aria-labelledby="blog-heading">
            <div className="container mx-auto px-4 sm:px-6">
              <header className="text-center max-w-3xl mx-auto">
                <h1 id="blog-heading" className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4">
                  <span className="text-gradient">{t("blog.title")}</span>
                </h1>
                <p className="text-lg sm:text-xl text-muted-foreground">
                  {t("blog.subtitle")}
                </p>
              </header>
            </div>
          </section>

          {/* Blog Posts */}
          <section className="py-12 sm:py-16">
            <div className="container mx-auto px-4 sm:px-6">
              {isLoading ? (
                <div className="flex items-center justify-center py-12" role="status" aria-live="polite">
                  <div className="text-center">
                    <div className="mb-4 h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto" aria-label="Loading blog posts" />
                    <p className="text-muted-foreground">{t("blog.loading")}</p>
                  </div>
                </div>
              ) : error ? (
                <div className="text-center py-12" role="alert" aria-live="assertive">
                  <p className="text-destructive text-lg mb-2">{error}</p>
                  <Button variant="outline" onClick={() => window.location.reload()} aria-label="Retry loading blog posts">
                    {t("common.retry")}
                  </Button>
                </div>
              ) : posts.length === 0 ? (
                <div className="text-center py-12" role="status" aria-live="polite">
                  <p className="text-muted-foreground text-lg">{t("blog.noPosts")}</p>
                  <p className="text-muted-foreground mt-2">{t("blog.checkBack")}</p>
                </div>
              ) : (
                <div className="grid gap-6 sm:gap-8 md:grid-cols-2 lg:grid-cols-3 max-w-7xl mx-auto" role="list" aria-label="Blog posts">
                  {posts.map((post) => (
                    <Card
                      key={post.id}
                      role="listitem"
                      className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1 flex flex-col"
                    >
                      {post.imageUrl && (
                        <div className="aspect-video w-full overflow-hidden rounded-t-lg bg-muted">
                          <img
                            src={post.imageUrl}
                            alt=""
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            aria-hidden="true"
                          />
                        </div>
                      )}
                      <CardHeader>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground mb-2">
                          <div className="flex items-center gap-1" aria-label={`Published on ${formatBlogDate(post.publishedAt)}`}>
                            <Calendar className="w-3 h-3" aria-hidden="true" />
                            <time dateTime={post.publishedAt}>{formatBlogDate(post.publishedAt)}</time>
                          </div>
                          {post.readTime && (
                            <div className="flex items-center gap-1" aria-label={`Reading time: ${post.readTime} minutes`}>
                              <Clock className="w-3 h-3" aria-hidden="true" />
                              <span>{t("blog.readTime", { minutes: post.readTime })}</span>
                            </div>
                          )}
                        </div>
                        <CardTitle className="line-clamp-2 group-hover:text-primary transition-colors">
                          {post.title}
                        </CardTitle>
                        {post.author && (
                          <CardDescription className="text-sm">
                            <span className="sr-only">{t("blog.by")} </span>
                            {post.author}
                          </CardDescription>
                        )}
                      </CardHeader>
                      <CardContent className="flex-1 flex flex-col">
                        <p className="text-muted-foreground mb-4 line-clamp-3 flex-1">
                          {post.excerpt}
                        </p>
                        {post.externalUrl ? (
                          <Button variant="outline" size="sm" asChild className="w-full sm:w-auto">
                            <a
                              href={post.externalUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-2"
                              aria-label={`Read more about ${post.title} - Opens in new tab`}
                            >
                              {t("common.readMore")}
                              <ExternalLink className="w-4 h-4" aria-hidden="true" />
                            </a>
                          </Button>
                        ) : (
                          <Button variant="outline" size="sm" asChild className="w-full sm:w-auto group-hover:bg-primary group-hover:text-primary-foreground">
                            <Link
                              to={`/blog/${post.id}`}
                              aria-label={`Read more about ${post.title}`}
                            >
                              {t("common.readMore")}
                              <ArrowRight className="w-4 h-4 ml-2" aria-hidden="true" />
                            </Link>
                          </Button>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </section>
        </main>
        <Footer />
      </div>
    </>
  );
};

export default Blog;

