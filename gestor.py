import json
import os
import platform
import subprocess
import tkinter as tk
import customtkinter as ctk
from tkinter import messagebox, filedialog
from typing import List, Optional

ARCHIVO_DATOS = "datos.json"

UI_COLORS = {
    "bg_app": "#F4F7FC",
    "bg_sidebar": "#D6E4FF",
    "bg_card": "#FFFFFF",
    "bg_grid_item": "#EEF2F6",
    "text_main": "#1E293B",
    "text_secondary": "#64748B",
    "accent_blue": "#3B82F6",
    "progress_track": "#E2E8F0",
    "cyan_btn": "#06B6D4"
}


class Materia:
    """Clase que representa una materia académica y su progreso."""

    def __init__(self, nombre: str, nota_minima: float = 60.0) -> None:
        self.nombre = nombre
        self.nota_minima = nota_minima
        self.acumulado_notas = 0.0
        self.puntos_totales_evaluados = 0.0

    def registrar_evaluacion(
        self,
        nombre_evaluacion: str,
        puntos_ganados: float,
        puntos_totales_prueba: float
    ) -> None:
        """Registra una nueva evaluación y suma los puntos."""
        self.acumulado_notas += puntos_ganados
        self.puntos_totales_evaluados += puntos_totales_prueba

    def obtener_estado(self) -> str:
        """Genera un reporte formateado del progreso actual de la materia."""
        ptos_ev = self.puntos_totales_evaluados
        reporte = [
            f"\n=== REPORTE DE PROGRESO: {self.nombre.upper()} ===",
            f"  Puntos evaluados hasta ahora: {ptos_ev} de 100 pts posibles",
            f"  Puntaje ganado actual: {round(self.acumulado_notas, 2)} pts",
            "-" * 40
        ]

        if self.acumulado_notas >= self.nota_minima:
            reporte.append(
                "  ✅ ¡Felicidades! Ya alcanzaste o superaste los puntos "
                "para pasar."
            )
        else:
            faltante = self.nota_minima - self.acumulado_notas
            reporte.append(
                f"  ⚠️ Te faltan {round(faltante, 2)} puntos para llegar "
                f"a los {self.nota_minima} puntos mínimos."
            )

        reporte.append("=" * 40 + "\n")
        return "\n".join(reporte)

    def to_dict(self) -> dict:
        """Convierte la materia a un diccionario para JSON."""
        return {
            "nombre": self.nombre,
            "nota_minima": self.nota_minima,
            "acumulado_notas": self.acumulado_notas,
            "puntos_totales_evaluados": self.puntos_totales_evaluados
        }

    @classmethod
    def from_dict(cls, data: dict) -> Optional['Materia']:
        """Crea una instancia de Materia a partir de un diccionario."""
        try:
            materia = cls(data["nombre"], data.get("nota_minima", 60.0))
            materia.acumulado_notas = data.get("acumulado_notas", 0.0)
            materia.puntos_totales_evaluados = data.get(
                "puntos_totales_evaluados", 0.0
            )
            return materia
        except KeyError:
            return None
        except Exception:
            return None


def cargar_datos() -> List[Materia]:
    """Carga los datos de JSON, fallando silenciosamente si hay error."""
    if not os.path.exists(ARCHIVO_DATOS):
        return []

    try:
        with open(ARCHIVO_DATOS, "r", encoding="utf-8") as f:
            datos = json.load(f)
            if not isinstance(datos, list):
                return []

            materias_cargadas = []
            for d in datos:
                materia = Materia.from_dict(d)
                if materia:
                    materias_cargadas.append(materia)
            return materias_cargadas
    except (json.JSONDecodeError, Exception):
        return []


def guardar_datos(semestre: List[Materia]) -> None:
    """Guarda la lista de materias en el archivo JSON."""
    try:
        with open(ARCHIVO_DATOS, "w", encoding="utf-8") as f:
            json.dump([materia.to_dict() for materia in semestre], f, indent=4)
    except Exception:
        pass


def eliminar_materia(
    lista_materias: List[Materia], nombre_a_eliminar: str
) -> bool:
    """Busca y elimina una materia, retornando True si tuvo éxito."""
    for materia in lista_materias:
        if materia.nombre.lower() == nombre_a_eliminar.lower():
            lista_materias.remove(materia)
            return True
    return False


def calcular_promedio_general(lista_materias: List[Materia]) -> float:
    """Calcula y retorna el promedio global del semestre."""
    if not lista_materias:
        return 0.0

    suma_total = 0.0
    for materia in lista_materias:
        suma_total += materia.acumulado_notas

    promedio = suma_total / len(lista_materias)
    return round(promedio, 2)


def exportar_boletin(
    lista_materias: List[Materia], ruta_archivo: str = "boletin_oficial.txt"
) -> None:
    """Crea un documento de texto real con el reporte de calificaciones."""
    if not lista_materias:
        return

    with open(ruta_archivo, "w", encoding="utf-8") as archivo:
        archivo.write("=" * 50 + "\n")
        archivo.write("    🎓 BOLETÍN ACADÉMICO OFICIAL 🎓\n")
        archivo.write("=" * 50 + "\n\n")

        for materia in lista_materias:
            archivo.write(f"Materia: {materia.nombre.upper()}\n")
            archivo.write(
                f"Puntos ganados: {round(materia.acumulado_notas, 2)} pts\n"
            )
            archivo.write(
                f"Puntos evaluados: "
                f"{round(materia.puntos_totales_evaluados, 2)} pts\n"
            )
            archivo.write("-" * 40 + "\n")


def buscar_materias(
    lista_materias: List[Materia], texto: str
) -> List[Materia]:
    """Busca y retorna materias que coincidan parcialmente con el texto."""
    return [m for m in lista_materias if texto.lower() in m.nombre.lower()]


class GestorAcademicoApp(ctk.CTk):
    def __init__(self) -> None:
        super().__init__()

        self.title("Gestor Académico Inteligente")
        self.geometry("800x600")

        self.semestre: List[Materia] = cargar_datos()

        # UI Setup
        self.grid_rowconfigure(0, weight=1)
        self.grid_columnconfigure(1, weight=1)

        # Sidebar Frame
        self.sidebar_frame = ctk.CTkFrame(
            self, width=200, corner_radius=0,
            fg_color=UI_COLORS["bg_sidebar"]
        )
        self.sidebar_frame.grid(row=0, column=0, sticky="nsew")
        self.sidebar_frame.grid_rowconfigure(9, weight=1)

        self.logo_label = ctk.CTkLabel(
            self.sidebar_frame, text="Gestor Académico",
            font=ctk.CTkFont(size=20, weight="bold"),
            text_color=UI_COLORS["text_main"]
        )
        self.logo_label.grid(row=0, column=0, padx=20, pady=(20, 10))

        self.sidebar_buttons = {}

        self.btn_dashboard = self._create_sidebar_btn(
            "📈 Reporte Progreso", self.show_dashboard, "dashboard"
        )
        self.btn_dashboard.grid(row=1, column=0, padx=20, pady=10, sticky="ew")

        self.btn_agregar = self._create_sidebar_btn(
            "➕ Agregar Materia", self.show_agregar, "agregar"
        )
        self.btn_agregar.grid(row=2, column=0, padx=20, pady=10, sticky="ew")

        self.btn_gestionar = self._create_sidebar_btn(
            "⚙️ Gestionar Materia", self.show_gestionar, "gestionar"
        )
        self.btn_gestionar.grid(row=3, column=0, padx=20, pady=10, sticky="ew")

        self.btn_resumen = self._create_sidebar_btn(
            "📄 Ver Resumen", self.show_resumen, "resumen"
        )
        self.btn_resumen.grid(row=4, column=0, padx=20, pady=10, sticky="ew")

        self.btn_eliminar = self._create_sidebar_btn(
            "🗑️ Eliminar Materia", self.show_eliminar, "eliminar"
        )
        self.btn_eliminar.grid(row=5, column=0, padx=20, pady=10, sticky="ew")

        self.btn_exportar = self._create_sidebar_btn(
            "📤 Exportar Boletín", self.exportar, "exportar"
        )
        self.btn_exportar.grid(row=6, column=0, padx=20, pady=10, sticky="ew")

        self.btn_buscar = self._create_sidebar_btn(
            "🔍 Buscar Materia", self.show_buscar, "buscar"
        )
        self.btn_buscar.grid(row=7, column=0, padx=20, pady=10, sticky="ew")

        self.btn_salir = self._create_sidebar_btn(
            "❌ Salir", self.destroy, "salir"
        )
        self.btn_salir.grid(row=8, column=0, padx=20, pady=10, sticky="ew")

        # Main Frame
        self.main_frame = ctk.CTkFrame(
            self, corner_radius=10, fg_color=UI_COLORS["bg_app"]
        )
        self.main_frame.grid(row=0, column=1, padx=20, pady=20, sticky="nsew")
        self.main_frame.grid_rowconfigure(0, weight=1)
        self.main_frame.grid_columnconfigure(0, weight=1)

        self.show_dashboard()

    def _create_sidebar_btn(
        self, text: str, command: callable, view_name: str
    ) -> ctk.CTkButton:
        """Crea y registra un botón del sidebar."""
        btn = ctk.CTkButton(
            self.sidebar_frame, text=text, command=command,
            fg_color="transparent", text_color=UI_COLORS["text_main"],
            font=("Helvetica", 12), anchor="w", corner_radius=0,
            hover_color="rgba(255,255,255,0.3)"
        )
        self.sidebar_buttons[view_name] = btn
        return btn

    def set_active_view(self, active_view_name: str) -> None:
        """Sombreado dinámico de los botones del menú."""
        for view_name, btn in self.sidebar_buttons.items():
            if view_name == active_view_name:
                btn.configure(
                    fg_color="#FFFFFF",
                    text_color=UI_COLORS["text_main"],
                    corner_radius=10,
                    font=("Helvetica", 12, "bold"),
                    hover_color="#FFFFFF"
                )
            else:
                btn.configure(
                    fg_color="transparent",
                    text_color=UI_COLORS["text_main"],
                    corner_radius=0,
                    font=("Helvetica", 12),
                    hover_color="rgba(255,255,255,0.3)"
                )

    def clear_main_frame(self) -> None:
        """Elimina todos los widgets del marco principal."""
        for widget in self.main_frame.winfo_children():
            widget.destroy()

    def show_dashboard(self) -> None:
        self.set_active_view("dashboard")
        """Muestra la vista del Dashboard de Progreso."""
        self.clear_main_frame()

        # Título
        title_label = ctk.CTkLabel(
            self.main_frame,
            text="REPORTE PROGRESO | SEMESTRE ACTUAL",
            font=("Helvetica", 24, "bold"),
            text_color=UI_COLORS["text_main"]
        )
        title_label.grid(
            row=0, column=0, columnspan=2, pady=(20, 30), sticky="n"
        )

        # Configurar la cuadrícula del main_frame para el dashboard
        self.main_frame.grid_rowconfigure(0, weight=0)
        self.main_frame.grid_rowconfigure(1, weight=1)
        self.main_frame.grid_rowconfigure(2, weight=0)
        self.main_frame.grid_columnconfigure(0, weight=1)
        self.main_frame.grid_columnconfigure(1, weight=1)

        self._build_dashboard_left_column()
        self._build_dashboard_right_column()
        self._build_dashboard_bottom_summary()

    def _build_dashboard_left_column(self) -> None:
        """Construye la columna izquierda del dashboard."""
        left_frame = ctk.CTkFrame(
            self.main_frame, fg_color=UI_COLORS["bg_card"], corner_radius=15
        )
        left_frame.grid(
            row=1, column=0, sticky="nsew", padx=(20, 10), pady=10,
            ipadx=25, ipady=25
        )

        # Circular progress graph for overall average
        promedio = calcular_promedio_general(self.semestre)

        canvas_size = 150
        canvas = tk.Canvas(
            left_frame, width=canvas_size, height=canvas_size,
            bg=UI_COLORS["bg_card"],
            highlightthickness=0
        )
        canvas.pack(pady=(0, 20))

        # Draw background circle
        canvas.create_oval(
            15, 15, canvas_size-15, canvas_size-15,
            outline=UI_COLORS["progress_track"], width=15
        )

        # Draw progress arc
        extent = (promedio / 100) * 360 if promedio > 0 else 0
        color = UI_COLORS["accent_blue"]
        if extent > 0:
            canvas.create_arc(
                15, 15, canvas_size-15, canvas_size-15,
                start=90, extent=-extent,
                style=tk.ARC, outline=color, width=15
            )

        # Draw average text inside circle
        canvas.create_text(
            canvas_size/2, canvas_size/2,
            text=f"{promedio}%",
            fill=UI_COLORS["text_main"],
            font=("Helvetica", 24, "bold")
        )

        # Grid of individual subject averages
        subjects_frame = ctk.CTkScrollableFrame(
            left_frame, height=200, fg_color="transparent"
        )
        subjects_frame.pack(fill="both", expand=True)

        # 2-column grid configuration
        subjects_frame.grid_columnconfigure(0, weight=1)
        subjects_frame.grid_columnconfigure(1, weight=1)

        for i, materia in enumerate(self.semestre):
            row = i // 2
            col = i % 2

            subj_frame = ctk.CTkFrame(
                subjects_frame, fg_color=UI_COLORS["bg_grid_item"],
                corner_radius=10
            )
            subj_frame.grid(
                row=row, column=col, sticky="nsew", padx=5, pady=5,
                ipadx=5, ipady=5
            )

            ctk.CTkLabel(
                subj_frame, text=materia.nombre,
                font=("Helvetica", 11, "bold"),
                text_color=UI_COLORS["text_main"]
            ).pack(anchor="w", padx=10, pady=(5, 0))

            color_text = (
                "#2FA572" if materia.acumulado_notas >= materia.nota_minima
                else "#E53935"
            )
            ctk.CTkLabel(
                subj_frame, text=f"{round(materia.acumulado_notas, 2)}",
                text_color=color_text, font=("Helvetica", 14, "bold")
            ).pack(anchor="w", padx=10, pady=(0, 5))

    def _build_dashboard_right_column(self) -> None:
        """Construye la columna derecha del dashboard."""
        right_frame = ctk.CTkScrollableFrame(
            self.main_frame, fg_color=UI_COLORS["bg_card"], corner_radius=15
        )
        right_frame.grid(
            row=1, column=1, sticky="nsew", padx=(10, 20), pady=10,
            ipadx=25, ipady=25
        )

        ctk.CTkLabel(
            right_frame, text="PROGRESO POR MATERIA",
            font=("Helvetica", 12, "bold"), text_color=UI_COLORS["text_main"]
        ).pack(pady=(0, 15), anchor="w")

        for materia in self.semestre:
            mat_frame = ctk.CTkFrame(right_frame, fg_color="transparent")
            mat_frame.pack(fill="x", pady=5, padx=5)

            # Nombre materia
            ctk.CTkLabel(
                mat_frame, text=materia.nombre,
                font=("Helvetica", 11, "bold"),
                text_color=UI_COLORS["text_main"]
            ).pack(anchor="w", padx=5, pady=(5, 0))

            # Barra de progreso
            progreso = materia.acumulado_notas / 100
            progress_bar = ctk.CTkProgressBar(
                mat_frame, height=12,
                fg_color=UI_COLORS["progress_track"],
                progress_color=UI_COLORS["accent_blue"],
                border_width=0
            )
            progress_bar.pack(fill="x", padx=5, pady=5)
            progress_bar.set(progreso if progreso <= 1 else 1)

            # Textos de puntos
            info_frame = ctk.CTkFrame(mat_frame, fg_color="transparent")
            info_frame.pack(fill="x", padx=5, pady=(0, 5))

            ganados = round(materia.acumulado_notas, 2)
            faltantes = 100 - ganados
            faltantes = 0 if faltantes < 0 else round(faltantes, 2)

            ctk.CTkLabel(
                info_frame, text=f"Puntaje: {ganados}/100",
                text_color="#2FA572", font=("Helvetica", 11)
            ).pack(side="left")

            faltan_color = (
                "#E53935" if ganados < materia.nota_minima else "gray"
            )
            ctk.CTkLabel(
                info_frame, text=f"Faltan: {faltantes}",
                text_color=faltan_color, font=("Helvetica", 11)
            ).pack(side="right")

    def _build_dashboard_bottom_summary(self) -> None:
        """Construye el resumen inferior del dashboard."""
        bottom_frame = ctk.CTkFrame(
            self.main_frame, fg_color=UI_COLORS["bg_card"], corner_radius=15
        )
        bottom_frame.grid(
            row=2, column=0, columnspan=2,
            sticky="ew", padx=20, pady=(10, 20),
            ipadx=25, ipady=25
        )

        bottom_frame.grid_columnconfigure(0, weight=1)
        bottom_frame.grid_columnconfigure(1, weight=1)
        bottom_frame.grid_columnconfigure(2, weight=1)

        # Metrics calculation
        promedio = calcular_promedio_general(self.semestre)
        materias_aprobadas = sum(
            1 for m in self.semestre if m.acumulado_notas >= m.nota_minima
        )
        total_materias = len(self.semestre)
        porcentaje_avance = (
            round((materias_aprobadas / total_materias) * 100, 2)
            if total_materias > 0 else 0
        )

        # CGPA Frame
        cgpa_frame = ctk.CTkFrame(bottom_frame, fg_color="transparent")
        cgpa_frame.grid(row=0, column=0, pady=15)
        ctk.CTkLabel(
            cgpa_frame, text="PROMEDIO GENERAL",
            font=("Helvetica", 11), text_color=UI_COLORS["text_secondary"]
        ).pack()
        ctk.CTkLabel(
            cgpa_frame, text=f"{promedio}",
            font=("Helvetica", 24, "bold"), text_color=UI_COLORS["text_main"]
        ).pack()

        # Passed Subjects Frame
        passed_frame = ctk.CTkFrame(bottom_frame, fg_color="transparent")
        passed_frame.grid(row=0, column=1, pady=15)
        ctk.CTkLabel(
            passed_frame, text="MATERIAS APROBADAS",
            font=("Helvetica", 11), text_color=UI_COLORS["text_secondary"]
        ).pack()
        ctk.CTkLabel(
            passed_frame, text=f"{materias_aprobadas} / {total_materias}",
            font=("Helvetica", 24, "bold"), text_color=UI_COLORS["text_main"]
        ).pack()

        # Overall Progress Frame
        progress_frame = ctk.CTkFrame(bottom_frame, fg_color="transparent")
        progress_frame.grid(row=0, column=2, pady=15)
        ctk.CTkLabel(
            progress_frame, text="AVANCE GENERAL",
            font=("Helvetica", 11), text_color=UI_COLORS["text_secondary"]
        ).pack()
        ctk.CTkLabel(
            progress_frame, text=f"{porcentaje_avance}%",
            font=("Helvetica", 24, "bold"), text_color=UI_COLORS["text_main"]
        ).pack()

    def show_agregar(self) -> None:
        """Muestra la vista para agregar una materia."""
        self.set_active_view("agregar")
        self.clear_main_frame()

        # Contenedor centrado (solid background)
        form_frame = ctk.CTkFrame(self.main_frame, fg_color="transparent")
        form_frame.place(relx=0.5, rely=0.5, anchor="center")

        label = ctk.CTkLabel(
            form_frame, text="Agregar Nueva Materia",
            font=("Helvetica", 24, "bold"), text_color=UI_COLORS["text_main"]
        )
        label.pack(pady=(0, 20))

        self.nombre_materia_entry = ctk.CTkEntry(
            form_frame, placeholder_text="✏️ Nombre de la materia",
            width=350, height=45, corner_radius=10,
            fg_color="#F8FAFC", border_color="#E2E8F0", border_width=2,
            text_color=UI_COLORS["text_main"]
        )
        self.nombre_materia_entry.pack(pady=10)

        btn = ctk.CTkButton(
            form_frame, text="Guardar", command=self.agregar_materia,
            width=350, height=45, fg_color=UI_COLORS["cyan_btn"],
            hover_color="#0891B2", font=("Helvetica", 14, "bold"),
            text_color="#FFFFFF"
        )
        btn.pack(pady=20)

    def agregar_materia(self) -> None:
        """Agrega una nueva materia si no existe."""
        nombre = self.nombre_materia_entry.get().strip()
        if not nombre:
            messagebox.showwarning(
                "Advertencia", "El nombre de la materia no puede estar vacío."
            )
            return

        materia_existente = next(
            (m for m in self.semestre if m.nombre.lower() == nombre.lower()),
            None
        )
        if materia_existente:
            messagebox.showwarning(
                "Advertencia", f"La materia '{nombre}' ya existe."
            )
            return

        nueva_materia = Materia(nombre)
        self.semestre.append(nueva_materia)
        guardar_datos(self.semestre)
        messagebox.showinfo("Éxito", f"'{nombre}' se ha agregado con éxito.")
        self.nombre_materia_entry.delete(0, 'end')

    def show_gestionar(self) -> None:
        """Muestra la vista para gestionar evaluaciones de una materia."""
        self.set_active_view("gestionar")
        self.clear_main_frame()

        form_frame = ctk.CTkFrame(self.main_frame, fg_color="transparent")
        form_frame.place(relx=0.5, rely=0.5, anchor="center")

        label = ctk.CTkLabel(
            form_frame, text="Gestionar Materia",
            font=("Helvetica", 24, "bold"), text_color=UI_COLORS["text_main"]
        )
        label.pack(pady=(0, 20))

        if not self.semestre:
            ctk.CTkLabel(
                form_frame, text="No tienes materias registradas.",
                text_color=UI_COLORS["text_secondary"]
            ).pack()
            return

        nombres_materias = [m.nombre for m in self.semestre]
        self.materia_combobox = ctk.CTkComboBox(
            form_frame, values=nombres_materias,
            width=350, height=45, corner_radius=10,
            fg_color="#F8FAFC", border_color="#E2E8F0", border_width=2,
            text_color=UI_COLORS["text_main"]
        )
        self.materia_combobox.pack(pady=10)

        self.eval_nombre_entry = ctk.CTkEntry(
            form_frame, placeholder_text="✏️ Nombre de evaluación",
            width=350, height=45, corner_radius=10,
            fg_color="#F8FAFC", border_color="#E2E8F0", border_width=2,
            text_color=UI_COLORS["text_main"]
        )
        self.eval_nombre_entry.pack(pady=10)

        self.eval_puntos_totales_entry = ctk.CTkEntry(
            form_frame, placeholder_text="🛡️ Puntos totales",
            width=350, height=45, corner_radius=10,
            fg_color="#F8FAFC", border_color="#E2E8F0", border_width=2,
            text_color=UI_COLORS["text_main"]
        )
        self.eval_puntos_totales_entry.pack(pady=10)

        self.eval_puntos_ganados_entry = ctk.CTkEntry(
            form_frame, placeholder_text="🏆 Puntos ganados",
            width=350, height=45, corner_radius=10,
            fg_color="#F8FAFC", border_color="#E2E8F0", border_width=2,
            text_color=UI_COLORS["text_main"]
        )
        self.eval_puntos_ganados_entry.pack(pady=10)

        btn = ctk.CTkButton(
            form_frame, text="Registrar Evaluación",
            command=self.registrar_eval,
            width=350, height=45, fg_color=UI_COLORS["cyan_btn"],
            hover_color="#0891B2", font=("Helvetica", 14, "bold"),
            text_color="#FFFFFF"
        )
        btn.pack(pady=20)

    def registrar_eval(self) -> None:
        """Registra una evaluación en la materia seleccionada."""
        nombre_materia = self.materia_combobox.get()
        materia = next(
            (m for m in self.semestre if m.nombre == nombre_materia), None
        )

        if not materia:
            messagebox.showwarning("Error", "Materia no encontrada.")
            return

        nombre_eval = self.eval_nombre_entry.get().strip()
        if not nombre_eval:
            messagebox.showwarning(
                "Error",
                "El nombre de evaluación no puede estar vacío."
            )
            return

        try:
            ptos = float(self.eval_puntos_totales_entry.get())
            if ptos <= 0:
                messagebox.showwarning(
                    "Error",
                    "Los puntos totales deben ser mayores a cero."
                )
                return

            ptos_gan = float(self.eval_puntos_ganados_entry.get())
            if ptos_gan < 0 or ptos_gan > ptos:
                messagebox.showwarning(
                    "Error",
                    "Los puntos ganados deben estar entre 0 y el total."
                )
                return

            materia.registrar_evaluacion(nombre_eval, ptos_gan, ptos)
            guardar_datos(self.semestre)
            messagebox.showinfo(
                "Éxito", "¡Evaluación registrada exitosamente!"
            )

            self.eval_nombre_entry.delete(0, 'end')
            self.eval_puntos_totales_entry.delete(0, 'end')
            self.eval_puntos_ganados_entry.delete(0, 'end')

        except ValueError:
            messagebox.showwarning(
                "Error", "Debes ingresar números válidos para los puntos."
            )

    def show_resumen(self) -> None:
        """Muestra el resumen final del semestre."""
        self.set_active_view("resumen")
        self.clear_main_frame()

        # Grid para Resumen
        self.main_frame.grid_rowconfigure(0, weight=0)
        self.main_frame.grid_rowconfigure(1, weight=1)
        self.main_frame.grid_columnconfigure(0, weight=1)

        # Contenedor Superior (Tarjetas Promedio General y Avance)
        top_frame = ctk.CTkFrame(self.main_frame, fg_color="transparent")
        top_frame.grid(row=0, column=0, sticky="ew", padx=20, pady=20)
        top_frame.grid_columnconfigure(0, weight=1)
        top_frame.grid_columnconfigure(1, weight=1)

        # Promedio General Card
        promedio = calcular_promedio_general(self.semestre)
        avg_card = ctk.CTkFrame(
            top_frame, fg_color=UI_COLORS["bg_card"], corner_radius=15
        )
        avg_card.grid(
            row=0, column=0, sticky="ew", padx=(0, 10), ipadx=20, ipady=20
        )

        ctk.CTkLabel(
            avg_card, text="PROMEDIO GENERAL",
            font=("Helvetica", 12, "bold"),
            text_color=UI_COLORS["text_secondary"]
        ).pack(anchor="w")

        ctk.CTkLabel(
            avg_card, text=f"{promedio}",
            font=("Helvetica", 40, "bold"), text_color=UI_COLORS["accent_blue"]
        ).pack(anchor="w", pady=(5, 0))

        # Avance General Card
        materias_aprobadas = sum(
            1 for m in self.semestre if m.acumulado_notas >= m.nota_minima
        )
        total_materias = len(self.semestre)
        porcentaje_avance = (
            (materias_aprobadas / total_materias) if total_materias > 0 else 0
        )

        prog_card = ctk.CTkFrame(
            top_frame, fg_color=UI_COLORS["bg_card"], corner_radius=15
        )
        prog_card.grid(
            row=0, column=1, sticky="ew", padx=(10, 0), ipadx=20, ipady=20
        )

        ctk.CTkLabel(
            prog_card, text="AVANCE DEL SEMESTRE",
            font=("Helvetica", 12, "bold"),
            text_color=UI_COLORS["text_secondary"]
        ).pack(anchor="w")

        progress_bar = ctk.CTkProgressBar(
            prog_card, height=12,
            fg_color=UI_COLORS["progress_track"],
            progress_color=UI_COLORS["accent_blue"],
            border_width=0
        )
        progress_bar.pack(fill="x", pady=(15, 5))
        progress_bar.set(porcentaje_avance)

        ctk.CTkLabel(
            prog_card,
            text=f"{materias_aprobadas} de {total_materias} mat. aprobadas",
            font=("Helvetica", 12), text_color=UI_COLORS["text_secondary"]
        ).pack(anchor="w")

        # Contenedor Inferior (Tabla Scrollable)
        bottom_frame = ctk.CTkScrollableFrame(
            self.main_frame, fg_color=UI_COLORS["bg_card"], corner_radius=15
        )
        bottom_frame.grid(
            row=1, column=0, sticky="nsew", padx=20, pady=(0, 20),
            ipadx=20, ipady=20
        )

        # Header de la tabla
        header_frame = ctk.CTkFrame(bottom_frame, fg_color="transparent")
        header_frame.pack(fill="x", pady=(0, 10))

        headers = [
            ("MATERIA", 0.4), ("PROMEDIO", 0.2),
            ("PUNTOS", 0.2), ("ESTADO", 0.2)
        ]
        for i, (text, weight) in enumerate(headers):
            header_frame.grid_columnconfigure(i, weight=int(weight * 10))
            ctk.CTkLabel(
                header_frame, text=text,
                font=("Helvetica", 11, "bold"),
                text_color=UI_COLORS["text_secondary"], anchor="w"
            ).grid(row=0, column=i, sticky="w", padx=5)

        # Separator line
        ctk.CTkFrame(
            bottom_frame, height=2, fg_color=UI_COLORS["progress_track"]
        ).pack(fill="x", pady=(0, 10))

        if not self.semestre:
            ctk.CTkLabel(
                bottom_frame, text="No hay materias registradas.",
                font=("Helvetica", 14), text_color=UI_COLORS["text_secondary"]
            ).pack(pady=20)
        else:
            for materia in self.semestre:
                row_frame = ctk.CTkFrame(bottom_frame, fg_color="transparent")
                row_frame.pack(fill="x", pady=10)

                row_frame.grid_columnconfigure(0, weight=4)
                row_frame.grid_columnconfigure(1, weight=2)
                row_frame.grid_columnconfigure(2, weight=2)
                row_frame.grid_columnconfigure(3, weight=2)

                # Nombre
                ctk.CTkLabel(
                    row_frame, text=materia.nombre,
                    font=("Helvetica", 12, "bold"),
                    text_color=UI_COLORS["text_main"], anchor="w"
                ).grid(row=0, column=0, sticky="w", padx=5)

                # Promedio
                ctk.CTkLabel(
                    row_frame, text=f"{round(materia.acumulado_notas, 2)}",
                    font=("Helvetica", 12),
                    text_color=UI_COLORS["text_main"], anchor="w"
                ).grid(row=0, column=1, sticky="w", padx=5)

                # Puntos
                ctk.CTkLabel(
                    row_frame,
                    text=f"{round(materia.puntos_totales_evaluados, 2)} / 100",
                    font=("Helvetica", 12),
                    text_color=UI_COLORS["text_secondary"], anchor="w"
                ).grid(row=0, column=2, sticky="w", padx=5)

                # Estado Pill
                aprobado = materia.acumulado_notas >= materia.nota_minima
                pill_color = "#10B981" if aprobado else "#3B82F6"
                pill_text = "Aprobado" if aprobado else "Evaluando"

                pill = ctk.CTkFrame(
                    row_frame, fg_color=pill_color, corner_radius=10
                )
                pill.grid(
                    row=0, column=3, sticky="w", padx=5, ipadx=10, ipady=2
                )

                ctk.CTkLabel(
                    pill, text=pill_text,
                    font=("Helvetica", 10, "bold"), text_color="#FFFFFF"
                ).pack()

                ctk.CTkFrame(
                    bottom_frame, height=1, fg_color=UI_COLORS["bg_grid_item"]
                ).pack(fill="x", pady=5)

    def show_eliminar(self) -> None:
        """Muestra la vista para eliminar una materia."""
        self.set_active_view("eliminar")
        self.clear_main_frame()
        label = ctk.CTkLabel(
            self.main_frame, text="Eliminar Materia",
            font=ctk.CTkFont(size=24, weight="bold")
        )
        label.pack(pady=20)

        if not self.semestre:
            ctk.CTkLabel(
                self.main_frame, text="No tienes materias registradas."
            ).pack()
            return

        nombres_materias = [m.nombre for m in self.semestre]
        self.materia_del_combobox = ctk.CTkComboBox(
            self.main_frame, values=nombres_materias, width=300
        )
        self.materia_del_combobox.pack(pady=10)

        btn = ctk.CTkButton(
            self.main_frame, text="Eliminar",
            command=self.eliminar_materia_ui,
            fg_color="red", hover_color="darkred"
        )
        btn.pack(pady=20)

    def eliminar_materia_ui(self) -> None:
        """Maneja la eliminación de una materia desde la interfaz."""
        nombre = self.materia_del_combobox.get()
        if not nombre:
            return

        confirm = messagebox.askyesno(
            "Confirmar", f"¿Estás seguro de eliminar '{nombre}'?"
        )
        if confirm:
            exito = eliminar_materia(self.semestre, nombre)
            if exito:
                guardar_datos(self.semestre)
                messagebox.showinfo("Éxito", f"Materia '{nombre}' eliminada.")
                self.show_eliminar()
            else:
                messagebox.showwarning(
                    "Error", "No se pudo eliminar la materia."
                )

    def exportar(self) -> None:
        """Exporta el boletín de calificaciones y abre el archivo."""
        self.set_active_view("exportar")
        if not self.semestre:
            messagebox.showwarning(
                "Advertencia", "No tienes materias registradas para exportar."
            )
            return

        ruta_archivo = filedialog.asksaveasfilename(
            defaultextension=".txt",
            filetypes=[("Archivos de texto", "*.txt")],
            initialfile="boletin_oficial.txt",
            title="Guardar Boletín Como"
        )

        if not ruta_archivo:
            return

        exportar_boletin(self.semestre, ruta_archivo)
        messagebox.showinfo(
            "Éxito", f"Boletín exportado a:\n{ruta_archivo}"
        )

        # Abrir archivo automáticamente
        try:
            if platform.system() == "Windows":
                os.startfile(ruta_archivo)
            elif platform.system() == "Darwin":
                subprocess.call(["open", ruta_archivo])
            else:
                subprocess.call(["xdg-open", ruta_archivo])
        except Exception as e:
            messagebox.showerror(
                "Error", f"No se pudo abrir el archivo automáticamente:\n{e}"
            )

    def show_buscar(self) -> None:
        """Muestra la vista para buscar una materia."""
        self.set_active_view("buscar")
        self.clear_main_frame()
        label = ctk.CTkLabel(
            self.main_frame, text="Buscar Materia",
            font=ctk.CTkFont(size=24, weight="bold")
        )
        label.pack(pady=20)

        if not self.semestre:
            ctk.CTkLabel(
                self.main_frame, text="No tienes materias registradas."
            ).pack()
            return

        nombres_materias = [m.nombre for m in self.semestre]
        self.buscar_combobox = ctk.CTkComboBox(
            self.main_frame, values=nombres_materias, width=300
        )
        self.buscar_combobox.pack(pady=10)

        btn = ctk.CTkButton(
            self.main_frame, text="Buscar", command=self.realizar_busqueda
        )
        btn.pack(pady=10)

        self.resultado_textbox = ctk.CTkTextbox(
            self.main_frame, width=500, height=300
        )
        self.resultado_textbox.pack(pady=10, fill="both", expand=True)

    def realizar_busqueda(self) -> None:
        """Busca y muestra las materias en base al texto ingresado."""
        texto = self.buscar_combobox.get().strip()
        if not texto:
            return

        resultados = buscar_materias(self.semestre, texto)

        self.resultado_textbox.configure(state="normal")
        self.resultado_textbox.delete("0.0", "end")

        if not resultados:
            self.resultado_textbox.insert(
                "end",
                f"No se encontró ninguna materia que contenga '{texto}'."
            )
        else:
            for m in resultados:
                self.resultado_textbox.insert("end", m.obtener_estado() + "\n")

        self.resultado_textbox.configure(state="disabled")


def principal() -> None:
    """Función principal que inicializa y ejecuta la aplicación gráfica."""
    ctk.set_appearance_mode("System")
    ctk.set_default_color_theme("blue")
    app = GestorAcademicoApp()
    app.mainloop()


if __name__ == "__main__":
    try:
        principal()
    except KeyboardInterrupt:
        print("\n\nSaliendo del programa de forma segura... 👋\n")
