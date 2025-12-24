import React from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, ArrowRight, ExternalLink, Play } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SEO from "@/components/SEO";
import { fetchBlogPosts, formatBlogDate, type BlogPost } from "@/lib/blog";
import { useTranslation } from "@/hooks/useTranslation";
import { CACHE_KEYS, CACHE_DURATIONS } from "@/lib/cache";

const Blog = () => {
  const { t, locale } = useTranslation();

  // Use React Query for automatic caching and refetching
  const { data: posts = [], isLoading, error } = useQuery<BlogPost[]>({
    queryKey: [CACHE_KEYS.blog.posts, locale],
    queryFn: () => fetchBlogPosts(undefined, locale),
    staleTime: CACHE_DURATIONS.MEDIUM, // Cache for 15 minutes
    gcTime: CACHE_DURATIONS.LONG, // Keep in cache for 1 hour
  });

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
                  <p className="text-destructive text-lg mb-2">{t("blog.error")}</p>
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
                  {posts.map((post) => {
                    const CardWrapper = post.externalUrl 
                      ? ({ children }: { children: React.ReactNode }) => (
                          <a
                            href={post.externalUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block"
                            aria-label={`Read ${post.title} - Opens in new tab`}
                          >
                            {children}
                          </a>
                        )
                      : ({ children }: { children: React.ReactNode }) => (
                          <Link
                            to={`/blog/${post.id}`}
                            className="block"
                            aria-label={`Read ${post.title}`}
                          >
                            {children}
                          </Link>
                        );

                    return (
                      <CardWrapper key={post.id}>
                        <Card
                          role="listitem"
                          className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1 flex flex-col cursor-pointer h-full"
                        >
                          {(post.videoUrl || post.imageUrl) && (
                            <div className="aspect-video w-full overflow-hidden rounded-t-lg bg-muted relative">
                              {post.videoUrl ? (
                                <>
                                  <video
                                    src={post.videoUrl}
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                    aria-hidden="true"
                                    preload="metadata"
                                    muted
                                    playsInline
                                    onLoadedMetadata={(e) => {
                                      const video = e.target as HTMLVideoElement;
                                      video.currentTime = 0.1; // Seek to first frame
                                    }}
                                  />
                                  <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/30 transition-colors pointer-events-none">
                                    <div className="rounded-full bg-primary/90 p-4 group-hover:bg-primary transition-colors">
                                      <Play className="w-8 h-8 text-primary-foreground ml-1" fill="currentColor" />
                                    </div>
                                  </div>
                                </>
                              ) : (
                                <img
                                  src={post.imageUrl}
                                  alt=""
                                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                  aria-hidden="true"
                                  loading="lazy"
                                  onError={(e) => {
                                    const target = e.target as HTMLImageElement;
                                    target.src = '/placeholder.svg';
                                  }}
                                />
                              )}
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
                              <div className="flex items-center gap-2 text-sm text-primary group-hover:underline">
                                {t("common.readMore")}
                                <ExternalLink className="w-4 h-4" aria-hidden="true" />
                              </div>
                            ) : (
                              <div className="flex items-center gap-2 text-sm text-primary group-hover:underline">
                                {t("common.readMore")}
                                <ArrowRight className="w-4 h-4" aria-hidden="true" />
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      </CardWrapper>
                    );
                  })}
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

