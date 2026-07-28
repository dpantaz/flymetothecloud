---
layout: default
title: Search
permalink: /search/
---
<div class="single-post">
  <header class="single-header">
    <h1 class="single-title">Search</h1>
  </header>

  <input type="search" id="search-input" placeholder="Search posts…"
    style="width:100%;padding:12px 14px;border:1px solid #d8dee3;border-radius:4px;font-size:15px;margin-bottom:20px;">

  <div id="search-results" class="post-list-lite"></div>
</div>

<script>
(function () {
  var input = document.getElementById('search-input');
  var out = document.getElementById('search-results');
  var data = [];

  fetch('{{ "/search.json" | relative_url }}')
    .then(function (r) { return r.json(); })
    .then(function (j) { data = j; render(''); });

  function esc(s) { return (s || '').replace(/[&<>"]/g, function (c) {
    return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
  }); }

  function render(q) {
    q = q.trim().toLowerCase();
    var items = !q ? data : data.filter(function (p) {
      return (p.title + ' ' + p.summary + ' ' + p.tags).toLowerCase().indexOf(q) !== -1;
    });
    if (!items.length) { out.innerHTML = '<p>No posts found.</p>'; return; }
    out.innerHTML = items.map(function (p) {
      return '<article style="background:#fff;box-shadow:var(--card-shadow);padding:18px 22px;margin-bottom:16px;">' +
        '<h3 style="margin:0 0 6px;font-family:Raleway,sans-serif;font-weight:500;">' +
        '<a href="' + p.url + '">' + esc(p.title) + '</a></h3>' +
        '<p class="card-meta" style="margin:0 0 8px;">' + esc(p.date) +
        (p.tags ? ' / ' + esc(p.tags) : '') + '</p>' +
        '<p style="margin:0;color:var(--body);">' + esc(p.summary) + '</p></article>';
    }).join('');
  }

  input.addEventListener('input', function () { render(input.value); });
}());
</script>
