# Managing Blog Content

This project uses a static JSON-based system for managing blog posts, located at `src/content/blog.json`.

## How to Add a New Post

1.  Open `src/content/blog.json`.
2.  Add a new entry to the array with the following structure:

```json
{
  "id": "slug-style-id",
  "title": "Your Post Title",
  "excerpt": "A short summary of your post for the preview card.",
  "content": "The full text of your blog post (supports basic formatting).",
  "author": "Author Name",
  "publishedAt": "YYYY-MM-DDTHH:mm:ssZ",
  "readTime": 5,
  "tags": ["tag1", "tag2"],
  "imageUrl": "/path/to/image.svg",
  "videoUrl": "/path/to/video.mp4",
  "videoThumbnailUrl": "/path/to/thumbnail.jpg"
}
```

### Field Details

- `id`: Unique string used for the URL (e.g., `registration-open-2026`).
- `publishedAt`: ISO 8601 format. Posts are automatically sorted by this date descending.
- `readTime`: Estimated minutes to read.
- `imageUrl`: Optional link to a cover image. Use local paths (e.g., `/image.svg`) or external URLs.
- `videoUrl`: Optional path to a video file. If provided, the video will be displayed as the featured media instead of the image. Supports local paths (e.g., `/video.mp4`) or external URLs.
- `videoThumbnailUrl`: Optional thumbnail image for the video. If not provided, `imageUrl` will be used as the video poster/thumbnail.

## Images and Videos

### Images
We recommend using local SVG or optimized image files in the `public` folder. Use paths like `/image-name.svg` or `/image-name.jpg`.

### Videos
You can add videos to blog posts by including a `videoUrl` field. The video will be displayed with native browser controls.

- **Local videos**: Place video files in the `public` folder and reference them with paths like `/video-name.mp4`
- **Video thumbnails**: Use `videoThumbnailUrl` to specify a custom thumbnail, or the `imageUrl` will be used as a fallback
- **Embedded videos**: You can also embed videos (e.g., YouTube, Vimeo) directly in the `content` HTML using `<iframe>` tags

### Example with Video

```json
{
  "id": "example-with-video",
  "title": "Example Post with Video",
  "videoUrl": "/videos/demo.mp4",
  "videoThumbnailUrl": "/thumbnails/demo-thumb.jpg",
  "imageUrl": "/thumbnails/demo-thumb.jpg"
}
```

## Verification

After adding a post:
1. Run `npm run dev` to see it on the `/blog` page.
2. Ensure the `id` is unique to avoid routing issues.
3. Check that the `publishedAt` date is correct for the desired sorting order.
