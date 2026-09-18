import flet as ft
from core import (
    Materia, cargar_datos, guardar_datos, calcular_promedio_general
)


def main(page: ft.Page):
    page.title = "Gestor Académico"
    page.window_width = 400
    page.window_height = 700
    page.bgcolor = "#F8F9FA"
    page.scroll = "auto"

    semestre = cargar_datos()

    # App Bar
    page.appbar = ft.AppBar(
        leading=ft.Icon(
            ft.icons.SEARCH,
            color=ft.colors.WHITE),
        leading_width=40,
        title=ft.Text(
            "Gestor Académico",
            color=ft.colors.WHITE,
            weight=ft.FontWeight.BOLD),
        center_title=True,
        bgcolor="#042940",
        actions=[
                ft.IconButton(
                    ft.icons.ACCOUNT_CIRCLE,
                    icon_color=ft.colors.WHITE),
            ft.Container(
                    width=10)],
    )

    def refresh_ui():
        # Clear content and rebuild
        content_column.controls.clear()

        # 1. Tarjeta Principal (Promedio General)
        promedio = calcular_promedio_general(semestre)

        avg_card = ft.Container(
            content=ft.Column(
                [
                    ft.Container(
                        content=ft.Stack(
                            [
                                ft.ProgressRing(
                                    width=120,
                                    height=120,
                                    stroke_width=15,
                                    color="#042940",
                                    bgcolor="#E2E8F0",
                                    value=promedio / 100 if promedio > 0 else 0
                                ),
                                ft.Container(
                                    content=ft.Text(
                                        f"{promedio}%",
                                        size=24,
                                        weight=ft.FontWeight.BOLD,
                                        color="#042940"),
                                    alignment=ft.alignment.center,
                                    width=120,
                                    height=120)]),
                        alignment=ft.alignment.center,
                        padding=ft.padding.only(
                            bottom=10)),
                    ft.Text(
                        "Promedio General",
                        size=16,
                        color="#64748B",
                        text_align=ft.TextAlign.CENTER),
                    ft.Text(
                        f"{promedio}",
                        size=24,
                        weight=ft.FontWeight.BOLD,
                        color="#042940",
                        text_align=ft.TextAlign.CENTER)],
                horizontal_alignment=ft.CrossAxisAlignment.CENTER,
            ),
            bgcolor=ft.colors.WHITE,
            border_radius=15,
            border=ft.border.all(
                1,
                "#E2E8F0"),
            padding=20,
            width=float('inf'),
            shadow=ft.BoxShadow(
                spread_radius=1,
                blur_radius=5,
                color=ft.colors.BLACK12,
                offset=ft.Offset(
                    0,
                    2)))

        content_column.controls.append(avg_card)

        # 2. Sección de Materias
        content_column.controls.append(
            ft.Container(
                content=ft.Text(
                    "Tus Materias",
                    size=18,
                    weight=ft.FontWeight.BOLD,
                    color="#042940"),
                padding=ft.padding.only(
                    top=15,
                    bottom=5,
                    left=5)))

        if not semestre:
            content_column.controls.append(
                ft.Text(
                    "No tienes materias. Agrega una con el botón +",
                    color="#64748B"))
        else:
            for materia in semestre:
                ganados = round(materia.acumulado_notas, 2)
                faltantes = 100 - ganados
                faltantes = 0 if faltantes < 0 else round(faltantes, 2)

                mat_card = ft.Container(
                    content=ft.Column(
                        [
                            ft.Text(
                                materia.nombre,
                                size=16,
                                color="#042940"),
                            ft.Text(
                                f"{ganados}",
                                size=18,
                                weight=ft.FontWeight.BOLD,
                                color="#042940"),
                            ft.ProgressBar(
                                value=ganados /
                                100 if ganados > 0 else 0,
                                color="#042940",
                                bgcolor="#E2E8F0",
                                height=10),
                            ft.Text(
                                f"Puntaje: {ganados}/100, Faltan: {faltantes}",
                                size=12,
                                color="#64748B")]),
                    bgcolor=ft.colors.WHITE,
                    border_radius=10,
                    padding=15,
                    margin=ft.margin.only(
                        bottom=10),
                    shadow=ft.BoxShadow(
                        spread_radius=0,
                        blur_radius=2,
                        color=ft.colors.BLACK12,
                        offset=ft.Offset(
                            0,
                            1)))
                content_column.controls.append(mat_card)

        # 3. Grid de Acciones
        def create_action_btn(
                icon,
                text_line1,
                text_line2,
                bgcolor,
                on_click=None):
            return ft.Container(
                content=ft.Column(
                    [
                        ft.Icon(
                            icon,
                            color=ft.colors.WHITE,
                            size=24),
                        ft.Text(
                            f"{text_line1}\n{text_line2}",
                            color=ft.colors.WHITE,
                            size=11,
                            text_align=ft.TextAlign.CENTER,
                            weight=ft.FontWeight.W_500)],
                    alignment=ft.MainAxisAlignment.CENTER,
                    horizontal_alignment=ft.CrossAxisAlignment.CENTER,
                    spacing=5),
                bgcolor=bgcolor,
                border_radius=10,
                width=80,
                height=80,
                on_click=on_click,
                ink=True)

        def show_dialog(title, content, actions):
            dlg = ft.AlertDialog(
                title=ft.Text(title),
                content=content,
                actions=actions,
                actions_alignment=ft.MainAxisAlignment.END,
            )
            page.dialog = dlg
            dlg.open = True
            page.update()

        def close_dialog(e):
            page.dialog.open = False
            page.update()

        def add_materia_click(e):
            nombre_input = ft.TextField(
                label="Nombre de la materia", autofocus=True)

            def save_materia(e):
                nombre = nombre_input.value.strip()
                if nombre:
                    semestre.append(Materia(nombre))
                    guardar_datos(semestre)
                    close_dialog(e)
                    refresh_ui()

            show_dialog(
                "Agregar Materia",
                nombre_input,
                [
                    ft.TextButton("Cancelar", on_click=close_dialog),
                    ft.TextButton("Guardar", on_click=save_materia)
                ]
            )

        def gestionar_materia_click(e):
            if not semestre:
                page.snack_bar = ft.SnackBar(ft.Text("No tienes materias"))
                page.snack_bar.open = True
                page.update()
                return

            materia_dropdown = ft.Dropdown(
                label="Selecciona una materia",
                options=[ft.dropdown.Option(m.nombre) for m in semestre],
                autofocus=True
            )
            eval_name = ft.TextField(label="Nombre de evaluación")
            eval_total = ft.TextField(
                label="Puntos totales",
                keyboard_type=ft.KeyboardType.NUMBER)
            eval_ganados = ft.TextField(
                label="Puntos ganados",
                keyboard_type=ft.KeyboardType.NUMBER)

            def save_eval(e):
                materia_name = materia_dropdown.value
                if not materia_name:
                    return

                materia = next(
                    (m for m in semestre if m.nombre == materia_name), None)
                if not materia:
                    return

                try:
                    ptos = float(eval_total.value)
                    ptos_gan = float(eval_ganados.value)
                    if ptos > 0 and 0 <= ptos_gan <= ptos:
                        materia.registrar_evaluacion(
                            eval_name.value.strip(), ptos_gan, ptos)
                        guardar_datos(semestre)
                        close_dialog(e)
                        refresh_ui()
                        page.snack_bar = ft.SnackBar(
                            ft.Text("Evaluación registrada!"))
                        page.snack_bar.open = True
                        page.update()
                except ValueError:
                    pass

            col = ft.Column([materia_dropdown, eval_name,
                            eval_total, eval_ganados], tight=True)

            show_dialog(
                "Registrar Evaluación",
                col,
                [
                    ft.TextButton("Cancelar", on_click=close_dialog),
                    ft.TextButton("Guardar", on_click=save_eval)
                ]
            )

        row1 = ft.Row(
            [
                create_action_btn(
                    ft.icons.SETTINGS,
                    "Gestionar",
                    "Materia",
                    "#1A5F7A",
                    on_click=gestionar_materia_click),
                create_action_btn(
                    ft.icons.EDIT,
                    "Editar",
                    "Nota",
                    "#22A39F"),
                create_action_btn(
                    ft.icons.ARTICLE,
                    "Ver",
                    "Resumen",
                    "#C8E6C9"),
                create_action_btn(
                    ft.icons.DELETE,
                    "Eliminar",
                    "Materia",
                    "#81C784"),
            ],
            alignment=ft.MainAxisAlignment.SPACE_BETWEEN)

        row2 = ft.Row(
            [
                create_action_btn(
                    ft.icons.CHECK_CIRCLE,
                    "Materias",
                    "Aprobadas",
                    "#4DD0E1"),
                create_action_btn(
                    ft.icons.UPLOAD,
                    "Exportar",
                    "Boletín",
                    "#B2EBF2"),
                create_action_btn(
                    ft.icons.SAVE_ALT,
                    "Exportar",
                    "Maletín",
                    "#AED581"),
                create_action_btn(
                    ft.icons.SEARCH,
                    "Buscar",
                    "Materia",
                    "#388E3C"),
            ],
            alignment=ft.MainAxisAlignment.SPACE_BETWEEN)

        content_column.controls.append(ft.Container(height=10))
        content_column.controls.append(row1)
        content_column.controls.append(row2)
        content_column.controls.append(
            ft.Container(height=80))  # padding for bottom bar

        page.update()

    content_column = ft.Column(scroll=ft.ScrollMode.HIDDEN)

    bottom_bar = ft.Container(
        content=ft.Row(
            [
                ft.Column([ft.Icon(ft.icons.HOME,
                                   color="#A8E6CF"),
                           ft.Text("Inicio",
                                   color="#A8E6CF",
                                   size=10)],
                          alignment=ft.MainAxisAlignment.CENTER,
                          horizontal_alignment=ft.CrossAxisAlignment.CENTER,
                          spacing=0),
                ft.Column([ft.Icon(ft.icons.MENU_BOOK,
                                   color="#64748B"),
                           ft.Text("Materias",
                                   color="#64748B",
                                   size=10)],
                          alignment=ft.MainAxisAlignment.CENTER,
                          horizontal_alignment=ft.CrossAxisAlignment.CENTER,
                          spacing=0),
                ft.Container(width=50),  # Empty space for FAB
                ft.Column([ft.Icon(ft.icons.DESCRIPTION,
                                   color="#64748B"),
                           ft.Text("Resumen",
                                   color="#64748B",
                                   size=10)],
                          alignment=ft.MainAxisAlignment.CENTER,
                          horizontal_alignment=ft.CrossAxisAlignment.CENTER,
                          spacing=0),
                ft.Column([ft.Icon(ft.icons.ACCOUNT_CIRCLE,
                                   color="#64748B"),
                           ft.Text("Cuenta",
                                   color="#64748B",
                                   size=10)],
                          alignment=ft.MainAxisAlignment.CENTER,
                          horizontal_alignment=ft.CrossAxisAlignment.CENTER,
                          spacing=0),
            ],
            alignment=ft.MainAxisAlignment.SPACE_AROUND
        ),
        bgcolor="#042940",
        height=60,
        padding=ft.padding.only(top=5, bottom=5)
    )

    def add_materia_fab(e):
        nombre_input = ft.TextField(
            label="Nombre de la materia", autofocus=True)

        def save_materia(e):
            nombre = nombre_input.value.strip()
            if nombre:
                semestre.append(Materia(nombre))
                guardar_datos(semestre)
                page.dialog.open = False
                refresh_ui()

        dlg = ft.AlertDialog(
            title=ft.Text("Agregar Materia"),
            content=nombre_input,
            actions=[
                ft.TextButton(
                    "Cancelar",
                    on_click=lambda e: setattr(
                        page.dialog,
                        'open',
                        False) or page.update()),
                ft.TextButton(
                    "Guardar",
                    on_click=save_materia)],
            actions_alignment=ft.MainAxisAlignment.END,
        )
        page.dialog = dlg
        dlg.open = True
        page.update()

    fab = ft.Container(
        content=ft.Icon(
            ft.icons.ADD,
            color="#042940",
            size=30),
        bgcolor="#A8E6CF",
        width=60,
        height=60,
        border_radius=30,
        alignment=ft.alignment.center,
        on_click=add_materia_fab,
        ink=True,
        shadow=ft.BoxShadow(
            spread_radius=1,
            blur_radius=5,
            color=ft.colors.BLACK26,
            offset=ft.Offset(
                0,
                2)))

    main_stack = ft.Stack(
        [
            ft.Container(
                content=content_column,
                padding=20,
                expand=True,
                padding_bottom=80),
            ft.Container(content=bottom_bar, bottom=0, left=0, right=0),
            # Assuming width is 400, center is ~170
            ft.Container(content=fab, bottom=20, left=170)
        ],
        expand=True
    )

    page.add(main_stack)
    refresh_ui()


if __name__ == "__main__":
    ft.app(target=main)
