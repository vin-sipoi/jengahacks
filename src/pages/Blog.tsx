import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, ArrowRight, ExternalLink } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SEO from "@/components/SEO";
import { fetchBlogPosts, formatBlogDate, type BlogPost } from "@/lib/blog";
import { useTranslation } from "@/hooks/useTranslation";

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
        console.error("Error loading blog posts:", err);
        setError(t("blog.error"));
      } finally {
        setIsLoading(false);
      }
    };

    loadPosts();
  }, []);

  return (
    <>
      <SEO 
        title="Blog & News | JengaHacks 2026"
        description="Stay updated with the latest news, announcements, and insights from JengaHacks 2026."
      />
      <div className="min-h-screen bg-background">
        <Navbar />
        <main>
          {/* Header */}
          <section className="pt-24 sm:pt-28 pb-12 sm:pb-16 bg-gradient-to-b from-card/50 to-background">
            <div className="container mx-auto px-4 sm:px-6">
              <div className="text-center max-w-3xl mx-auto">
                <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4">
                  <span className="text-gradient">{t("blog.title")}</span>
                </h1>
                <p className="text-lg sm:text-xl text-muted-foreground">
                  {t("blog.subtitle")}
                </p>
              </div>
            </div>
          </section>

          {/* Blog Posts */}
          <section className="py-12 sm:py-16">
            <div className="container mx-auto px-4 sm:px-6">
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="text-center">
                    <div className="mb-4 h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto" />
                    <p className="text-muted-foreground">{t("blog.loading")}</p>
                  </div>
                </div>
              ) : error ? (
                <div className="text-center py-12">
                  <p className="text-destructive text-lg mb-2">{error}</p>
                  <Button variant="outline" onClick={() => window.location.reload()}>
                    {t("common.retry")}
                  </Button>
                </div>
              ) : posts.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-muted-foreground text-lg">{t("blog.noPosts")}</p>
                  <p className="text-muted-foreground mt-2">{t("blog.checkBack")}</p>
                </div>
              ) : (
                <div className="grid gap-6 sm:gap-8 md:grid-cols-2 lg:grid-cols-3 max-w-7xl mx-auto">
                  {posts.map((post) => (
                    <Card
                      key={post.id}
                      className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1 flex flex-col"
                    >
                      {post.imageUrl && (
                        <div className="aspect-video w-full overflow-hidden rounded-t-lg bg-muted">
                          <img
                            src={post.imageUrl}
                            alt={post.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        </div>
                      )}
                      <CardHeader>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground mb-2">
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            <span>{formatBlogDate(post.publishedAt)}</span>
                          </div>
                          {post.readTime && (
                            <div className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              <span>{t("blog.readTime", { minutes: post.readTime })}</span>
                            </div>
                          )}
                        </div>
                        <CardTitle className="line-clamp-2 group-hover:text-primary transition-colors">
                          {post.title}
                        </CardTitle>
                        {post.author && (
                          <CardDescription className="text-sm">{t("blog.by")} {post.author}</CardDescription>
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
                            >
                              {t("common.readMore")}
                              <ExternalLink className="w-4 h-4" />
                            </a>
                          </Button>
                        ) : (
                          <Button variant="outline" size="sm" className="w-full sm:w-auto group-hover:bg-primary group-hover:text-primary-foreground">
                            {t("common.readMore")}
                            <ArrowRight className="w-4 h-4 ml-2" />
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

