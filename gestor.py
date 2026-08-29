# Gestor Académico Inteligente - Sistema Completo

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


def solicitar_evaluaciones(materia: Materia) -> None:
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
        except ValueError:
            print("⚠️ ¡Error! Debes ingresar un número válido, no letras.")


def main() -> None:
    """Función principal que ejecuta el programa interactivo."""
    print("=== CONFIGURACIÓN DE TU SEMESTRE ===")
    semestre = []

    while True:
        nombre_input = input("\nIngresa una materia (o escribe 'salir' para terminar): ").strip()

        if nombre_input.lower() == "salir":
            break

        nueva_materia = Materia(nombre_input)
        solicitar_evaluaciones(nueva_materia)

        semestre.append(nueva_materia)
        print(f"✅ ¡{nueva_materia.nombre} agregada con éxito a tu semestre!")

    print("\n=== RESUMEN FINAL DE TU SEMESTRE ===")
    for materia in semestre:
        print(materia.obtener_estado())


if __name__ == "__main__":
    main()
