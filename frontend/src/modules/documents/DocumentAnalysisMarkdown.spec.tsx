import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { DocumentAnalysisMarkdown } from './DocumentAnalysisMarkdown.js';

describe('DocumentAnalysisMarkdown', () => {
  it('renders common Markdown and GFM structures semantically', () => {
    const markup = renderToStaticMarkup(
      <DocumentAnalysisMarkdown>{`
## Resultado

1. **Objetivo:** identificar riscos.
2. ~~Hipótese descartada~~

| Cláusula | Risco |
| --- | --- |
| Rescisão | Alto |

- [x] Revisado
`}</DocumentAnalysisMarkdown>,
    );

    expect(markup).toContain('<h2>Resultado</h2>');
    expect(markup).toContain('<ol>');
    expect(markup).toContain('<strong>Objetivo:</strong>');
    expect(markup).toContain('<del>Hipótese descartada</del>');
    expect(markup).toContain('<table>');
    expect(markup).toContain('type="checkbox"');
  });

  it('does not render raw HTML or remote Markdown images', () => {
    const markup = renderToStaticMarkup(
      <DocumentAnalysisMarkdown>{`
<script>alert('unsafe')</script>

<strong>HTML bruto</strong>

![rastreador](https://example.com/tracker.png)
`}</DocumentAnalysisMarkdown>,
    );

    expect(markup).not.toContain('<script');
    expect(markup).not.toContain('<img');
    expect(markup).not.toContain('tracker.png');
    expect(markup).not.toContain('<strong>HTML bruto</strong>');
  });

  it('opens safe Markdown links without giving the new page opener access', () => {
    const markup = renderToStaticMarkup(
      <DocumentAnalysisMarkdown>
        {'[Fonte](https://example.com/documento)'}
      </DocumentAnalysisMarkdown>,
    );

    expect(markup).toContain('href="https://example.com/documento"');
    expect(markup).toContain('target="_blank"');
    expect(markup).toContain('rel="noopener noreferrer"');
  });
});
