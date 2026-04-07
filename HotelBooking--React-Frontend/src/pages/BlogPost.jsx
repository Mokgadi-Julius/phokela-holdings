import { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { blogAPI } from '../services/api';

function formatDate(dateStr) {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('en-ZA', {
    year: 'numeric', month: 'long', day: 'numeric',
  });
}

function calcReadTime(html) {
  const text = html.replace(/<[^>]+>/g, '');
  return Math.max(1, Math.ceil(text.split(/\s+/).filter(Boolean).length / 200));
}

function extractToc(html) {
  const matches = [...html.matchAll(/<h([2-3])[^>]*>(.*?)<\/h[2-3]>/gi)];
  return matches.map((m, i) => ({
    level: parseInt(m[1]),
    text:  m[2].replace(/<[^>]+>/g, ''),
    id:    `toc-${i}`,
  }));
}

function injectTocIds(html) {
  let i = 0;
  return html.replace(/<h([2-3])([^>]*)>/gi, (_, level, attrs) => `<h${level}${attrs} id="toc-${i++}">`);
}

function setSeoMeta(post) {
  const seo = post.seo || {};
  document.title = seo.metaTitle || `${post.title} — Phokela Guest House`;
  const setMeta = (name, content) => {
    if (!content) return;
    let el = document.querySelector(`meta[name="${name}"]`);
    if (!el) { el = document.createElement('meta'); el.setAttribute('name', name); document.head.appendChild(el); }
    el.setAttribute('content', content);
  };
  const setOg = (prop, content) => {
    if (!content) return;
    let el = document.querySelector(`meta[property="${prop}"]`);
    if (!el) { el = document.createElement('meta'); el.setAttribute('property', prop); document.head.appendChild(el); }
    el.setAttribute('content', content);
  };
  setMeta('description', seo.metaDescription || post.excerpt);
  setMeta('keywords',    seo.keywords || '');
  setOg('og:title',       seo.metaTitle || post.title);
  setOg('og:description', seo.metaDescription || post.excerpt);
  setOg('og:image',       post.featuredImage || '');
}

const ShareButtons = ({ post }) => {
  const url   = encodeURIComponent(window.location.href);
  const title = encodeURIComponent(post.title);
  return (
    <div className="flex items-center gap-3">
      <span className="text-sm text-gray-500 font-medium">Share:</span>
      <a
        href={`https://www.facebook.com/sharer/sharer.php?u=${url}`}
        target="_blank" rel="noopener noreferrer"
        className="w-9 h-9 rounded-full bg-[#1877F2] text-white flex items-center justify-center hover:opacity-80 transition-opacity text-sm font-bold"
      >f</a>
      <a
        href={`https://twitter.com/intent/tweet?url=${url}&text=${title}`}
        target="_blank" rel="noopener noreferrer"
        className="w-9 h-9 rounded-full bg-black text-white flex items-center justify-center hover:opacity-80 transition-opacity text-sm font-bold"
      >𝕏</a>
      <a
        href={`https://wa.me/?text=${title}%20${url}`}
        target="_blank" rel="noopener noreferrer"
        className="w-9 h-9 rounded-full bg-[#25D366] text-white flex items-center justify-center hover:opacity-80 transition-opacity text-lg"
      >💬</a>
    </div>
  );
};

const BlogPost = () => {
  const { slug } = useParams();
  const [post, setPost]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [toc, setToc]         = useState([]);
  const [processedHtml, setProcessedHtml] = useState('');
  const contentRef = useRef(null);

  useEffect(() => {
    setLoading(true);
    setNotFound(false);
    blogAPI.getPublicBySlug(slug)
      .then(res => {
        if (res.success) {
          setPost(res.data);
          setSeoMeta(res.data);
          const tocItems = extractToc(res.data.content);
          setToc(tocItems);
          setProcessedHtml(tocItems.length ? injectTocIds(res.data.content) : res.data.content);
        } else {
          setNotFound(true);
        }
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));

    return () => { document.title = 'Phokela Guest House'; };
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-center px-4">
        <div className="text-6xl mb-4">📭</div>
        <h1 className="text-2xl font-bold text-primary mb-2">Article Not Found</h1>
        <p className="text-gray-500 mb-6">This post may have been removed or the link is incorrect.</p>
        <Link to="/blog" className="bg-accent text-white px-6 py-2 rounded-lg hover:bg-accent/90 transition-colors">
          Back to Blog
        </Link>
      </div>
    );
  }

  const readTimeMin = calcReadTime(post.content);

  return (
    <article className="min-h-screen bg-gray-50">
      {/* Hero */}
      <div className="relative h-72 md:h-96 bg-primary overflow-hidden">
        {post.featuredImage && (
          <img src={post.featuredImage} alt={post.title} className="absolute inset-0 w-full h-full object-cover opacity-40" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-primary/80 to-transparent" />
        <div className="relative z-10 h-full flex flex-col justify-end container mx-auto px-4 pb-8">
          <span className="inline-block bg-accent text-white text-xs font-semibold px-3 py-1 rounded-full mb-3 self-start">
            {post.category}
          </span>
          <h1 className="font-primary text-white text-3xl md:text-4xl leading-tight max-w-3xl">
            {post.title}
          </h1>
          <div className="flex flex-wrap items-center gap-4 mt-3 text-white/70 text-sm">
            <span>By {post.author}</span>
            <span>·</span>
            <span>{formatDate(post.publishedAt || post.createdAt)}</span>
            <span>·</span>
            <span>{readTimeMin} min read</span>
          </div>
        </div>
      </div>

      {/* Back link */}
      <div className="container mx-auto px-4 py-4">
        <Link to="/blog" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-accent transition-colors">
          ← Back to Blog
        </Link>
      </div>

      <div className="container mx-auto px-4 pb-16 flex flex-col lg:flex-row gap-10">
        {/* Main content */}
        <div className="flex-1 min-w-0">

          {/* Table of Contents */}
          {toc.length > 2 && (
            <div className="bg-white border border-gray-200 rounded-xl p-5 mb-8">
              <h2 className="font-bold text-primary text-sm uppercase tracking-widest mb-3">Table of Contents</h2>
              <ul className="space-y-1.5">
                {toc.map(item => (
                  <li key={item.id} style={{ paddingLeft: item.level === 3 ? '1rem' : '0' }}>
                    <a
                      href={`#${item.id}`}
                      className="text-sm text-gray-600 hover:text-accent transition-colors"
                    >
                      {item.text}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Article body */}
          <div
            ref={contentRef}
            className="bg-white rounded-xl shadow-md p-6 md:p-10 prose prose-lg max-w-none
              prose-headings:font-primary prose-headings:text-primary
              prose-a:text-accent prose-a:no-underline hover:prose-a:underline
              prose-img:rounded-xl prose-img:shadow"
            dangerouslySetInnerHTML={{ __html: processedHtml }}
          />

          {/* Tags */}
          {post.tags && post.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-6">
              {post.tags.map(tag => (
                <span key={tag} className="bg-gray-100 text-gray-600 text-xs px-3 py-1 rounded-full">#{tag}</span>
              ))}
            </div>
          )}

          {/* Share & back */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mt-8 pt-6 border-t border-gray-200">
            <ShareButtons post={post} />
            <Link to="/blog" className="text-sm text-gray-500 hover:text-accent transition-colors">
              ← Back to all posts
            </Link>
          </div>

          {/* Book Now CTA */}
          <div className="mt-10 rounded-2xl bg-gradient-to-r from-primary to-primary/80 text-white p-8 flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <h3 className="font-primary text-2xl mb-1">Ready to Experience Phokela?</h3>
              <p className="text-white/70 text-sm">Book your stay today and enjoy world-class hospitality.</p>
            </div>
            <Link
              to="/accommodation"
              className="shrink-0 bg-accent hover:bg-accent/90 text-white font-semibold px-8 py-3 rounded-xl transition-colors"
            >
              Book Now
            </Link>
          </div>
        </div>

        {/* Sidebar */}
        <aside className="w-full lg:w-64 shrink-0">
          <div className="sticky top-28 flex flex-col gap-6">
            {/* Article meta */}
            <div className="bg-white rounded-xl shadow-md p-5">
              <h3 className="font-bold text-primary text-sm uppercase tracking-widest mb-3">About this Article</h3>
              <dl className="space-y-2 text-sm">
                <div><dt className="text-gray-400 text-xs">Author</dt><dd className="text-gray-700">{post.author}</dd></div>
                <div><dt className="text-gray-400 text-xs">Published</dt><dd className="text-gray-700">{formatDate(post.publishedAt || post.createdAt)}</dd></div>
                <div><dt className="text-gray-400 text-xs">Category</dt><dd className="text-gray-700">{post.category}</dd></div>
                <div><dt className="text-gray-400 text-xs">Read time</dt><dd className="text-gray-700">{readTimeMin} min</dd></div>
              </dl>
            </div>

            {/* Mini CTA */}
            <div className="bg-accent rounded-xl p-5 text-white">
              <h3 className="font-bold mb-2">Book Your Stay</h3>
              <p className="text-white/80 text-sm mb-4">Comfortable rooms from R450/night.</p>
              <Link to="/accommodation" className="block text-center bg-white text-accent font-semibold px-4 py-2 rounded-lg text-sm hover:bg-white/90 transition-colors">
                View Rooms
              </Link>
            </div>
          </div>
        </aside>
      </div>
    </article>
  );
};

export default BlogPost;
