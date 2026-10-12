# ============================================================
# Cloudflare DNS - CRM EUROVIA
# ============================================================

# Configuração DNS para apontar para Vercel

# ===========================================
# ZONA: crm-eurovia.com (exemplo)
# Substitua pelo seu domínio real
# ===========================================

# Record A - Aponta para Vercel
# Tipo: A
# Name: @
# Content: 76.76.21.21 (IP do Vercel)
# Proxy status: DNS only (cinza) → depois para Proxy (orange)

# Record CNAME - WWW
# Tipo: CNAME
# Name: www
# Content: cname.vercel-dns.com
# Proxy status: Proxy (recomendado)

# Record CNAME - WWW alternativo
# Tipo: CNAME
# Name: www
# Content: [seu-projeto].vercel.app
# Proxy status: Proxy

# ===========================================
# SSL/TLS
# ===========================================
# Dashboard → SSL/TLS → Overview
# Modo: Full (stricto) ou Full (strict)
# 
# Para Vercel com Cloudflare:
# - TLS 1.2+ enabled
# - TLS 1.3 enabled
# - Automatic HTTPS Rewrites: ON

# ===========================================
# WAF (Web Application Firewall)
# ===========================================
# Dashboard → Security → WAF

# Regras recomendadas:
# - Bloquear requests de User-Agents maliciosos
# - Rate limiting para /api/* (ex: 100 req/min)
# - Proteger contra SQL injection (ja incluso)
# - Proteger contra XSS (ja incluso)

# ===========================================
# Page Rules (se usar Cloudflare Pages)
# ===========================================
# Se usar Cloudflare Pages (alternativa ao Vercel):
# 
# URL: crm-eurovia.com/*
# Setting: Cache Level → Cache Everything
# 
# URL: crm-eurovia.com/api/*
# Setting: Cache Level → Bypass

# ===========================================
# Performance
# ===========================================
# Dashboard → Speed → Overview
# - Auto Minify: HTML, CSS, JS
# - Brotli: ON
# - Rocket Loader: OFF (pode conflitar com React)
# - Polish: Smart (para imagens)

# ===========================================
# Caching (CDN)
# ===========================================
# Dashboard → Caching → Configuration
# 
# Browser Cache TTL: Respect Existing Headers
# Cache Key: Include all parameters (exceto utm_*)

# ===========================================
# Security Headers (via Transform Rules)
# ===========================================
# Dashboard → Rules → Transform Rules → Modify Response Headers
# 
# Adicionar headers:
# - X-Content-Type-Options: nosniff
# - X-Frame-Options: DENY
# - X-XSS-Protection: 1; mode=block
# - Referrer-Policy: strict-origin-when-cross-origin
# - Permissions-Policy: camera=(), microphone=(), geolocation=()

# ===========================================
# Workers (serverless, opcional)
# ===========================================
# Se precisar de lógica customizada no edge:
# 
# addEventListener('fetch', event => {
#   event.respondWith(handleRequest(event.request))
# })
