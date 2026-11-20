import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface DocumentAnalysisMarkdownProps {
  children: string;
}

export function DocumentAnalysisMarkdown({
  children,
}: DocumentAnalysisMarkdownProps) {
  return (
    <div className="document-analysis-markdown">
      <Markdown
        remarkPlugins={[remarkGfm]}
        skipHtml
        disallowedElements={['img']}
        components={{
          a: ({ children: linkText, ...properties }) => (
            <a {...properties} target="_blank" rel="noopener noreferrer">
              {linkText}
            </a>
          ),
        }}
      >
        {children}
      </Markdown>
    </div>
  );
}
