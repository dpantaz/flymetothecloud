# Fly Me To The Cloud — Jekyll site (migrated from WordPress)

Static blog served by **GitHub Pages** at **https://flymetothecloud.com**,
migrated from WordPress. Built with Jekyll + the Minima theme.

## One-time: get your content out of WordPress

1. In WordPress admin go to **Tools → Export**.
2. Choose **All content** and download the `.xml` file (this is a *WXR* export).
3. Note your permalink structure under **Settings → Permalinks** — the Jekyll
   `permalink:` in `_config.yml` must match it exactly to preserve SEO.

## Convert the export to Jekyll posts

No Ruby or Python needed for this step — the converter runs on **Node.js**
(only dependency: `fast-xml-parser`). Install deps once, then run:

```powershell
npm install
node scripts\wxr_to_jekyll.mjs `
  --input path\to\export.xml `
  --output . `
  --download-media `
  --old-domain https://flymetothecloud.com `
  --old-domain https://www.flymetothecloud.com
```

This creates `_posts/YYYY-MM-DD-slug.md` files with front matter (title, date,
categories, tags, `redirect_from`), strips Gutenberg block comments, downloads
all referenced media **preserving the original `/wp-content/uploads/...` paths**
(so existing image tags keep working with no rewriting), and rewrites any
absolute media URLs to site-root-relative paths. Add `--drafts` to also emit
drafts. `--media-base` (defaults to the first `--old-domain`) is the origin the
downloader fetches media from.

## Preview locally (needs Ruby + Bundler)

```powershell
bundle install
bundle exec jekyll serve
```

Then open http://127.0.0.1:4000. If Ruby isn't installed on Windows, install it
with `winget install RubyInstallerTeam.RubyWithDevKit.3.3` and run `ridk install`.
GitHub Pages will build the site remotely regardless, so local preview is
optional but recommended for validation.

## Deploy

The site is a normal GitHub repo. GitHub Pages builds it on every push to
`main`. Settings → Pages → Source: **Deploy from a branch** → `main` / root.

### Custom domain (flymetothecloud.com)

- The `CNAME` file (containing `flymetothecloud.com`) is already committed.
- DNS records at your domain registrar:
  - Apex `A` records → GitHub Pages IPs:
    `185.199.108.153`, `185.199.109.153`, `185.199.110.153`, `185.199.111.153`
  - Apex `AAAA` records → `2606:50c0:8000::153`, `2606:50c0:8001::153`,
    `2606:50c0:8002::153`, `2606:50c0:8003::153`
  - (Optional) `www` `CNAME` → `dpantaz.github.io`
- In Settings → Pages, set the custom domain and enable **Enforce HTTPS**
  once the certificate has provisioned.

## Preserving URLs

`_config.yml` `permalink:` is set to `/:year/:month/:day/:title/` (WordPress
"Day and name"). Change it to match your actual WordPress setting. Every post
also carries `redirect_from:` with its original path, so `jekyll-redirect-from`
serves a redirect for any URL that can't be reproduced 1:1.
