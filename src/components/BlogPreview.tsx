import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { fetchBlogPosts, formatBlogDateShort, type BlogPost } from "@/lib/blog";
import { useTranslation } from "@/hooks/useTranslation";

const BlogPreview = () => {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const { t } = useTranslation();

  useEffect(() => {
    const loadPosts = async () => {
      try {
        const data = await fetchBlogPosts(2); // Get only 2 posts for preview
        setPosts(data);
      } catch (error) {
        console.error("Error loading blog preview:", error);
        // Silently fail - preview is optional
      }
    };

    loadPosts();
  }, []);

  return (
    <section 
      id="blog" 
      className="pb-16 sm:pb-20 md:pb-24 relative"
      aria-labelledby="blog-preview-heading"
    >
      <div className="absolute inset-0 circuit-pattern opacity-10" aria-hidden="true" />
      
      <div className="container mx-auto px-4 sm:px-6 relative z-10">
        <header className="text-center mb-10 sm:mb-12 md:mb-16">
          <h2 id="blog-preview-heading" className="text-2xl sm:text-3xl md:text-4xl font-bold mb-3 sm:mb-4 px-4">
            {t("blog.latest")}
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto text-base sm:text-lg px-4">
            {t("blog.latestSubtitle")}
          </p>
        </header>

        {posts.length > 0 && (
          <div className="grid gap-6 sm:gap-8 md:grid-cols-2 max-w-4xl mx-auto mb-8" role="list" aria-label="Latest blog posts">
            {posts.map((post) => (
              <Card
                key={post.id}
                role="listitem"
                className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1 flex flex-col"
              >
                <CardHeader>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2" aria-label={`Published on ${formatBlogDateShort(post.publishedAt)}`}>
                    <Calendar className="w-3 h-3" aria-hidden="true" />
                    <time dateTime={post.publishedAt}>{formatBlogDateShort(post.publishedAt)}</time>
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
                  <Button variant="ghost" size="sm" asChild className="w-full sm:w-auto self-start group-hover:text-primary">
                    <Link to="/blog" aria-label={`Read more about ${post.title}`}>
                      {t("common.readMore")}
                      <ArrowRight className="w-4 h-4 ml-2" aria-hidden="true" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <div className="text-center">
          <Button variant="outline" size="lg" asChild>
            <Link to="/blog" className="flex items-center gap-2" aria-label="View all blog posts">
              {posts.length > 0 ? t("blog.viewAll") : t("blog.title")}
              <ArrowRight className="w-4 h-4" aria-hidden="true" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
};

export default BlogPreview;

