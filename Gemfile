source "https://rubygems.org"

# GitHub Pages builds Jekyll natively. Pinning to the github-pages gem keeps
# your local build in lock-step with GitHub's build environment.
# Docs: https://pages.github.com/versions/
gem "github-pages", group: :jekyll_plugins

# Plugins allowed by GitHub Pages that we rely on.
group :jekyll_plugins do
  gem "jekyll-feed"          # generates /feed.xml
  gem "jekyll-sitemap"       # generates /sitemap.xml
  gem "jekyll-seo-tag"       # <head> SEO meta tags
  gem "jekyll-redirect-from" # preserve old URLs that can't be reproduced 1:1
end

# Windows and JRuby do not include zoneinfo files, so bundle the tzinfo-data gem
# and associated library.
platforms :mingw, :x64_mingw, :mswin, :jruby do
  gem "tzinfo", ">= 1", "< 3"
  gem "tzinfo-data"
end

# Lock http_parser.rb gem to v0.6.x on JRuby builds.
gem "http_parser.rb", "~> 0.6.0", :platforms => [:jruby]
