#!/usr/bin/env python3
"""Gera dist/index.html (arquivo único) a partir de src/."""
import pathlib
root = pathlib.Path(__file__).parent
src = root / 'src'
css = (src / 'styles.css').read_text()
js = '\n'.join((src / f).read_text() for f in ['data.js', 'engine.js', 'exercises.js', 'ui-core.js', 'ui-apps1.js', 'ui-apps2.js', 'ui-apps3.js', 'ui-main.js'])
html = f'''<title>Simulador SAP TM</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500&family=Source+Sans+3:wght@300;400;600;700&display=swap">
<style>
{css}
</style>
<div id="app"></div>
<script>
{js}
</script>
'''
(root / 'dist').mkdir(exist_ok=True)
(root / 'dist' / 'index.html').write_text(html)
print('dist/index.html', len(html), 'bytes')
# Versão para hospedagem estática (GitHub Pages, Netlify etc.)
site = root / 'site'
site.mkdir(exist_ok=True)
head = '''<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="description" content="Simulador educacional de SAP Transportation Management (S/4HANA) para treinar o fluxo de transporte com dados fictícios.">
'''
body = html.replace('<div id="app"></div>', '</head>\n<body>\n<div id="app"></div>', 1)
(site / 'index.html').write_text(head + body + '</body>\n</html>\n')
print('site/index.html ok')
