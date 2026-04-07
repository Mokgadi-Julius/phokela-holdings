import { useState, useEffect, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { blogAPI } from '../services/api';

const CATEGORIES = ['All', 'Travel', 'Hospitality', 'Local Attractions', 'Guest Tips'];

function readTime(excerpt) {
  const words = excerpt ? excerpt.split(/\s+/).length : 0;
  return Math.max(1, Math.ceil(words / 200));
}

function formatDate(dateStr) {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('en-ZA', {
    year: 'numeric', month: 'long', day: 'numeric',
  });
}

const PostCard = ({ post }) => (
  <Link to={`/blog/${post.slug}`} className="group bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl transition-shadow duration-300 flex flex-col">
    <div className="relative h-52 overflow-hidden bg-gray-100">
      {post.featuredImage
        ? <img src={post.featuredImage} alt={post.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
        : <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-accent/20 to-primary/10 text-4xl">📝</div>
      }
      <span className="absolute top-3 left-3 bg-accent text-white text-xs font-semibold px-3 py-1 rounded-full">
        {post.category}
      </span>
    </div>
    <div className="p-5 flex flex-col flex-1">
      <div className="flex items-center gap-3 text-xs text-gray-400 mb-2">
        <span>{formatDate(post.publishedAt || post.createdAt)}</span>
        <span>·</span>
        <span>{readTime(post.excerpt)} min read</span>
      </div>
      <h3 className="font-bold text-primary text-lg leading-snug mb-2 group-hover:text-accent transition-colors line-clamp-2">
        {post.title}
      </h3>
      <p className="text-gray-500 text-sm leading-relaxed line-clamp-3 flex-1">{post.excerpt}</p>
      <div className="mt-4 flex items-center justify-between">
        <span className="text-xs text-gray-400">By {post.author}</span>
        <span className="text-accent text-sm font-semibold group-hover:underline">Read more →</span>
      </div>
    </div>
  </Link>
);

const Blog = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [posts, setPosts] = useState([]);
  const [recent, setRecent] = useState([]);
  const [categories, setCategories] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, pages: 1 });
  const [loading, setLoading] = useState(true);
  const [searchInput, setSearchInput] = useState(searchParams.get('q') || '');

  const activeCategory = searchParams.get('category') || 'All';
  const currentPage    = parseInt(searchParams.get('page') || '1');
  const currentQ       = searchParams.get('q') || '';

  const fetchPosts = useCallback(async () => {
    setLoading(true);
    try {
      const category = activeCategory !== 'All' ? activeCategory : undefined;
      const res = currentQ
        ? await blogAPI.search({ q: currentQ, category, page: currentPage })
        : await blogAPI.getPublic({ page: currentPage, category });
      if (res.success) {
        setPosts(res.data);
        setPagination(res.pagination);
      }
    } catch {
      setPosts([]);
    } finally {
      setLoading(false);
    }
  }, [activeCategory, currentPage, currentQ]);

  useEffect(() => { fetchPosts(); }, [fetchPosts]);

  useEffect(() => {
    // Load sidebar data once
    blogAPI.getPublic({ page: 1, limit: 5 }).then(r => r.success && setRecent(r.data)).catch(() => {});
    blogAPI.getCategories().then(r => r.success && setCategories(r.data)).catch(() => {});
  }, []);

  const setParam = (key, value) => {
    const next = new URLSearchParams(searchParams);
    if (value) next.set(key, value); else next.delete(key);
    next.delete('page');
    setSearchParams(next);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    const next = new URLSearchParams(searchParams);
    if (searchInput.trim()) next.set('q', searchInput.trim()); else next.delete('q');
    next.delete('page');
    setSearchParams(next);
  };

  const handlePage = (p) => {
    const next = new URLSearchParams(searchParams);
    next.set('page', p);
    setSearchParams(next);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero */}
      <div className="bg-primary py-20 px-4 text-center text-white">
        <h1 className="font-primary text-4xl md:text-5xl mb-3">Our Blog</h1>
        <p className="text-white/70 text-lg max-w-xl mx-auto">
          Travel tips, hospitality insights, and local attractions from Phokela Guest House.
        </p>
      </div>

      {/* Category tabs */}
      <div className="bg-white border-b shadow-sm sticky top-[72px] z-30">
        <div className="container mx-auto px-4 flex items-center gap-2 overflow-x-auto py-3 scrollbar-hide">
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setParam('category', cat === 'All' ? '' : cat)}
              className={`whitespace-nowrap px-4 py-1.5 rounded-full text-sm font-medium transition-colors border ${
                activeCategory === cat
                  ? 'bg-accent text-white border-accent'
                  : 'text-gray-600 border-gray-200 hover:border-accent hover:text-accent'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      <div className="container mx-auto px-4 py-10 flex flex-col lg:flex-row gap-10">
        {/* Posts grid */}
        <div className="flex-1 min-w-0">
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-white rounded-xl shadow animate-pulse h-80" />
              ))}
            </div>
          ) : posts.length === 0 ? (
            <div className="text-center py-20 text-gray-400">
              <div className="text-5xl mb-4">📭</div>
              <p className="text-lg">No posts found{currentQ ? ` for "${currentQ}"` : ''}.</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {posts.map(p => <PostCard key={p.id} post={p} />)}
              </div>

              {/* Pagination */}
              {pagination.pages > 1 && (
                <div className="flex justify-center items-center gap-2 mt-10">
                  <button
                    onClick={() => handlePage(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="px-4 py-2 rounded-lg border text-sm disabled:opacity-40 hover:bg-gray-100"
                  >
                    ← Prev
                  </button>
                  {[...Array(pagination.pages)].map((_, i) => (
                    <button
                      key={i}
                      onClick={() => handlePage(i + 1)}
                      className={`w-9 h-9 rounded-lg text-sm font-medium border transition-colors ${
                        currentPage === i + 1
                          ? 'bg-accent text-white border-accent'
                          : 'hover:bg-gray-100'
                      }`}
                    >
                      {i + 1}
                    </button>
                  ))}
                  <button
                    onClick={() => handlePage(currentPage + 1)}
                    disabled={currentPage === pagination.pages}
                    className="px-4 py-2 rounded-lg border text-sm disabled:opacity-40 hover:bg-gray-100"
                  >
                    Next →
                  </button>
                </div>
              )}
            </>
          )}
        </div>

        {/* Sidebar */}
        <aside className="w-full lg:w-72 shrink-0 flex flex-col gap-6">
          {/* Search */}
          <div className="bg-white rounded-xl shadow-md p-5">
            <h3 className="font-bold text-primary mb-3">Search</h3>
            <form onSubmit={handleSearch} className="flex gap-2">
              <input
                value={searchInput}
                onChange={e => setSearchInput(e.target.value)}
                placeholder="Search posts…"
                className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-accent"
              />
              <button type="submit" className="bg-accent text-white px-3 py-2 rounded-lg text-sm hover:bg-accent/90">
                Go
              </button>
            </form>
          </div>

          {/* Categories */}
          {categories.length > 0 && (
            <div className="bg-white rounded-xl shadow-md p-5">
              <h3 className="font-bold text-primary mb-3">Categories</h3>
              <ul className="space-y-2">
                {categories.map(cat => (
                  <li key={cat}>
                    <button
                      onClick={() => setParam('category', activeCategory === cat ? '' : cat)}
                      className={`text-sm transition-colors hover:text-accent ${activeCategory === cat ? 'text-accent font-semibold' : 'text-gray-600'}`}
                    >
                      {cat}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Recent posts */}
          {recent.length > 0 && (
            <div className="bg-white rounded-xl shadow-md p-5">
              <h3 className="font-bold text-primary mb-3">Recent Posts</h3>
              <ul className="space-y-3">
                {recent.map(p => (
                  <li key={p.id}>
                    <Link to={`/blog/${p.slug}`} className="text-sm text-gray-700 hover:text-accent transition-colors leading-snug line-clamp-2">
                      {p.title}
                    </Link>
                    <p className="text-xs text-gray-400 mt-0.5">{formatDate(p.publishedAt || p.createdAt)}</p>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* CTA */}
          <div className="bg-accent rounded-xl p-5 text-white">
            <h3 className="font-bold text-lg mb-2">Ready to Stay?</h3>
            <p className="text-white/80 text-sm mb-4">Experience hospitality at Phokela Guest House.</p>
            <Link to="/accommodation" className="block text-center bg-white text-accent font-semibold px-4 py-2 rounded-lg text-sm hover:bg-white/90 transition-colors">
              Book Now
            </Link>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default Blog;
