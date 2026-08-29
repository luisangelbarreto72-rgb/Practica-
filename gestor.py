import json
import os

# Gestor Académico Inteligente - Sistema Completo

ARCHIVO_DATOS = "datos.json"

class Materia:
    def __init__(self, nombre: str, nota_minima: float = 60.0):
        self.nombre = nombre
        self.nota_minima = nota_minima
        self.acumulado_notas = 0.0
        self.puntos_totales_evaluados = 0.0

    def registrar_evaluacion(self, nombre_evaluacion: str, puntos_ganados: float, puntos_totales_prueba: float) -> None:
        """Registra una nueva evaluación y suma los puntos."""
        self.acumulado_notas += puntos_ganados
        self.puntos_totales_evaluados += puntos_totales_prueba

    def obtener_estado(self) -> str:
        """Genera un reporte del progreso actual de la materia."""
        reporte = [
            f"\n=== REPORTE DE PROGRESO: {self.nombre} ===",
            f"Puntos evaluados hasta ahora: {self.puntos_totales_evaluados} de 100 pts posibles",
            f"Puntaje ganado actual: {round(self.acumulado_notas, 2)} pts"
        ]

        if self.acumulado_notas >= self.nota_minima:
            reporte.append("¡Felicidades! Ya alcanzaste o superaste los 60 puntos para pasar.")
        else:
            faltante = self.nota_minima - self.acumulado_notas
            reporte.append(f"Te faltan {round(faltante, 2)} puntos para llegar a los {self.nota_minima} puntos mínimos.")

        return "\n".join(reporte)

    def to_dict(self) -> dict:
        """Convierte la materia a un diccionario para guardarlo en JSON."""
        return {
            "nombre": self.nombre,
            "nota_minima": self.nota_minima,
            "acumulado_notas": self.acumulado_notas,
            "puntos_totales_evaluados": self.puntos_totales_evaluados
        }

    @classmethod
    def from_dict(cls, data: dict) -> 'Materia':
        """Crea una instancia de Materia a partir de un diccionario."""
        materia = cls(data["nombre"], data.get("nota_minima", 60.0))
        materia.acumulado_notas = data.get("acumulado_notas", 0.0)
        materia.puntos_totales_evaluados = data.get("puntos_totales_evaluados", 0.0)
        return materia


def cargar_datos() -> list[Materia]:
    """Carga los datos guardados en el archivo JSON."""
    if not os.path.exists(ARCHIVO_DATOS):
        return []
    try:
        with open(ARCHIVO_DATOS, "r", encoding="utf-8") as f:
            datos = json.load(f)
            return [Materia.from_dict(d) for d in datos]
    except Exception as e:
        print(f"⚠️ Error al cargar los datos: {e}")
        return []


def guardar_datos(semestre: list[Materia]) -> None:
    """Guarda la lista de materias en el archivo JSON."""
    try:
        with open(ARCHIVO_DATOS, "w", encoding="utf-8") as f:
            json.dump([materia.to_dict() for materia in semestre], f, indent=4)
    except Exception as e:
        print(f"⚠️ Error al guardar los datos: {e}")


def solicitar_evaluaciones(materia: Materia, semestre: list[Materia]) -> None:
    """Maneja la entrada de usuario para registrar las evaluaciones de una materia."""
    while True:
        while True:
            continuar = input(f"¿Deseas registrar una nota para {materia.nombre}? (si/no): ").strip().lower()
            if continuar in ("si", "no"):
                break
            print("⚠️ Opción no válida. Por favor, escribe exactamente 'si' o 'no'.")

        if continuar == "no":
            break

        nombre_eval = input("Nombre de la evaluación (ej: Parcial 1): ").strip()

        try:
            puntos_totales = float(input("¿Cuántos puntos de la materia valía esta evaluación?: "))
            puntos_ganados = float(input(f"¿Cuántos puntos te ganaste de esos {puntos_totales}?: "))

            materia.registrar_evaluacion(nombre_eval, puntos_ganados, puntos_totales)
            print(f"-> Evaluación registrada: {nombre_eval} | Aporte directo: {puntos_ganados} pts")
            guardar_datos(semestre)
        except ValueError:
            print("⚠️ ¡Error! Debes ingresar un número válido, no letras.")


def main() -> None:
    """Función principal que ejecuta el programa interactivo."""
    semestre = cargar_datos()
    if semestre:
        print(f"✅ ¡Se cargaron {len(semestre)} materias del historial!")

    print("=== CONFIGURACIÓN DE TU SEMESTRE ===")

    while True:
        nombre_input = input("\nIngresa una materia (o escribe 'salir' para terminar): ").strip()

        if nombre_input.lower() == "salir":
            break

        materia_existente = next((m for m in semestre if m.nombre.lower() == nombre_input.lower()), None)

        if materia_existente:
            print(f"⚠️ La materia '{nombre_input}' ya existe en el historial. Vamos a registrarle notas adicionales.")
            solicitar_evaluaciones(materia_existente, semestre)
        else:
            nueva_materia = Materia(nombre_input)
            semestre.append(nueva_materia)
            guardar_datos(semestre)
            print(f"✅ ¡{nueva_materia.nombre} agregada con éxito a tu semestre!")
            solicitar_evaluaciones(nueva_materia, semestre)

    print("\n=== RESUMEN FINAL DE TU SEMESTRE ===")
    for materia in semestre:
        print(materia.obtener_estado())


if __name__ == "__main__":
    main()
