import re
import os

os.chdir(r"c:\Users\HP\compte-frontend")

with open('src/views/viewsHtml/Dashboard.vue', 'r', encoding='utf-8') as f:
    content = f.read()

# Pour le composant Admin:
admin_content = content.replace("src='../viewsCss/Dashboard.css'", "src='../viewsCss/DashboardAdmin.css'")
admin_content = admin_content.replace('src="../viewsCss/Dashboard.css"', 'src="../viewsCss/DashboardAdmin.css"')
admin_content = admin_content.replace('>shabaFAI</a>', '>shabaFAI - Admin</a>')

with open('src/views/viewsHtml/DashbordAdmin.vue', 'w', encoding='utf-8') as f:
    f.write(admin_content)

# Pour le CSS Admin:
with open('src/views/viewsCss/Dashboard.css', 'r', encoding='utf-8') as f:
    css_content = f.read()

with open('src/views/viewsCss/DashboardAdmin.css', 'w', encoding='utf-8') as f:
    f.write(css_content)

print("Split completed.")
