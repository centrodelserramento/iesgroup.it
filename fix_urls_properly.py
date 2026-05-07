file_path = '../centrodelserramento/cds_planner_ies_api/home/urls.py'

with open(file_path, 'r') as f:
    lines = f.readlines()

new_lines = []
skip_until = -1
for i, line in enumerate(lines):
    if i <= skip_until:
        continue
    
    # Detect the broken section
    if 'path(' in line and i + 1 < len(lines) and '"ies/contatto/"' in lines[i+1]:
        # We are at the start of the broken block (line 129 in previous cat)
        new_lines.append('    path(\n')
        new_lines.append('        "ies/contatto/",\n')
        new_lines.append('        views.external_ies_order_request,\n')
        new_lines.append('        name="external-ies-order-request",\n')
        new_lines.append('    ),\n')
        new_lines.append('    path(\n')
        new_lines.append('        "ies/contatto/api/",\n')
        new_lines.append('        views.external_ies_contact_api,\n')
        new_lines.append('        name="external-ies-contact-api",\n')
        new_lines.append('    ),\n')
        
        # Skip the broken lines until we hit the next path (cds/contatto)
        # Looking at previous output, cds/contatto starts at line 140 (1-based)
        # So skip until line index i + offset
        for j in range(i + 1, len(lines)):
            if 'path(' in lines[j] and '"cds/contatto/"' in lines[j+1]:
                skip_until = j - 1
                break
        continue
        
    new_lines.append(line)

with open(file_path, 'w') as f:
    f.writelines(new_lines)
