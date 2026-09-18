import re

with open("main.py", "r") as f:
    content = f.read()

replacement = """        if not semestre:
            content_column.controls.append(
                ft.Text(
                    "No tienes materias. Agrega una con el botón +",
                    color="#64748B"))
        else:
            filtered_semestre = semestre
            if search_term:
                from core import buscar_materias
                filtered_semestre = buscar_materias(semestre, search_term)
            if only_approved:
                filtered_semestre = [m for m in filtered_semestre if m.acumulado_notas >= m.nota_minima]

            if not filtered_semestre:
                content_column.controls.append(ft.Text("No hay resultados.", color="#64748B"))

            for materia in filtered_semestre:"""

content = re.sub(
    r'        if not semestre:[\s\S]*?for materia in semestre:',
    replacement,
    content
)

with open("main.py", "w") as f:
    f.write(content)
