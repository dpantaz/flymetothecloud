---
layout: default
title: Tags
permalink: /tags/
---
<div class="single-post">
  <header class="single-header">
    <h1 class="single-title">Tags</h1>
  </header>

  <div class="tag-cloud" style="margin-bottom:26px;">
    {% assign tags = site.tags | sort %}
    {% for tag in tags %}
      <a class="tag-pill" href="#{{ tag[0] | slugify }}">{{ tag[0] }} ({{ tag[1] | size }})</a>
    {% endfor %}
  </div>

  {% for tag in tags %}
  <section id="{{ tag[0] | slugify }}" style="margin-bottom:24px;">
    <h2 style="font-family:'Raleway',sans-serif;color:var(--ink);font-weight:500;font-size:20px;">{{ tag[0] }}</h2>
    <ul>
      {% assign posts = tag[1] | sort: "date" | reverse %}
      {% for post in posts %}
        <li><a href="{{ post.url | relative_url }}">{{ post.title }}</a>
          <span style="color:#8a99a8;font-size:12px;">— {{ post.date | date: "%b %-d, %Y" }}</span></li>
      {% endfor %}
    </ul>
  </section>
  {% endfor %}
</div>
