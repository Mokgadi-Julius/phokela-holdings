import { useState, useEffect, useRef } from 'react';
import { blogAPI, uploadsAPI } from '../../services/api';

const CATEGORIES = ['Travel', 'Hospitality', 'Local Attractions', 'Guest Tips'];
const STATUS_COLORS = {
  published: 'bg-green-100 text-green-700',
  draft:     'bg-yellow-100 text-yellow-700',
  hidden:    'bg-gray-100 text-gray-500',
};

const EMPTY_FORM = {
  title: '', slug: '', excerpt: '', content: '', featuredImage: '',
  category: CATEGORIES[0], tags: '', author: 'Phokela Guest House',
  status: 'draft', publishedAt: '',
  seo: { metaTitle: '', metaDescription: '', keywords: '' },
};

function slugify(str) {
  return str.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').trim();
}

function formatDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-ZA', { year: 'numeric', month: 'short', day: 'numeric' });
}

const AdminBlog = () => {
  const [posts, setPosts]         = useState([]);
  const [loading, setLoading]     = useState(true);
  const [loadError, setLoadError] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editPost, setEditPost]   = useState(null); // null = create mode
  const [form, setForm]           = useState(EMPTY_FORM);
  const [saving, setSaving]       = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError]         = useState('');
  const [search, setSearch]       = useState('');
  const [activeTab, setActiveTab] = useState('content'); // 'content' | 'seo'
  const fileRef = useRef(null);

  const load = async () => {
    setLoading(true);
    setLoadError('');
    try {
      const res = await blogAPI.getAll();
      if (res.success) {
        setPosts(res.data);
      } else {
        setLoadError('Failed to load blog posts.');
      }
    } catch {
      setLoadError('Failed to load blog posts. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => {
    setEditPost(null);
    setForm(EMPTY_FORM);
    setActiveTab('content');
    setError('');
    setModalOpen(true);
  };

  const openEdit = (post) => {
    setEditPost(post);
    setForm({
      title:        post.title,
      slug:         post.slug,
      excerpt:      post.excerpt,
      content:      post.content,
      featuredImage: post.featuredImage || '',
      category:     post.category,
      tags:         Array.isArray(post.tags) ? post.tags.join(', ') : '',
      author:       post.author,
      status:       post.status,
      publishedAt:  post.publishedAt ? post.publishedAt.slice(0, 10) : '',
      seo:          post.seo || { metaTitle: '', metaDescription: '', keywords: '' },
    });
    setActiveTab('content');
    setError('');
    setModalOpen(true);
  };

  const handleField = (key, value) => {
    setForm(prev => {
      const next = { ...prev, [key]: value };
      if (key === 'title' && !editPost) next.slug = slugify(value);
      return next;
    });
  };

  const handleSeo = (key, value) => {
    setForm(prev => ({ ...prev, seo: { ...prev.seo, [key]: value } }));
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const res = await uploadsAPI.uploadSingle(file);
      if (res.success) handleField('featuredImage', res.data.url);
    } catch {
      setError('Image upload failed.');
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    setError('');
    if (!form.title.trim() || !form.excerpt.trim() || !form.content.trim() || !form.author.trim()) {
      setError('Title, excerpt, content, and author are required.');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        ...form,
        tags: form.tags ? form.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
        publishedAt: form.publishedAt || null,
      };
      const res = editPost
        ? await blogAPI.update(editPost.id, payload)
        : await blogAPI.create(payload);
      if (res.success) {
        setModalOpen(false);
        load();
      } else {
        setError(res.message || 'Save failed.');
      }
    } catch (err) {
      setError(err.message || 'Save failed.');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleStatus = async (post) => {
    const next = post.status === 'published' ? 'draft' : 'published';
    try {
      await blogAPI.updateStatus(post.id, next);
      load();
    } catch {
      alert('Failed to update post status. Please try again.');
    }
  };

  const handleDelete = async (post) => {
    if (!window.confirm(`Delete "${post.title}"? This cannot be undone.`)) return;
    try {
      await blogAPI.delete(post.id);
      load();
    } catch {
      alert('Failed to delete post. Please try again.');
    }
  };

  const filtered = posts.filter(p =>
    (p.title || '').toLowerCase().includes(search.toLowerCase()) ||
    (p.category || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Blog Posts</h1>
          <p className="text-gray-500 text-sm mt-1">{posts.length} total posts</p>
        </div>
        <button
          onClick={openCreate}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
        >
          + New Post
        </button>
      </div>

      {/* Search */}
      <div className="mb-4">
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search by title or category…"
          className="border border-gray-200 rounded-lg px-4 py-2 text-sm w-full max-w-xs focus:outline-none focus:border-blue-400"
        />
      </div>

      {/* Load error */}
      {loadError && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4 flex items-center justify-between">
          <span>{loadError}</span>
          <button onClick={load} className="ml-4 text-sm font-medium underline hover:no-underline">Retry</button>
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-xl shadow overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-gray-400">Loading…</div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-gray-400">
            {loadError ? 'Failed to load posts.' : search ? 'No posts match your search.' : 'No blog posts yet. Create your first post!'}
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Title</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600 hidden md:table-cell">Category</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Status</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600 hidden lg:table-cell">Date</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600 hidden lg:table-cell">Source</th>
                <th className="text-right px-4 py-3 font-semibold text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map(post => (
                <tr key={post.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="font-medium text-gray-900 line-clamp-1">{post.title}</div>
                    <div className="text-xs text-gray-400">/blog/{post.slug}</div>
                  </td>
                  <td className="px-4 py-3 text-gray-600 hidden md:table-cell">{post.category}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium capitalize ${STATUS_COLORS[post.status] || 'bg-gray-100 text-gray-500'}`}>
                      {post.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-500 hidden lg:table-cell">
                    {formatDate(post.publishedAt || post.createdAt)}
                  </td>
                  <td className="px-4 py-3 text-gray-500 capitalize hidden lg:table-cell">{post.source}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleToggleStatus(post)}
                        className={`text-xs px-2 py-1 rounded font-medium transition-colors ${
                          post.status === 'published'
                            ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                            : 'bg-green-100 text-green-700 hover:bg-green-200'
                        }`}
                      >
                        {post.status === 'published' ? 'Unpublish' : 'Publish'}
                      </button>
                      <button
                        onClick={() => openEdit(post)}
                        className="text-xs px-2 py-1 rounded bg-blue-100 text-blue-700 hover:bg-blue-200 font-medium transition-colors"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(post)}
                        className="text-xs px-2 py-1 rounded bg-red-100 text-red-700 hover:bg-red-200 font-medium transition-colors"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Create / Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 overflow-y-auto py-8 px-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl">
            {/* Modal header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-900">
                {editPost ? 'Edit Post' : 'New Blog Post'}
              </h2>
              <button onClick={() => setModalOpen(false)} className="text-gray-400 hover:text-gray-600 text-xl leading-none">✕</button>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-gray-100 px-6">
              {['content', 'seo'].map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`py-3 px-4 text-sm font-medium capitalize border-b-2 transition-colors ${
                    activeTab === tab ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {tab === 'seo' ? 'SEO' : 'Content'}
                </button>
              ))}
            </div>

            <div className="p-6 space-y-4">
              {error && <div className="bg-red-50 text-red-700 text-sm px-4 py-2 rounded-lg">{error}</div>}

              {activeTab === 'content' && (
                <>
                  {/* Title */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Title *</label>
                    <input
                      value={form.title}
                      onChange={e => handleField('title', e.target.value)}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400"
                      placeholder="Article title"
                    />
                  </div>

                  {/* Slug */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Slug</label>
                    <input
                      value={form.slug}
                      onChange={e => handleField('slug', slugify(e.target.value))}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:border-blue-400"
                      placeholder="auto-generated-from-title"
                    />
                  </div>

                  {/* Category & Author row */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1">Category *</label>
                      <select
                        value={form.category}
                        onChange={e => handleField('category', e.target.value)}
                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400"
                      >
                        {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1">Author *</label>
                      <input
                        value={form.author}
                        onChange={e => handleField('author', e.target.value)}
                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400"
                      />
                    </div>
                  </div>

                  {/* Status & Published date row */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1">Status</label>
                      <select
                        value={form.status}
                        onChange={e => handleField('status', e.target.value)}
                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400"
                      >
                        <option value="draft">Draft</option>
                        <option value="published">Published</option>
                        <option value="hidden">Hidden</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1">Published Date</label>
                      <input
                        type="date"
                        value={form.publishedAt}
                        onChange={e => handleField('publishedAt', e.target.value)}
                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400"
                      />
                    </div>
                  </div>

                  {/* Excerpt */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Excerpt * <span className="font-normal text-gray-400">(150–300 chars)</span></label>
                    <textarea
                      rows={3}
                      value={form.excerpt}
                      onChange={e => handleField('excerpt', e.target.value)}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400 resize-none"
                      placeholder="Short summary shown on the blog listing page"
                    />
                  </div>

                  {/* Featured Image */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Featured Image</label>
                    <div className="flex gap-2 items-center">
                      <input
                        value={form.featuredImage}
                        onChange={e => handleField('featuredImage', e.target.value)}
                        className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400"
                        placeholder="Paste image URL or upload"
                      />
                      <button
                        type="button"
                        onClick={() => fileRef.current?.click()}
                        disabled={uploading}
                        className="shrink-0 border border-gray-200 rounded-lg px-3 py-2 text-sm hover:bg-gray-50 disabled:opacity-60 transition-colors"
                      >
                        {uploading ? 'Uploading…' : 'Upload'}
                      </button>
                      <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                    </div>
                    {form.featuredImage && (
                      <img src={form.featuredImage} alt="preview" className="mt-2 h-24 rounded-lg object-cover border" />
                    )}
                  </div>

                  {/* Tags */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Tags <span className="font-normal text-gray-400">(comma-separated)</span></label>
                    <input
                      value={form.tags}
                      onChange={e => handleField('tags', e.target.value)}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400"
                      placeholder="travel, tips, accommodation"
                    />
                  </div>

                  {/* Content */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Content * <span className="font-normal text-gray-400">(HTML)</span></label>
                    <textarea
                      rows={14}
                      value={form.content}
                      onChange={e => handleField('content', e.target.value)}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:border-blue-400 resize-y"
                      placeholder="<p>Write your article here. You can use HTML tags for formatting.</p>"
                    />
                  </div>
                </>
              )}

              {activeTab === 'seo' && (
                <>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Meta Title</label>
                    <input
                      value={form.seo.metaTitle}
                      onChange={e => handleSeo('metaTitle', e.target.value)}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400"
                      placeholder="SEO page title (defaults to article title)"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Meta Description</label>
                    <textarea
                      rows={3}
                      value={form.seo.metaDescription}
                      onChange={e => handleSeo('metaDescription', e.target.value)}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400 resize-none"
                      placeholder="Brief description for search engines (defaults to excerpt)"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Keywords</label>
                    <input
                      value={form.seo.keywords}
                      onChange={e => handleSeo('keywords', e.target.value)}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400"
                      placeholder="keyword1, keyword2, keyword3"
                    />
                  </div>
                </>
              )}
            </div>

            {/* Modal footer */}
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100">
              <button
                onClick={() => setModalOpen(false)}
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-60 transition-colors"
              >
                {saving ? 'Saving…' : editPost ? 'Save Changes' : 'Create Post'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminBlog;
