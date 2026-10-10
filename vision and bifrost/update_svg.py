import re

with open('bifrost.html', 'r', encoding='utf-8') as f:
    html = f.read()

# Thor Mjolnir
html = html.replace(
    '''        <path d="M168,304 q-9,4 -18,0" stroke="#c07f52" stroke-width="1.5" fill="none" opacity=".6"/>\n        </g>\n        <!-- ===== PAULDRONS ===== -->''',
    '''        <path d="M168,304 q-9,4 -18,0" stroke="#c07f52" stroke-width="1.5" fill="none" opacity=".6"/>\n        </g>\n        <!-- ===== WEAPON (Mjolnir) ===== -->\n        <g class="g-weapon">\n          <path d="M158,300 L165,340" stroke="#4a3020" stroke-width="6" stroke-linecap="round"/>\n          <path d="M165,340 L165,345" stroke="#cfd8e0" stroke-width="6"/>\n          <rect x="145" y="340" width="38" height="24" rx="4" fill="url(#gSilver)" stroke="#232a32" stroke-width="1.5" transform="rotate(-15 164 352)"/>\n        </g>\n        <!-- ===== PAULDRONS ===== -->'''
)

# Thor Helmet Back
html = html.replace(
    '''      <!-- ===== HEAD ===== -->\n      <g class="g-head">\n        <path d="M96,56 C96,39 104,30 115,30 C126,30 134,39 134,56 C134,67 130,76 125,81 C121,86 118,90 115,90 C112,90 109,86 105,81 C100,76 96,67 96,56 Z" fill="url(#tSkin)"/>''',
    '''      <!-- ===== HEAD ===== -->\n      <g class="g-head">\n        <!-- helmet wings back -->\n        <path d="M98,45 C80,20 60,10 55,20 C70,35 85,45 98,52 Z" fill="#cfd8e0" stroke="#6f7d8a" stroke-width="1"/>\n        <path d="M132,45 C150,20 170,10 175,20 C160,35 145,45 132,52 Z" fill="#cfd8e0" stroke="#6f7d8a" stroke-width="1"/>\n        <path d="M96,56 C96,39 104,30 115,30 C126,30 134,39 134,56 C134,67 130,76 125,81 C121,86 118,90 115,90 C112,90 109,86 105,81 C100,76 96,67 96,56 Z" fill="url(#tSkin)"/>'''
)

# Thor Helmet Front
html = html.replace(
    '''        <path d="M105,68 Q115,64 125,68 Q122,75 115,73 Q108,75 105,68 Z" fill="#b3873c"/>\n        <!-- brows / eyes -->''',
    '''        <path d="M105,68 Q115,64 125,68 Q122,75 115,73 Q108,75 105,68 Z" fill="#b3873c"/>\n        <!-- helmet front -->\n        <path d="M94,52 C94,15 136,15 136,52 C136,36 94,36 94,52 Z" fill="url(#gSilver)" stroke="#1c232b" stroke-width="1.5"/>\n        <!-- brows / eyes -->'''
)

# Loki Staff
html = html.replace(
    '''          <path d="M120,216 l-2,6 M125,215 l-2,7" stroke="#c09a76" stroke-width="1.4" fill="none"/>\n        </g>\n        <!-- ===== COLLAR + NECK ===== -->''',
    '''          <path d="M120,216 l-2,6 M125,215 l-2,7" stroke="#c09a76" stroke-width="1.4" fill="none"/>\n        </g>\n        <!-- ===== WEAPON (Staff) ===== -->\n        <g class="g-weapon">\n          <path d="M80,410 L155,100" stroke="url(#gGoldV)" stroke-width="6" stroke-linecap="round"/>\n          <path d="M150,110 L165,70 L155,60 L140,105 Z" fill="url(#gGoldV)" stroke="#232a32" stroke-width="1"/>\n          <circle cx="152" cy="80" r="6" fill="#4dffff" filter="drop-shadow(0 0 4px #4dffff)"/>\n        </g>\n        <!-- ===== COLLAR + NECK ===== -->'''
)

# Loki Helmet Back
html = html.replace(
    '''      <!-- ===== HEAD ===== -->\n      <g class="g-head">\n        <path d="M87,58 C87,42 95,32 105,32 C115,32 123,42 123,58 C123,68 120,76 115,81 C111,85 108,88 105,88 C102,88 99,85 95,81 C90,76 87,68 87,58 Z" fill="url(#lSkin)"/>''',
    '''      <!-- ===== HEAD ===== -->\n      <g class="g-head">\n        <!-- Horns (Back) -->\n        <path d="M85,40 C80,-10 55,-20 45,-10 C60,10 70,30 85,45 Z" fill="url(#gGoldV)" stroke="#3a2a0c" stroke-width="1.5"/>\n        <path d="M125,40 C130,-10 155,-20 165,-10 C150,10 140,30 125,45 Z" fill="url(#gGoldV)" stroke="#3a2a0c" stroke-width="1.5"/>\n        <path d="M87,58 C87,42 95,32 105,32 C115,32 123,42 123,58 C123,68 120,76 115,81 C111,85 108,88 105,88 C102,88 99,85 95,81 C90,76 87,68 87,58 Z" fill="url(#lSkin)"/>'''
)

# Loki Helmet Front
html = html.replace(
    '''        <path d="M124,56 L124,66 L120,64 L121,56 Z" fill="#15171a"/>\n        <!-- brows / eyes -->''',
    '''        <path d="M124,56 L124,66 L120,64 L121,56 Z" fill="#15171a"/>\n        <!-- helmet front -->\n        <path d="M85,55 C85,25 125,25 125,55 C125,35 85,35 85,55 Z" fill="url(#gGoldV)" stroke="#3a2a0c" stroke-width="1.5"/>\n        <path d="M105,25 L105,52" stroke="#3a2a0c" stroke-width="1.5"/>\n        <!-- brows / eyes -->'''
)

with open('bifrost.html', 'w', encoding='utf-8') as f:
    f.write(html)

print('Updated bifrost.html with new SVG art details')
