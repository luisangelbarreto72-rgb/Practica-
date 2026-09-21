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

    # El contenedor principal que permite hacer scroll SIN bloquear nada
    content_column = ft.Column(scroll=ft.ScrollMode.AUTO, expand=True)

    semestre = cargar_datos()

    # App Bar (Barra Superior)
    page.appbar = ft.AppBar(
        leading=ft.Icon(ft.icons.SEARCH, color=ft.colors.WHITE),
        leading_width=40,
        title=ft.Text("Gestor Académico", color=ft.colors.WHITE, weight=ft.FontWeight.BOLD),
        center_title=True,
        bgcolor="#042940",
        actions=[
            ft.IconButton(ft.icons.ACCOUNT_CIRCLE, icon_color=ft.colors.WHITE),
            ft.Container(width=10)
        ],
    )

    # Funciones Nativas de Dialogos Flet 0.23.2
    def show_snack(text, color=None):
        snack = ft.SnackBar(ft.Text(text), bgcolor=color)
        page.open(snack)

    def show_dialog(title, content, actions):
        dlg = ft.AlertDialog(
            title=ft.Text(title),
            content=content,
            actions=actions,
            actions_alignment=ft.MainAxisAlignment.END,
        )
        page.current_dialog = dlg
        page.open(dlg)

    def close_dialog(e=None):
        if hasattr(page, 'current_dialog') and page.current_dialog:
            page.close(page.current_dialog)
            page.current_dialog = None

    def refresh_ui(search_term=None, only_approved=False):
        content_column.controls.clear()

        promedio = calcular_promedio_general(semestre)

        # 1. Tarjeta Principal
        avg_card = ft.Container(
            content=ft.Column(
                [
                    ft.Container(
                        content=ft.Stack(
                            [
                                ft.ProgressRing(width=120, height=120, stroke_width=15, color="#042940", bgcolor="#E2E8F0", value=promedio / 100 if promedio > 0 else 0),
                                ft.Container(content=ft.Text(f"{promedio}%", size=24, weight=ft.FontWeight.BOLD, color="#042940"), alignment=ft.alignment.center, width=120, height=120)
                            ]
                        ),
                        alignment=ft.alignment.center,
                        padding=ft.padding.only(bottom=10)
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

        # 2. Sección de Materias
        if not semestre:
            content_column.controls.append(ft.Text("No tienes materias. Agrega una con el botón +", color="#64748B"))
        else:
            filtered_semestre = semestre
            if search_term:
                filtered_semestre = buscar_materias(semestre, search_term)
            if only_approved:
                filtered_semestre = [m for m in filtered_semestre if m.acumulado_notas >= m.nota_minima]

            if not filtered_semestre:
                content_column.controls.append(ft.Text("No hay resultados.", color="#64748B"))

            for materia in filtered_semestre:
                ganados = round(materia.acumulado_notas, 2)
                faltantes = 100 - ganados
                faltantes = 0 if faltantes < 0 else round(faltantes, 2)
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

        # 3. Botones y Eventos
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
                show_snack("No tienes materias")
                return
            materia_dropdown = ft.Dropdown(label="Selecciona una materia", options=[ft.dropdown.Option(m.nombre) for m in semestre], autofocus=True)
            eval_name = ft.TextField(label="Nombre de evaluación")
            eval_total = ft.TextField(label="Puntos totales", keyboard_type=ft.KeyboardType.NUMBER)
            eval_ganados = ft.TextField(label="Puntos ganados", keyboard_type=ft.KeyboardType.NUMBER)

            def save_eval(e):
                if not materia_dropdown.value: return
                materia = next((m for m in semestre if m.nombre == materia_dropdown.value), None)
                if not materia: return
                try:
                    ptos = float(eval_total.value)
                    ptos_gan = float(eval_ganados.value)
                    if ptos > 0 and 0 <= ptos_gan <= ptos:
                        materia.registrar_evaluacion(eval_name.value.strip(), ptos_gan, ptos)
                        guardar_datos(semestre)
                        close_dialog(e)
                        refresh_ui()
                        show_snack("Evaluación registrada!", ft.colors.GREEN_600)
                except ValueError:
                    pass

            show_dialog("Registrar Evaluación", ft.Column([materia_dropdown, eval_name, eval_total, eval_ganados], tight=True), [
                ft.TextButton("Cancelar", on_click=close_dialog),
                ft.TextButton("Guardar", on_click=save_eval)
            ])

        def editar_nota_click(e):
            if not semestre:
                show_snack("No tienes materias")
                return
            materia_dropdown = ft.Dropdown(label="Selecciona una materia", options=[ft.dropdown.Option(m.nombre) for m in semestre], autofocus=True)
            eval_dropdown = ft.Dropdown(label="Selecciona evaluación", options=[ft.dropdown.Option("Selecciona materia")])
            eval_ganados = ft.TextField(label="Nuevos puntos ganados", keyboard_type=ft.KeyboardType.NUMBER)

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
                if not materia_dropdown.value or not eval_dropdown.value or eval_dropdown.value in ["No hay evaluaciones", "Selecciona materia"]: return
                materia = next((m for m in semestre if m.nombre == materia_dropdown.value), None)
                if not materia: return
                try:
                    ptos_gan = float(eval_ganados.value)
                    if ptos_gan >= 0:
                        if materia.editar_evaluacion(eval_dropdown.value, ptos_gan):
                            guardar_datos(semestre)
                            close_dialog(e)
                            refresh_ui()
                            show_snack("Evaluación editada!", ft.colors.GREEN_600)
                except ValueError:
                    pass

            show_dialog("Editar Nota", ft.Column([materia_dropdown, eval_dropdown, eval_ganados], tight=True), [
                ft.TextButton("Cancelar", on_click=close_dialog),
                ft.TextButton("Guardar", on_click=save_eval)
            ])

        def eliminar_materia_click(e):
            if not semestre:
                show_snack("No tienes materias")
                return
            materia_dropdown = ft.Dropdown(label="Selecciona materia a eliminar", options=[ft.dropdown.Option(m.nombre) for m in semestre], autofocus=True)
            
            def delete_materia(e):
                if materia_dropdown.value and eliminar_materia(semestre, materia_dropdown.value):
                    guardar_datos(semestre)
                    close_dialog(e)
                    refresh_ui()
                    show_snack("Materia eliminada!", ft.colors.RED_600)

            show_dialog("Eliminar Materia", ft.Column([materia_dropdown, ft.Text("¿Estás seguro de eliminarla?")], tight=True), [
                ft.TextButton("Cancelar", on_click=close_dialog),
                ft.TextButton("Eliminar", on_click=delete_materia, style=ft.ButtonStyle(color=ft.colors.RED_600))
            ])

        def ver_resumen_click(e):
            resumen_text = "\n".join([m.obtener_estado() for m in semestre]) if semestre else "No tienes materias."
            show_dialog("Resumen de Materias", ft.Column([ft.Text(resumen_text, size=12)], scroll=ft.ScrollMode.AUTO, height=300), [
                ft.TextButton("Cerrar", on_click=close_dialog)
            ])

        def exportar_boletin_click(e):
            if not semestre:
                show_snack("No tienes materias para exportar")
                return
            exportar_boletin(semestre)
            show_snack("Boletín exportado correctamente!", ft.colors.GREEN_600)

        def buscar_materia_click(e):
            search_input = ft.TextField(label="Nombre de materia", autofocus=True)
            def do_search(e):
                close_dialog(e)
                refresh_ui(search_term=search_input.value.strip())
            show_dialog("Buscar Materia", search_input, [
                ft.TextButton("Limpiar", on_click=lambda e: (close_dialog(e), refresh_ui())),
                ft.TextButton("Buscar", on_click=do_search)
            ])

        def materias_aprobadas_click(e):
            refresh_ui(only_approved=True)
            show_snack("Mostrando solo materias aprobadas", ft.colors.BLUE_600)

        content_column.controls.append(ft.Container(height=10))
        content_column.controls.append(ft.Row([
            create_action_btn(ft.icons.SETTINGS, "Gestionar", "Materia", "#1A5F7A", on_click=gestionar_materia_click),
            create_action_btn(ft.icons.EDIT, "Editar", "Nota", "#22A39F", on_click=editar_nota_click),
            create_action_btn(ft.icons.ARTICLE, "Ver", "Resumen", "#C8E6C9", on_click=ver_resumen_click),
            create_action_btn(ft.icons.DELETE, "Eliminar", "Materia", "#81C784", on_click=eliminar_materia_click),
        ], alignment=ft.MainAxisAlignment.SPACE_BETWEEN))
        content_column.controls.append(ft.Row([
            create_action_btn(ft.icons.CHECK_CIRCLE, "Materias", "Aprobadas", "#4DD0E1", on_click=materias_aprobadas_click),
            create_action_btn(ft.icons.UPLOAD, "Exportar", "Boletín", "#B2EBF2", on_click=exportar_boletin_click),
            create_action_btn(ft.icons.SAVE_ALT, "Exportar", "Maletín", "#AED581", on_click=exportar_boletin_click),
            create_action_btn(ft.icons.SEARCH, "Buscar", "Materia", "#388E3C", on_click=buscar_materia_click),
        ], alignment=ft.MainAxisAlignment.SPACE_BETWEEN))
        content_column.controls.append(ft.Container(height=30))

        page.update()

    def add_materia_fab(e):
        nombre_input = ft.TextField(label="Nombre de la materia", autofocus=True)
        def save_materia(e):
            nombre = nombre_input.value.strip()
            if nombre:
                semestre.append(Materia(nombre))
                guardar_datos(semestre)
                close_dialog(e)
                refresh_ui()
                show_snack("Materia agregada!", ft.colors.GREEN_600)
        
        show_dialog("Agregar Materia", nombre_input, [
            ft.TextButton("Cancelar", on_click=close_dialog),
            ft.TextButton("Guardar", on_click=save_materia)
        ])

    # --- INTEGRACIÓN NATIVA DE FLET: ADIOS AL STACK BLOQUEADOR ---
    page.floating_action_button = ft.FloatingActionButton(
        content=ft.Icon(ft.icons.ADD, color="#042940", size=30),
        bgcolor="#A8E6CF",
        shape=ft.CircleBorder(),
        on_click=add_materia_fab
    )
    page.floating_action_button_location = ft.FloatingActionButtonLocation.CENTER_DOCKED

    page.bottom_appbar = ft.BottomAppBar(
        bgcolor="#042940",
        shape=ft.NotchShape.CIRCULAR,
        content=ft.Row([
            ft.Column([ft.Icon(ft.icons.HOME, color="#A8E6CF"), ft.Text("Inicio", color="#A8E6CF", size=10)], alignment=ft.MainAxisAlignment.CENTER, horizontal_alignment=ft.CrossAxisAlignment.CENTER, spacing=0),
            ft.Column([ft.Icon(ft.icons.MENU_BOOK, color="#64748B"), ft.Text("Materias", color="#64748B", size=10)], alignment=ft.MainAxisAlignment.CENTER, horizontal_alignment=ft.CrossAxisAlignment.CENTER, spacing=0),
            ft.Container(width=50), # Espacio hueco para que encaje el botón flotante
            ft.Column([ft.Icon(ft.icons.DESCRIPTION, color="#64748B"), ft.Text("Resumen", color="#64748B", size=10)], alignment=ft.MainAxisAlignment.CENTER, horizontal_alignment=ft.CrossAxisAlignment.CENTER, spacing=0),
            ft.Column([ft.Icon(ft.icons.ACCOUNT_CIRCLE, color="#64748B"), ft.Text("Cuenta", color="#64748B", size=10)], alignment=ft.MainAxisAlignment.CENTER, horizontal_alignment=ft.CrossAxisAlignment.CENTER, spacing=0),
        ], alignment=ft.MainAxisAlignment.SPACE_AROUND),
        padding=ft.padding.only(top=5, bottom=5)
    )

    page.add(ft.Container(content=content_column, padding=20, expand=True))
    refresh_ui()

if __name__ == "__main__":
    ft.app(target=main)
