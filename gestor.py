import json
import os
import customtkinter as ctk
from tkinter import messagebox
from typing import List, Optional

ARCHIVO_DATOS = "datos.json"


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


def exportar_boletin(lista_materias: List[Materia]) -> None:
    """Crea un documento de texto real con el reporte de calificaciones."""
    if not lista_materias:
        print("\n⚠️  No tienes materias registradas para exportar.")
        return

    with open("boletin_oficial.txt", "w", encoding="utf-8") as archivo:
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

    print("\n📄 ¡Éxito! Revisa tu carpeta, se ha creado 'boletin_oficial.txt'.")


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
        self.sidebar_frame = ctk.CTkFrame(self, width=200, corner_radius=0)
        self.sidebar_frame.grid(row=0, column=0, sticky="nsew")
        self.sidebar_frame.grid_rowconfigure(8, weight=1)

        self.logo_label = ctk.CTkLabel(
            self.sidebar_frame, text="Gestor Académico",
            font=ctk.CTkFont(size=20, weight="bold")
        )
        self.logo_label.grid(row=0, column=0, padx=20, pady=(20, 10))

        self.btn_agregar = ctk.CTkButton(
            self.sidebar_frame, text="1. Agregar Materia",
            command=self.show_agregar
        )
        self.btn_agregar.grid(row=1, column=0, padx=20, pady=10)

        self.btn_gestionar = ctk.CTkButton(
            self.sidebar_frame, text="2. Gestionar Materia",
            command=self.show_gestionar
        )
        self.btn_gestionar.grid(row=2, column=0, padx=20, pady=10)

        self.btn_resumen = ctk.CTkButton(
            self.sidebar_frame, text="3. Ver Resumen",
            command=self.show_resumen
        )
        self.btn_resumen.grid(row=3, column=0, padx=20, pady=10)

        self.btn_eliminar = ctk.CTkButton(
            self.sidebar_frame, text="4. Eliminar Materia",
            command=self.show_eliminar
        )
        self.btn_eliminar.grid(row=4, column=0, padx=20, pady=10)

        self.btn_exportar = ctk.CTkButton(
            self.sidebar_frame, text="5. Exportar Boletín",
            command=self.exportar
        )
        self.btn_exportar.grid(row=5, column=0, padx=20, pady=10)

        self.btn_buscar = ctk.CTkButton(
            self.sidebar_frame, text="6. Buscar Materia",
            command=self.show_buscar
        )
        self.btn_buscar.grid(row=6, column=0, padx=20, pady=10)

        self.btn_salir = ctk.CTkButton(
            self.sidebar_frame, text="7. Salir",
            command=self.destroy
        )
        self.btn_salir.grid(row=7, column=0, padx=20, pady=10)

        # Main Frame
        self.main_frame = ctk.CTkFrame(self, corner_radius=10)
        self.main_frame.grid(row=0, column=1, padx=20, pady=20, sticky="nsew")
        self.main_frame.grid_rowconfigure(0, weight=1)
        self.main_frame.grid_columnconfigure(0, weight=1)

        self.show_resumen()

    def clear_main_frame(self) -> None:
        """Elimina todos los widgets del marco principal."""
        for widget in self.main_frame.winfo_children():
            widget.destroy()

    def show_agregar(self) -> None:
        """Muestra la vista para agregar una materia."""
        self.clear_main_frame()
        label = ctk.CTkLabel(
            self.main_frame, text="Agregar Nueva Materia",
            font=ctk.CTkFont(size=24, weight="bold")
        )
        label.pack(pady=20)

        self.nombre_materia_entry = ctk.CTkEntry(
            self.main_frame, placeholder_text="Nombre de la materia", width=300
        )
        self.nombre_materia_entry.pack(pady=10)

        btn = ctk.CTkButton(
            self.main_frame, text="Guardar", command=self.agregar_materia
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
        self.clear_main_frame()
        label = ctk.CTkLabel(
            self.main_frame, text="Gestionar Materia",
            font=ctk.CTkFont(size=24, weight="bold")
        )
        label.pack(pady=20)

        if not self.semestre:
            ctk.CTkLabel(
                self.main_frame, text="No tienes materias registradas."
            ).pack()
            return

        nombres_materias = [m.nombre for m in self.semestre]
        self.materia_combobox = ctk.CTkComboBox(
            self.main_frame, values=nombres_materias, width=300
        )
        self.materia_combobox.pack(pady=10)

        self.eval_nombre_entry = ctk.CTkEntry(
            self.main_frame, placeholder_text="Nombre de evaluación", width=300
        )
        self.eval_nombre_entry.pack(pady=10)

        self.eval_puntos_totales_entry = ctk.CTkEntry(
            self.main_frame, placeholder_text="Puntos totales", width=300
        )
        self.eval_puntos_totales_entry.pack(pady=10)

        self.eval_puntos_ganados_entry = ctk.CTkEntry(
            self.main_frame, placeholder_text="Puntos ganados", width=300
        )
        self.eval_puntos_ganados_entry.pack(pady=10)

        btn = ctk.CTkButton(
            self.main_frame, text="Registrar Evaluación",
            command=self.registrar_eval
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
        self.clear_main_frame()
        label = ctk.CTkLabel(
            self.main_frame, text="Resumen Final de tu Semestre",
            font=ctk.CTkFont(size=24, weight="bold")
        )
        label.pack(pady=20)

        promedio = calcular_promedio_general(self.semestre)
        ctk.CTkLabel(
            self.main_frame,
            text=f"Promedio General Actual: {promedio} puntos",
            font=ctk.CTkFont(size=16, weight="bold")
        ).pack(pady=10)

        textbox = ctk.CTkTextbox(self.main_frame, width=500, height=350)
        textbox.pack(pady=10, fill="both", expand=True)

        if not self.semestre:
            textbox.insert("0.0", "No hay materias registradas.")
        else:
            for m in self.semestre:
                textbox.insert("end", m.obtener_estado() + "\n")
        textbox.configure(state="disabled")

    def show_eliminar(self) -> None:
        """Muestra la vista para eliminar una materia."""
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
        """Exporta el boletín de calificaciones."""
        if not self.semestre:
            messagebox.showwarning(
                "Advertencia", "No tienes materias registradas para exportar."
            )
            return

        exportar_boletin(self.semestre)
        messagebox.showinfo(
            "Éxito", "Boletín exportado a 'boletin_oficial.txt'"
        )

    def show_buscar(self) -> None:
        """Muestra la vista para buscar una materia."""
        self.clear_main_frame()
        label = ctk.CTkLabel(
            self.main_frame, text="Buscar Materia",
            font=ctk.CTkFont(size=24, weight="bold")
        )
        label.pack(pady=20)

        self.buscar_entry = ctk.CTkEntry(
            self.main_frame, placeholder_text="Ingresa parte del nombre",
            width=300
        )
        self.buscar_entry.pack(pady=10)

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
        texto = self.buscar_entry.get().strip()
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
