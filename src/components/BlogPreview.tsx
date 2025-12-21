import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { fetchBlogPosts, formatBlogDateShort, type BlogPost } from "@/lib/blog";

const BlogPreview = () => {
  const [posts, setPosts] = useState<BlogPost[]>([]);

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
    <section id="blog" className="py-16 sm:py-20 md:py-24 relative">
      <div className="absolute inset-0 circuit-pattern opacity-10" />
      
      <div className="container mx-auto px-4 sm:px-6 relative z-10">
        <div className="text-center mb-10 sm:mb-12 md:mb-16">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-3 sm:mb-4 px-4">
            Latest <span className="text-gradient">News</span>
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto text-base sm:text-lg px-4">
            Stay updated with announcements, insights, and stories from JengaHacks
          </p>
        </div>

        {posts.length > 0 && (
          <div className="grid gap-6 sm:gap-8 md:grid-cols-2 max-w-4xl mx-auto mb-8">
            {posts.map((post) => (
              <Card
                key={post.id}
                className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1 flex flex-col"
              >
                <CardHeader>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                    <Calendar className="w-3 h-3" />
                    <span>{formatBlogDateShort(post.publishedAt)}</span>
                  </div>
                <CardTitle className="line-clamp-2 group-hover:text-primary transition-colors">
                  {post.title}
                </CardTitle>
                {post.author && (
                  <CardDescription className="text-sm">By {post.author}</CardDescription>
                )}
              </CardHeader>
              <CardContent className="flex-1 flex flex-col">
                <p className="text-muted-foreground mb-4 line-clamp-3 flex-1">
                  {post.excerpt}
                </p>
                <Button variant="ghost" size="sm" asChild className="w-full sm:w-auto self-start group-hover:text-primary">
                  <Link to="/blog">
                    Read More
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ))}
          </div>
        )}

        <div className="text-center">
          <Button variant="outline" size="lg" asChild>
            <Link to="/blog" className="flex items-center gap-2">
              {posts.length > 0 ? "View All Posts" : "View Blog"}
              <ArrowRight className="w-4 h-4" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
};

export default BlogPreview;

