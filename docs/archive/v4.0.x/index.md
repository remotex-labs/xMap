---
layout: home
title: 'xMap'
titleTemplate: 'Source maps and CLI error visualization for TypeScript'
hero:
  name: 'xMap'
  text: 'Source maps, stack traces, and code formatting'
  tagline: xMap is a TypeScript library for parsing source maps and stacks, formatting and highlighting code, and producing CLI-friendly error reports.
  actions:
    - theme: brand
      text: Get Started
      link: ./guide
    - theme: alt
      text: SourceService
      link: ./services/source
    - theme: alt
      text: GitHub
      link: https://github.com/remotex-labs/xMap
  image:
    src: /logo.png
    alt: 'xMap logo'
features:
  - title: Source map processing
    icon: 🗺️
    details: Parse and query source maps to map generated positions back to original code with `SourceService`.
  - title: Stack trace parsing
    icon: 🧾
    details: Normalize stacks from V8, SpiderMonkey, and JavaScriptCore into structured frames.
  - title: Code formatting
    icon: 🧱
    details: Format snippets with line numbers, padding, and per-line actions for CLI output.
  - title: Syntax highlighting
    icon: 🎨
    details: Semantic TypeScript highlighting with customizable color schemes.
  - title: Error visualization
    icon: 🚨
    details: Render code frames and indicators suitable for logs and terminal UIs.
  - title: Subpath imports
    icon: 📦
    details: Keep bundles small by importing only the components you need.
---
