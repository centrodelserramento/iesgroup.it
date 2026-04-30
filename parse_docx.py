import xml.etree.ElementTree as ET
import os

ns = {
    'w': 'http://schemas.openxmlformats.org/wordprocessingml/2006/main',
    'a': 'http://schemas.openxmlformats.org/drawingml/2006/main',
    'pic': 'http://schemas.openxmlformats.org/drawingml/2006/picture',
    'r': 'http://schemas.openxmlformats.org/officeDocument/2006/relationships',
    'rel': 'http://schemas.openxmlformats.org/package/2006/relationships',
    'wp': 'http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing'
}

# 1. Parse relationships to map rId to image targets
rels_tree = ET.parse('doc_content/word/_rels/document.xml.rels')
rels_root = rels_tree.getroot()
rId_to_target = {}
for rel in rels_root.findall('rel:Relationship', ns):
    if 'image' in rel.get('Type'):
        rId_to_target[rel.get('Id')] = rel.get('Target')

# 2. Parse document.xml
doc_tree = ET.parse('doc_content/word/document.xml')
doc_root = doc_tree.getroot()

body = doc_root.find('w:body', ns)

in_dati_section = False
markdown_lines = []

for p in body.findall('w:p', ns):
    # Extract text
    texts = p.findall('.//w:t', ns)
    paragraph_text = "".join([t.text for t in texts if t.text])
    
    if paragraph_text.strip().lower() == 'dati':
        in_dati_section = True
        markdown_lines.append(f"# {paragraph_text.strip()}\n")
        continue

    if in_dati_section:
        if paragraph_text.strip():
            markdown_lines.append(paragraph_text)
            markdown_lines.append("\n")
        
        # Extract images
        drawings = p.findall('.//w:drawing', ns)
        for drawing in drawings:
            blips = drawing.findall('.//a:blip', ns)
            for blip in blips:
                rId = blip.get(f"{{{ns['r']}}}embed")
                if rId and rId in rId_to_target:
                    target = rId_to_target[rId]
                    # target is like "media/image1.png"
                    img_path = f"doc_content/word/{target}"
                    markdown_lines.append(f"![{target}]({img_path})\n")

with open('dati.md', 'w') as f:
    f.write("\n".join(markdown_lines))

print("Created dati.md")
