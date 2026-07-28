#!/usr/bin/env node
/**
 * Convert a WordPress WXR export (Tools -> Export -> All content) into Jekyll
 * posts + pages, ready for GitHub Pages.
 *
 * Node.js. Only dependency: fast-xml-parser (see package.json).
 * No Ruby or Python required for the conversion step.
 *
 * Usage:
 *   node scripts/wxr_to_jekyll.mjs \
 *     --input export.xml --output . --download-media \
 *     --old-domain https://flymetothecloud.com \
 *     --old-domain https://www.flymetothecloud.com [--drafts]
 *
 * What it does:
 *   * Emits published posts to _posts/YYYY-MM-DD-slug.md
 *   * Emits published pages to <slug>.md (with permalink)
 *   * Front matter: layout, title, date, categories, tags, redirect_from
 *   * wpautop-style transform so paragraph breaks render correctly
 *   * Optionally downloads media and rewrites in-content media URLs to
 *     local /assets/images/ paths
 */
import { XMLParser } from "fast-xml-parser";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

function parseArgs(argv) {
  const args = { input: null, output: ".", drafts: false, downloadMedia: false, mediaBase: null, oldDomains: [] };
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--input") args.input = argv[++i];
    else if (a === "--output") args.output = argv[++i];
    else if (a === "--drafts") args.drafts = true;
    else if (a === "--download-media") args.downloadMedia = true;
    else if (a === "--media-base") args.mediaBase = argv[++i];
    else if (a === "--old-domain") args.oldDomains.push(argv[++i]);
    else { console.error(`Unknown arg: ${a}`); process.exit(2); }
  }
  if (!args.input) { console.error("ERROR: --input <export.xml> is required"); process.exit(2); }
  if (!args.mediaBase && args.oldDomains.length) args.mediaBase = args.oldDomains[0];
  return args;
}

function unescapeHtml(s) {
  return (s || "")
    .replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"').replace(/&#0?39;/g, "'").replace(/&apos;/g, "'");
}

function slugify(v) {
  v = unescapeHtml((v || "").replace(/<[^>]+>/g, "")).trim().toLowerCase();
  v = v.replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  return v || "post";
}

function parseDate(raw) {
  if (!raw) return null;
  const m = String(raw).trim().match(/^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2}):(\d{2})/);
  if (!m) return null;
  const [, y, mo, d, h, mi, s] = m.map(Number);
  const dt = new Date(Date.UTC(y, mo - 1, d, h, mi, s));
  return isNaN(dt.getTime()) ? null : { dt, y, mo, d };
}

const BLOCK_RE = /^\s*<\/?(?:p|div|ul|ol|li|table|thead|tbody|tr|td|th|blockquote|pre|h[1-6]|figure|figcaption|hr|iframe|img|script|style|section|article|header|footer|aside|nav|form)\b/i;

// Remove Gutenberg block-editor delimiters like <!-- wp:paragraph --> and
// <!-- /wp:list -->, but keep the WordPress <!--more--> excerpt marker.
function stripGutenberg(content) {
  return (content || "").replace(/<!--\s*\/?wp:[^>]*?-->/g, "");
}

function wpautop(content) {
  if (!content) return "";
  content = content.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  const blocks = content.trim().split(/\n\s*\n/);
  const out = [];
  for (let b of blocks) {
    b = b.trim();
    if (!b) continue;
    if (BLOCK_RE.test(b)) out.push(b);
    else out.push(`<p>${b.replace(/\n/g, "<br>\n")}</p>`);
  }
  return out.join("\n\n");
}

function yamlEscape(v) {
  return `"${(v || "").replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`;
}

function pad(n) { return String(n).padStart(2, "0"); }

// Turn any media reference into a site-root-relative path we preserve on disk,
// e.g. "https://site.com/wp-content/uploads/2020/07/image.png" or
// "/wp-content/uploads/2020/07/image.png" -> "wp-content/uploads/2020/07/image.png".
function toRelMediaPath(ref) {
  let p;
  try { p = new URL(ref).pathname; } catch { p = ref.split(/[?#]/)[0]; }
  try { p = decodeURIComponent(p); } catch { /* keep raw */ }
  return p.replace(/^\/+/, "");
}

const MEDIA_EXT = /\.(png|jpe?g|gif|webp|svg|pdf|zip|mp4|mp3|docx?|pptx?)$/i;

function asArray(x) { return x == null ? [] : Array.isArray(x) ? x : [x]; }

function buildFrontMatter(fields) {
  const lines = ["---"];
  for (const [key, val] of fields) {
    if (val == null) continue;
    if (Array.isArray(val)) {
      if (val.length === 0) continue;
      lines.push(`${key}:`);
      for (const v of val) lines.push(`  - ${yamlEscape(v)}`);
    } else if (typeof val === "boolean") {
      lines.push(`${key}: ${val ? "true" : "false"}`);
    } else {
      lines.push(`${key}: ${val}`);
    }
  }
  lines.push("---");
  return lines.join("\n");
}

async function downloadFile(url, dest) {
  const res = await fetch(url, { headers: { "User-Agent": "wxr2jekyll" } });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  fs.writeFileSync(dest, buf);
}

async function main() {
  const args = parseArgs(process.argv);
  const xml = fs.readFileSync(args.input, "utf-8");
  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: "@_",
    cdataPropName: "__cdata",
    trimValues: false,
  });
  const doc = parser.parse(xml);
  const channel = doc?.rss?.channel;
  if (!channel) { console.error("ERROR: no <channel> found — is this a valid WXR export?"); process.exit(1); }

  const postsDir = path.join(args.output, "_posts");
  const draftsDir = path.join(args.output, "_drafts");
  fs.mkdirSync(postsDir, { recursive: true });

  const mediaPaths = new Set();
  const stats = { post: 0, page: 0, draft: 0, skipped: 0, media: 0 };

  function pick(node, key) {
    const v = node?.[key];
    if (v == null) return "";
    if (typeof v === "object") return v.__cdata != null ? String(v.__cdata) : (v["#text"] != null ? String(v["#text"]) : "");
    return String(v);
  }

  function collectMedia(str) {
    if (!str) return;
    // absolute references under one of the old domains
    for (const dom of args.oldDomains) {
      const re = new RegExp(dom.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "/[^\\s\"'<>\\)]+", "g");
      for (const url of new Set(str.match(re) || [])) {
        if (MEDIA_EXT.test(url.split(/[?#]/)[0])) mediaPaths.add(toRelMediaPath(url));
      }
    }
    // root-relative references, e.g. /wp-content/uploads/...
    for (const url of new Set(str.match(/\/wp-content\/[^\s"'<>\)]+/g) || [])) {
      if (MEDIA_EXT.test(url.split(/[?#]/)[0])) mediaPaths.add(toRelMediaPath(url));
    }
  }

  // Rewrite absolute old-domain media URLs in post bodies down to site-root-
  // relative paths (which we preserve on disk). Root-relative refs already work.
  function localize(content) {
    collectMedia(content);
    for (const dom of args.oldDomains) {
      const re = new RegExp(dom.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "/[^\\s\"'<>\\)]+", "g");
      for (const url of new Set(content.match(re) || [])) {
        if (MEDIA_EXT.test(url.split(/[?#]/)[0])) {
          content = content.split(url).join("/" + toRelMediaPath(url));
        }
      }
    }
    return content;
  }

  const items = asArray(channel.item);
  for (const item of items) {
    const postType = pick(item, "wp:post_type");
    const status = pick(item, "wp:status");
    const title = unescapeHtml(pick(item, "title")).trim();
    const name = pick(item, "wp:post_name").trim();
    const link = pick(item, "link").trim();
    const parsed = parseDate(pick(item, "wp:post_date"));

    if (postType === "attachment") {
      const att = pick(item, "wp:attachment_url");
      if (att && MEDIA_EXT.test(att.split(/[?#]/)[0])) mediaPaths.add(toRelMediaPath(att));
      continue;
    }
    if (postType !== "post" && postType !== "page") { stats.skipped++; continue; }

    let content = localize(stripGutenberg(pick(item, "content:encoded")));
    content = wpautop(content);

    const slug = name || slugify(title);
    const categories = [], tags = [];
    for (const c of asArray(item.category)) {
      if (typeof c !== "object") continue;
      const domain = c["@_domain"]; const val = (c["#text"] ?? c.__cdata ?? "").toString().trim();
      if (!val) continue;
      if (domain === "category") categories.push(val);
      else if (domain === "post_tag") tags.push(val);
    }
    const uniq = (a) => [...new Set(a)].sort();
    let redirectPath = "";
    try { redirectPath = link ? new URL(link).pathname : ""; } catch { redirectPath = ""; }
    if (redirectPath.includes("?")) redirectPath = "";
    if (redirectPath === "/") redirectPath = "";
    const isPublished = status === "publish";

    if (postType === "page") {
      if (!isPublished) { stats.skipped++; continue; }
      const fm = buildFrontMatter([
        ["layout", "page"],
        ["title", yamlEscape(title)],
        ["permalink", redirectPath || `/${slug}/`],
      ]);
      fs.writeFileSync(path.join(args.output, `${slug}.md`), fm + "\n\n" + content + "\n");
      stats.page++;
      continue;
    }

    if (!isPublished && !args.drafts) { stats.skipped++; continue; }

    const dateStr = parsed ? `${parsed.y}-${pad(parsed.mo)}-${pad(parsed.d)} ${pick(item, "wp:post_date").slice(11, 19)} +0000` : null;
    const fields = [
      ["layout", "post"],
      ["title", yamlEscape(title)],
      ["date", dateStr],
      ["categories", uniq(categories)],
      ["tags", uniq(tags)],
    ];
    if (redirectPath) fields.push(["redirect_from", [redirectPath]]);
    const fm = buildFrontMatter(fields);
    const datePrefix = parsed ? `${parsed.y}-${pad(parsed.mo)}-${pad(parsed.d)}` : "1970-01-01";

    let outPath;
    if (isPublished) { outPath = path.join(postsDir, `${datePrefix}-${slug}.md`); stats.post++; }
    else { fs.mkdirSync(draftsDir, { recursive: true }); outPath = path.join(draftsDir, `${slug}.md`); stats.draft++; }
    fs.writeFileSync(outPath, fm + "\n\n" + content + "\n");
  }

  if (args.downloadMedia && mediaPaths.size) {
    if (!args.mediaBase) {
      console.error("  ! --download-media needs --media-base or --old-domain to resolve URLs");
    } else {
      const base = args.mediaBase.replace(/\/+$/, "");
      for (const rel of [...mediaPaths].sort()) {
        const dest = path.join(args.output, rel);
        if (fs.existsSync(dest)) { continue; }
        fs.mkdirSync(path.dirname(dest), { recursive: true });
        const url = base + "/" + rel;
        try { await downloadFile(url, dest); stats.media++; }
        catch (e) { console.error(`  ! media failed: ${url} (${e.message})`); }
      }
    }
  }

  console.log("Done.");
  console.log(`  posts:   ${stats.post}`);
  console.log(`  pages:   ${stats.page}`);
  console.log(`  drafts:  ${stats.draft}`);
  console.log(`  media:   ${stats.media} downloaded (${mediaPaths.size} referenced)`);
  console.log(`  skipped: ${stats.skipped}`);
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) main().catch((e) => { console.error(e); process.exit(1); });
