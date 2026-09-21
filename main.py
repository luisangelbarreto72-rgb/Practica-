import flet as ft
from core import (
    Materia, cargar_datos, guardar_datos, calcular_promedio_general,
    buscar_materias, eliminar_materia, exportar_boletin
)

def main(page: ft.Page):
    page.title = "Gestor Académico"
    page.window.width = 400
    page.window.height = 700
    page.bgcolor = "#F8F9FA"

    semestre = cargar_datos()
    content_column = ft.Column(scroll=ft.ScrollMode.AUTO, expand=True)

    # --- FUNCIONES GLOBALES DE UI ---
    def show_snack(text, color=None):
        snack = ft.SnackBar(ft.Text(text), bgcolor=color)
        page.open(snack)

    def mostrar_perfil(e):
        from core import calcular_promedio_general
        total_materias = len(semestre)
        promedio = calcular_promedio_general(semestre)

        content = ft.Column([
            ft.Icon(ft.icons.ACCOUNT_CIRCLE, size=80, color="#042940"),
            ft.Text("Estudiante", size=22, weight=ft.FontWeight.BOLD,
                    text_align=ft.TextAlign.CENTER),
            ft.Text(f"Total de Materias: {total_materias}", size=16),
            ft.Text(f"Promedio Actual: {promedio}%", size=16)
        ], alignment=ft.MainAxisAlignment.CENTER,
            horizontal_alignment=ft.CrossAxisAlignment.CENTER, tight=True)

        dlg = ft.AlertDialog(
            content=content,
            actions=[
                ft.TextButton("Configuración", on_click=lambda e: page.open(
                    ft.SnackBar(ft.Text("Configuración en desarrollo...")))),
                ft.TextButton("Cerrar sesión", on_click=lambda e: page.open(
                    ft.SnackBar(ft.Text("Cerrar sesión en desarrollo...")))),
                ft.TextButton("Cerrar", on_click=lambda e: page.close(dlg))
            ],
            actions_alignment=ft.MainAxisAlignment.CENTER
        )
        page.open(dlg)

    def handle_search_click(e):
        search_input = ft.TextField(
            label="Nombre de materia",
            autofocus=True
        )

        def do_search(e_inner):
            term = search_input.value.strip()
            if hasattr(page, '_current_dialog') and page._current_dialog:
                page.close(page._current_dialog)
            elif hasattr(page, 'dialog') and page.dialog:
                page.close(page.dialog)
            refresh_ui(search_term=term)

        dlg = ft.AlertDialog(
            title=ft.Text("Buscar Materia"),
            content=search_input,
            actions=[
                ft.TextButton("Limpiar", on_click=lambda e_btn: (
                    page.close(dlg) or refresh_ui())),
                ft.TextButton("Buscar", on_click=do_search)
            ],
            actions_alignment=ft.MainAxisAlignment.END,
        )
        page._current_dialog = dlg
        page.open(dlg)

    # App Bar
    page.appbar = ft.AppBar(
        leading=ft.IconButton(
            ft.icons.SEARCH,
            icon_color=ft.colors.WHITE,
            on_click=handle_search_click),
        leading_width=40,
        title=ft.Text("Gestor Académico", color=ft.colors.WHITE, weight=ft.FontWeight.BOLD),
        center_title=True,
        bgcolor="#042940",
        actions=[
            ft.IconButton(
                ft.icons.ACCOUNT_CIRCLE,
                icon_color=ft.colors.WHITE,
                on_click=mostrar_perfil),
            ft.Container(width=10)
        ],
    )

    def refresh_ui(search_term=None, only_approved=False,
                   vista_actual='inicio'):
        # Clear content and rebuild
        content_column.controls.clear()
        promedio = calcular_promedio_general(semestre)

        # 1. Tarjeta Promedio
        avg_card = ft.Container(
            content=ft.Column(
                [
                    ft.Container(
                        content=ft.Stack([
                            ft.ProgressRing(width=120, height=120, stroke_width=15, color="#042940", bgcolor="#E2E8F0", value=promedio / 100 if promedio > 0 else 0),
                            ft.Container(content=ft.Text(f"{promedio}%", size=24, weight=ft.FontWeight.BOLD, color="#042940"), alignment=ft.alignment.center, width=120, height=120)
                        ]),
                        alignment=ft.alignment.center, padding=ft.padding.only(bottom=10)
                    ),
                    ft.Text("Promedio General", size=16, color="#64748B", text_align=ft.TextAlign.CENTER),
                    ft.Text(f"{promedio}", size=24, weight=ft.FontWeight.BOLD, color="#042940", text_align=ft.TextAlign.CENTER)
                ],
                horizontal_alignment=ft.CrossAxisAlignment.CENTER,
            ),
            bgcolor=ft.colors.WHITE, border_radius=15, border=ft.border.all(1, "#E2E8F0"), padding=20, width=float('inf'),
            shadow=ft.BoxShadow(spread_radius=1, blur_radius=5, color=ft.colors.BLACK12, offset=ft.Offset(0, 2))
        )
        content_column.controls.append(avg_card)
        content_column.controls.append(ft.Container(content=ft.Text("Tus Materias", size=18, weight=ft.FontWeight.BOLD, color="#042940"), padding=ft.padding.only(top=15, bottom=5, left=5)))

        # 2. Lista Materias
        if not semestre:
            content_column.controls.append(ft.Text("No tienes materias. Agrega una con el botón +", color="#64748B"))
        else:
            filtered = semestre
            if search_term:
                filtered = buscar_materias(semestre, search_term)
            if only_approved:
                filtered = [m for m in filtered if m.acumulado_notas >= m.nota_minima]

            if not filtered:
                content_column.controls.append(ft.Text("No hay resultados.", color="#64748B"))

            for materia in filtered:
                ganados = round(materia.acumulado_notas, 2)
                faltantes = max(0, 100 - ganados)
                mat_card = ft.Container(
                    content=ft.Column([
                        ft.Text(materia.nombre, size=16, color="#042940"),
                        ft.Text(f"{ganados}", size=18, weight=ft.FontWeight.BOLD, color="#042940"),
                        ft.ProgressBar(value=ganados / 100 if ganados > 0 else 0, color="#042940", bgcolor="#E2E8F0", height=10),
                        ft.Text(f"Puntaje: {ganados}/100, Faltan: {faltantes}", size=12, color="#64748B")
                    ]),
                    bgcolor=ft.colors.WHITE, border_radius=10, padding=15, margin=ft.margin.only(bottom=10),
                    shadow=ft.BoxShadow(spread_radius=0, blur_radius=2, color=ft.colors.BLACK12, offset=ft.Offset(0, 1))
                )
                content_column.controls.append(mat_card)

        # 3. Grid de Acciones
        def create_action_btn(icon, text_line1, text_line2, bgcolor, on_click=None):
            return ft.Container(
                content=ft.Column([
                    ft.Icon(icon, color=ft.colors.WHITE, size=24),
                    ft.Text(f"{text_line1}\n{text_line2}", color=ft.colors.WHITE, size=11, text_align=ft.TextAlign.CENTER, weight=ft.FontWeight.W_500)
                ], alignment=ft.MainAxisAlignment.CENTER, horizontal_alignment=ft.CrossAxisAlignment.CENTER, spacing=5),
                bgcolor=bgcolor, border_radius=10, width=80, height=80, on_click=on_click, ink=True
            )

        def gestionar_materia_click(e):
            if not semestre:
                return show_snack("No tienes materias")
            materia_dropdown = ft.Dropdown(label="Selecciona una materia", options=[ft.dropdown.Option(m.nombre) for m in semestre], autofocus=True)
            eval_name = ft.TextField(label="Nombre de evaluación")
            eval_total = ft.TextField(label="Puntos totales", keyboard_type=ft.KeyboardType.NUMBER)
            eval_ganados = ft.TextField(label="Puntos ganados", keyboard_type=ft.KeyboardType.NUMBER)

            def save_eval(e):
                materia = next((m for m in semestre if m.nombre == materia_dropdown.value), None)
                if materia:
                    try:
                        ptos, ptos_gan = float(eval_total.value), float(eval_ganados.value)
                        if ptos > 0 and 0 <= ptos_gan <= ptos:
                            materia.registrar_evaluacion(eval_name.value.strip(), ptos_gan, ptos)
                            guardar_datos(semestre)
                            close_dialog(e)
                            refresh_ui()
                            show_snack("Evaluación registrada!", ft.colors.GREEN_600)
                    except ValueError: pass

            show_dialog("Registrar Evaluación", ft.Column([materia_dropdown, eval_name, eval_total, eval_ganados], tight=True), [
                ft.TextButton("Cancelar", on_click=close_dialog), ft.TextButton("Guardar", on_click=save_eval)
            ])

        def editar_nota_click(e):
            if not semestre:
                return show_snack("No tienes materias")
            materia_dropdown = ft.Dropdown(label="Selecciona una materia", options=[ft.dropdown.Option(m.nombre) for m in semestre], autofocus=True)
            eval_dropdown = ft.Dropdown(label="Selecciona evaluación", options=[ft.dropdown.Option("Selecciona materia")])
            eval_ganados = ft.TextField(label="Nuevos puntos", keyboard_type=ft.KeyboardType.NUMBER)

            def on_materia_change(e):
                materia = next((m for m in semestre if m.nombre == materia_dropdown.value), None)
                if materia and materia.evaluaciones:
                    eval_dropdown.options = [ft.dropdown.Option(ev["nombre"]) for ev in materia.evaluaciones]
                    eval_dropdown.value = materia.evaluaciones[0]["nombre"]
                else:
                    eval_dropdown.options = [ft.dropdown.Option("No hay evaluaciones")]
                    eval_dropdown.value = "No hay evaluaciones"
                page.update()
            materia_dropdown.on_change = on_materia_change

            def save_eval(e):
                materia = next((m for m in semestre if m.nombre == materia_dropdown.value), None)
                if materia and eval_dropdown.value not in ["No hay evaluaciones", "Selecciona materia"]:
                    try:
                        ptos_gan = float(eval_ganados.value)
                        if ptos_gan >= 0 and materia.editar_evaluacion(eval_dropdown.value, ptos_gan):
                            guardar_datos(semestre)
                            close_dialog(e)
                            refresh_ui()
                            show_snack("Evaluación editada!", ft.colors.GREEN_600)
                    except ValueError: pass

            show_dialog("Editar Nota", ft.Column([materia_dropdown, eval_dropdown, eval_ganados], tight=True), [
                ft.TextButton("Cancelar", on_click=close_dialog), ft.TextButton("Guardar", on_click=save_eval)
            ])

        def eliminar_materia_click(e):
            if not semestre: return show_snack("No tienes materias")
            materia_dropdown = ft.Dropdown(label="Selecciona materia a eliminar", options=[ft.dropdown.Option(m.nombre) for m in semestre], autofocus=True)
            def delete_materia(e):
                if materia_dropdown.value and eliminar_materia(semestre, materia_dropdown.value):
                    guardar_datos(semestre)
                    close_dialog(e)
                    refresh_ui()
                    show_snack("Materia eliminada!", ft.colors.RED_600)
            show_dialog("Eliminar Materia", ft.Column([materia_dropdown, ft.Text("¿Estás seguro?")], tight=True), [
                ft.TextButton("Cancelar", on_click=close_dialog), ft.TextButton("Eliminar", on_click=delete_materia, style=ft.ButtonStyle(color=ft.colors.RED_600))
            ])

        def exportar_boletin_click(e):
            if not semestre: return show_snack("No tienes materias para exportar")
            exportar_boletin(semestre)
            show_snack("Boletín exportado correctamente!", ft.colors.GREEN_600)

        if vista_actual == "inicio":
            content_column.controls.append(ft.Container(height=10))
            content_column.controls.append(row1)
            content_column.controls.append(row2)

        content_column.controls.append(
            ft.Container(height=80))  # padding for bottom bar

        page.update()

    content_column = ft.Column(scroll=ft.ScrollMode.HIDDEN)

    def handle_ver_resumen(e):
        if not semestre:
            resumen_text = "No tienes materias registradas."
        else:
            resumen_text = "\n".join(
                [m.obtener_estado() for m in semestre])

        col = ft.Column(
            [ft.Text(resumen_text, size=12)],
            scroll=ft.ScrollMode.AUTO,
            height=300
        )

        dlg = ft.AlertDialog(
            title=ft.Text("Resumen de Materias"),
            content=col,
            actions=[
                ft.TextButton("Cerrar", on_click=lambda e: page.close(dlg))
            ],
            actions_alignment=ft.MainAxisAlignment.END,
        )
        page.open(dlg)

    bottom_bar = ft.Container(
        content=ft.Row(
            [
                ft.Container(
                    content=ft.Column(
                        [ft.Icon(ft.icons.HOME, color="#A8E6CF"),
                         ft.Text("Inicio", color="#A8E6CF", size=10)],
                        alignment=ft.MainAxisAlignment.CENTER,
                        horizontal_alignment=ft.CrossAxisAlignment.CENTER,
                        spacing=0),
                    ink=True, on_click=lambda e: refresh_ui(
                        vista_actual='inicio')
                ),
                ft.Container(
                    content=ft.Column(
                        [ft.Icon(ft.icons.MENU_BOOK, color="#64748B"),
                         ft.Text("Materias", color="#64748B", size=10)],
                        alignment=ft.MainAxisAlignment.CENTER,
                        horizontal_alignment=ft.CrossAxisAlignment.CENTER,
                        spacing=0),
                    ink=True, on_click=lambda e: refresh_ui(
                        vista_actual='materias')
                ),
                ft.Container(width=50),  # Empty space for FAB
                ft.Container(
                    content=ft.Column(
                        [ft.Icon(ft.icons.DESCRIPTION, color="#64748B"),
                         ft.Text("Resumen", color="#64748B", size=10)],
                        alignment=ft.MainAxisAlignment.CENTER,
                        horizontal_alignment=ft.CrossAxisAlignment.CENTER,
                        spacing=0),
                    ink=True, on_click=handle_ver_resumen
                ),
                ft.Container(
                    content=ft.Column(
                        [ft.Icon(ft.icons.ACCOUNT_CIRCLE, color="#64748B"),
                         ft.Text("Cuenta", color="#64748B", size=10)],
                        alignment=ft.MainAxisAlignment.CENTER,
                        horizontal_alignment=ft.CrossAxisAlignment.CENTER,
                        spacing=0),
                    ink=True, on_click=mostrar_perfil
                ),
            ],
            alignment=ft.MainAxisAlignment.SPACE_AROUND
        ),
        bgcolor="#042940",
        height=60,
        padding=ft.padding.only(top=5, bottom=5)
    )

    def add_materia_fab(e):
        nombre_input = ft.TextField(label="Nombre de materia", autofocus=True)
        def save_materia(e):
            nombre = nombre_input.value.strip()
            if nombre:
                semestre.append(Materia(nombre))
                guardar_datos(semestre)
                close_dialog(e)
                refresh_ui()
                show_snack("Materia agregada!", ft.colors.GREEN_600)
        show_dialog("Agregar Materia", nombre_input, [
            ft.TextButton("Cancelar", on_click=close_dialog), ft.TextButton("Guardar", on_click=save_materia)
        ])

    # --- BARRA INFERIOR (YA INTERACTIVA) ---
    page.bottom_appbar = ft.BottomAppBar(
        bgcolor="#042940", shape=ft.NotchShape.CIRCULAR,
        content=ft.Row([
            ft.Container(content=ft.Column([ft.Icon(ft.icons.HOME, color="#A8E6CF"), ft.Text("Inicio", color="#A8E6CF", size=10)], alignment=ft.MainAxisAlignment.CENTER, spacing=0), ink=True, border_radius=10, padding=5, on_click=lambda e: refresh_ui()),
            ft.Container(content=ft.Column([ft.Icon(ft.icons.MENU_BOOK, color="#64748B"), ft.Text("Materias", color="#64748B", size=10)], alignment=ft.MainAxisAlignment.CENTER, spacing=0), ink=True, border_radius=10, padding=5, on_click=lambda e: refresh_ui()),
            ft.Container(width=50), # Espacio hueco
            ft.Container(content=ft.Column([ft.Icon(ft.icons.DESCRIPTION, color="#64748B"), ft.Text("Resumen", color="#64748B", size=10)], alignment=ft.MainAxisAlignment.CENTER, spacing=0), ink=True, border_radius=10, padding=5, on_click=ver_resumen_global),
            ft.Container(content=ft.Column([ft.Icon(ft.icons.ACCOUNT_CIRCLE, color="#64748B"), ft.Text("Cuenta", color="#64748B", size=10)], alignment=ft.MainAxisAlignment.CENTER, spacing=0), ink=True, border_radius=10, padding=5, on_click=lambda e: show_snack("Perfil de Usuario en desarrollo...", ft.colors.BLUE)),
        ], alignment=ft.MainAxisAlignment.SPACE_AROUND),
        padding=ft.padding.only(top=5, bottom=5)
    )

    page.floating_action_button = ft.FloatingActionButton(
        content=ft.Icon(ft.icons.ADD, color="#042940", size=30),
        bgcolor="#A8E6CF", shape=ft.CircleBorder(), on_click=add_materia_fab
    )
    page.floating_action_button_location = ft.FloatingActionButtonLocation.CENTER_DOCKED

    page.add(ft.Container(content=content_column, padding=20, expand=True))
    refresh_ui()

if __name__ == "__main__":
    ft.app(target=main)