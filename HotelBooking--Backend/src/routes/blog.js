const express = require('express');
const router = express.Router();
const { Op } = require('sequelize');
const { BlogPost } = require('../models');
const auth = require('../middleware/auth');

// ── Helpers ────────────────────────────────────────────────────────────────────

function generateSlug(title) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}

async function uniqueSlug(base, excludeId = null) {
  let slug = base;
  let counter = 1;
  while (true) {
    const where = { slug };
    if (excludeId) where.id = { [Op.ne]: excludeId };
    const existing = await BlogPost.findOne({ where });
    if (!existing) return slug;
    slug = `${base}-${counter++}`;
  }
}

// ── Public routes (no auth) ────────────────────────────────────────────────────

// GET /api/blog/public/categories
router.get('/public/categories', async (req, res) => {
  try {
    const rows = await BlogPost.findAll({
      attributes: ['category'],
      where: { status: 'published' },
      group: ['category'],
      order: [['category', 'ASC']],
    });
    const categories = rows.map(r => r.category);
    res.json({ success: true, data: categories });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/blog/public/search?q=keyword&category=&page=1&limit=6
router.get('/public/search', async (req, res) => {
  try {
    const { q = '', category, page = 1, limit = 6 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    const where = { status: 'published' };
    if (category) where.category = category;
    if (q) {
      where[Op.or] = [
        { title:   { [Op.like]: `%${q}%` } },
        { excerpt: { [Op.like]: `%${q}%` } },
        { content: { [Op.like]: `%${q}%` } },
        { author:  { [Op.like]: `%${q}%` } },
      ];
    }

    const { count, rows } = await BlogPost.findAndCountAll({
      where,
      order: [['publishedAt', 'DESC'], ['createdAt', 'DESC']],
      limit:  parseInt(limit),
      offset,
      attributes: { exclude: ['content'] },
    });

    res.json({
      success: true,
      data: rows,
      pagination: {
        total: count,
        page:  parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(count / parseInt(limit)),
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/blog/public?page=1&limit=6&category=
router.get('/public', async (req, res) => {
  try {
    const { page = 1, limit = 6, category } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    const where = { status: 'published' };
    if (category) where.category = category;

    const { count, rows } = await BlogPost.findAndCountAll({
      where,
      order: [['publishedAt', 'DESC'], ['createdAt', 'DESC']],
      limit:  parseInt(limit),
      offset,
      attributes: { exclude: ['content'] },
    });

    res.json({
      success: true,
      data: rows,
      pagination: {
        total: count,
        page:  parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(count / parseInt(limit)),
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/blog/public/:slug — must come after /public/categories and /public/search
router.get('/public/:slug', async (req, res) => {
  try {
    const post = await BlogPost.findOne({
      where: { slug: req.params.slug, status: 'published' },
    });
    if (!post) return res.status(404).json({ success: false, message: 'Post not found' });
    res.json({ success: true, data: post });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ── Admin routes (auth required) ───────────────────────────────────────────────

// GET /api/blog — all posts for admin
router.get('/', auth, async (req, res) => {
  try {
    const posts = await BlogPost.findAll({
      order: [['createdAt', 'DESC']],
    });
    res.json({ success: true, data: posts });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/blog — create post
router.post('/', auth, async (req, res) => {
  try {
    const { title, slug: rawSlug, excerpt, content, featuredImage, category,
            tags, author, status, publishedAt, seo } = req.body;

    if (!title || !excerpt || !content || !category || !author) {
      return res.status(400).json({ success: false, message: 'title, excerpt, content, category, and author are required' });
    }

    const base = rawSlug ? generateSlug(rawSlug) : generateSlug(title);
    const slug = await uniqueSlug(base);

    const post = await BlogPost.create({
      title, slug, excerpt, content, featuredImage, category,
      tags: tags || [],
      author,
      source: 'manual',
      status: status || 'draft',
      publishedAt: status === 'published' ? (publishedAt || new Date()) : publishedAt || null,
      seo: seo || {},
    });

    res.status(201).json({ success: true, data: post });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/blog/:id — single post by id (admin)
router.get('/:id', auth, async (req, res) => {
  try {
    const post = await BlogPost.findByPk(req.params.id);
    if (!post) return res.status(404).json({ success: false, message: 'Post not found' });
    res.json({ success: true, data: post });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// PUT /api/blog/:id — update post
router.put('/:id', auth, async (req, res) => {
  try {
    const post = await BlogPost.findByPk(req.params.id);
    if (!post) return res.status(404).json({ success: false, message: 'Post not found' });

    const { title, slug: rawSlug, excerpt, content, featuredImage, category,
            tags, author, status, publishedAt, seo } = req.body;

    // Regenerate slug only if title or slug field changed
    let slug = post.slug;
    if (rawSlug && rawSlug !== post.slug) {
      slug = await uniqueSlug(generateSlug(rawSlug), post.id);
    } else if (title && title !== post.title && !rawSlug) {
      slug = await uniqueSlug(generateSlug(title), post.id);
    }

    // Auto-set publishedAt when first publishing
    let resolvedPublishedAt = publishedAt !== undefined ? publishedAt : post.publishedAt;
    if (status === 'published' && !post.publishedAt && !publishedAt) {
      resolvedPublishedAt = new Date();
    }

    await post.update({
      title:        title        !== undefined ? title        : post.title,
      slug,
      excerpt:      excerpt      !== undefined ? excerpt      : post.excerpt,
      content:      content      !== undefined ? content      : post.content,
      featuredImage: featuredImage !== undefined ? featuredImage : post.featuredImage,
      category:     category     !== undefined ? category     : post.category,
      tags:         tags         !== undefined ? tags         : post.tags,
      author:       author       !== undefined ? author       : post.author,
      status:       status       !== undefined ? status       : post.status,
      publishedAt:  resolvedPublishedAt,
      seo:          seo          !== undefined ? seo          : post.seo,
    });

    res.json({ success: true, data: post });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// PATCH /api/blog/:id/status — toggle publish/unpublish/hide
router.patch('/:id/status', auth, async (req, res) => {
  try {
    const post = await BlogPost.findByPk(req.params.id);
    if (!post) return res.status(404).json({ success: false, message: 'Post not found' });

    const { status } = req.body;
    if (!['published', 'draft', 'hidden'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status' });
    }

    const publishedAt = status === 'published' && !post.publishedAt ? new Date() : post.publishedAt;
    await post.update({ status, publishedAt });

    res.json({ success: true, data: post });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// DELETE /api/blog/:id — delete post
router.delete('/:id', auth, async (req, res) => {
  try {
    const post = await BlogPost.findByPk(req.params.id);
    if (!post) return res.status(404).json({ success: false, message: 'Post not found' });
    await post.destroy();
    res.json({ success: true, message: 'Post deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
