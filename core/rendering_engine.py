from core.universal_model import ContentDocument, Section

class RenderingEngine:
    @staticmethod
    def render_classic_html(doc: ContentDocument) -> str:
        """
        Renders the ContentDocument into standard, semantic WordPress HTML.
        Suitable for the Classic Editor.
        """
        html = []
        
        # Featured image is usually handled by WP natively, but if injected:
        if 'featured' in doc.images:
            html.append(f'<img src="{doc.images["featured"]}" alt="{doc.title} Featured" class="aligncenter size-full wp-image" />')
            
        if doc.introduction:
            html.append(f"<p>{doc.introduction}</p>")
            
        # Recursive section renderer
        def render_section(section: Section, level: int = 2):
            sec_html = []
            sec_html.append(f"<h{level}>{section.heading}</h{level}>")
            if section.content:
                # Basic wrapping if content isn't already wrapped (simple safeguard)
                content = section.content.strip()
                if not content.startswith('<p>') and not content.startswith('<ul>') and not content.startswith('<ol>'):
                    p_break = '</p><p>'
                    content = f"<p>{content.replace(chr(10) + chr(10), p_break)}</p>"
                sec_html.append(content)
                
            for sub in section.subsections:
                sec_html.append(render_section(sub, level=min(level + 1, 6)))
                
            return "\n".join(sec_html)
            
        for section in doc.sections:
            html.append(render_section(section))
            
        if doc.faqs:
            html.append("<h2>FAQs</h2>")
            for faq in doc.faqs:
                html.append(f"<h3>{faq.question}</h3>\n<p>{faq.answer}</p>")
                
        if doc.conclusion:
            html.append("<h2>Conclusion</h2>")
            content = doc.conclusion.strip()
            if not content.startswith('<p>'):
                p_break = '</p><p>'
                content = f"<p>{content.replace(chr(10) + chr(10), p_break)}</p>"
            html.append(content)
            
        # Responsible Gambling Notice
        html.append('<hr/>\n<p><strong>Responsible Gambling Notice:</strong> Please gamble responsibly. Only bet what you can afford to lose. If you need help, seek professional advice.</p>')
            
        return "\n\n".join(html)
