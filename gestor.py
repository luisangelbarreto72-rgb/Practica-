import json
import os

class Materia:
    def __init__(self, nombre: str, nota_minima: float = 60.0):
        self.nombre = nombre
        self.nota_minima = nota_minima
        self.acumulado_notas = 0.0
        self.puntos_totales_evaluados = 0.0
        self.evaluaciones = [] # Lista para llevar registro de las evaluaciones

    def registrar_evaluacion(self, nombre_evaluacion: str, puntos_ganados: float, puntos_totales_prueba: float):
        """Registra una nueva evaluación y suma los puntos."""
        self.acumulado_notas += puntos_ganados
        self.puntos_totales_evaluados += puntos_totales_prueba
        
        # Guardamos un diccionario con los datos de la evaluación
        evaluacion = {
            "nombre": nombre_evaluacion,
            "ganados": puntos_ganados,
            "totales": puntos_totales_prueba
        }
        self.evaluaciones.append(evaluacion)

    def calcular_promedio_actual(self) -> float:
        """Calcula el promedio actual basado en los puntos evaluados."""
        if self.puntos_totales_evaluados == 0:
            return 0.0
        return (self.acumulado_notas / self.puntos_totales_evaluados) * 100

    def obtener_estado(self) -> str:
        promedio = self.calcular_promedio_actual()
        estado = "Aprobada" if promedio >= self.nota_minima else "En riesgo / Reprobada"
        return f"Materia: {self.nombre} | Promedio Actual: {promedio:.2f}% | Estado: {estado}"

    def a_diccionario(self) -> dict:
        """Convierte el objeto Materia a un diccionario para poder guardarlo en JSON."""
        return {
            "nombre": self.nombre,
            "nota_minima": self.nota_minima,
            "acumulado_notas": self.acumulado_notas,
            "puntos_totales_evaluados": self.puntos_totales_evaluados,
            "evaluaciones": self.evaluaciones
        }

    @classmethod
    def desde_diccionario(cls, datos: dict):
        """Reconstruye un objeto Materia a partir de un diccionario del archivo JSON."""
        materia = cls(datos["nombre"], datos["nota_minima"])
        materia.acumulado_notas = datos["acumulado_notas"]
        materia.puntos_totales_evaluados = datos["puntos_totales_evaluados"]
        materia.evaluaciones = datos.get("evaluaciones", [])
        return materia


# --- FUNCIONES DE PERSISTENCIA (GUARDAR Y CARGAR DATOS) ---

NOMBRE_ARCHIVO = "datos.json"

def guardar_datos(semestre: list):
    """Guarda la lista de materias en un archivo JSON en el disco duro."""
    datos_para_guardar = [materia.a_diccionario() for materia in semestre]
    try:
        with open(NOMBRE_ARCHIVO, "w", encoding="utf-8") as archivo:
            json.dump(datos_para_guardar, archivo, indent=4, ensure_ascii=False)
        print("💾 [Sistema]: Datos guardados con éxito en datos.json")
    except Exception as e:
        print(f"⚠️ [Error]: No se pudieron guardar los datos: {e}")

def cargar_datos() -> list:
    """Carga las materias desde el archivo JSON si existe."""
    if not os.path.exists(NOMBRE_ARCHIVO):
        return [] # Si el archivo no existe, retornamos una lista vacía
    
    try:
        with open(NOMBRE_ARCHIVO, "r", encoding="utf-8") as archivo:
            datos_cargados = json.load(archivo)
            # Convertimos cada diccionario de vuelta a un objeto de la clase Materia
            semestre = [Materia.desde_diccionario(d) for d in datos_cargados]
            print(f"📂 [Sistema]: Se cargaron {len(semestre)} materias desde datos.json")
            return semestre
    except Exception as e:
        print(f"⚠️ [Error]: No se pudieron leer los datos guardados: {e}")
        return []


# --- MENÚ PRINCIPAL ---

def main() -> None:
    # Cargamos el semestre automáticamente al iniciar el programa
    semestre = cargar_datos()

    while True:
        print("\n=== MENÚ PRINCIPAL ===")
        print("1. Agregar nueva materia o registrar evaluaciones")
        print("2. Ver resumen del semestre")
        print("3. Calcular promedio general")
        print("4. Salir y guardar")
        
        try:
            opcion = int(input("Elige una opción (1/2/3/4): "))
        except ValueError:
            print("⚠️ Error: Por favor, ingresa un número válido.")
            continue

        if opcion == 1:
            nombre_input = input("Ingresa el nombre de la materia: ").strip()
            
            # Verificamos si la materia ya existe en el semestre para actualizarla o crear una nueva
            materia_encontrada = None
            for m in semestre:
                if m.nombre.lower() == nombre_input.lower():
                    materia_encontrada = m
                    break
            
            if materia_encontrada:
                print(f"🔍 ¡Materia encontrada! Añadiendo evaluación a '{materia_encontrada.nombre}'.")
                nueva_materia = materia_encontrada
            else:
                try:
                    nota_min = float(input("Ingresa la nota mínima para aprobar (ej. 60): "))
                except ValueError:
                    nota_min = 60.0
                nueva_materia = Materia(nombre_input, nota_min)
                semestre.append(nueva_materia)
                print(f"✅ ¡{nueva_materia.nombre} agregada con éxito a tu semestre!")

            # Registrar evaluaciones con los textos claros que pediste
            while True:
                nombre_eval = input("Nombre de la evaluación (o escribe 'listo' para terminar): ")
                if nombre_eval.lower() == 'listo':
                    break
                try:
                    ganados = float(input("Puntos obtenidos: "))
                    totales = float(input("Puntos de la prueba: "))
                    nueva_materia.registrar_evaluacion(nombre_eval, ganados, totales)
                    print("👍 ¡Evaluación registrada con éxito!")
                except ValueError:
                    print("⚠️ Error en los puntos. Deben ser números.")

        elif opcion == 2:
            if not semestre:
                print("📭 No hay materias registradas en el semestre todavía.")
            else:
                print("\n=== RESUMEN FINAL DE TU SEMESTRE ===")
                for materia in semestre:
                    print(materia.obtener_estado())
                    if materia.evaluaciones:
                        print("   Evaluaciones registradas:")
                        for ev in materia.evaluaciones:
                            print(f"    - {ev['nombre']}: {ev['ganados']}/{ev['totales']}")

        elif opcion == 3:
            if not semestre:
                print("📭 No hay materias registradas para calcular el promedio.")
            else:
                suma_promedios = sum(m.calcular_promedio_actual() for m in semestre)
                promedio_general = suma_promedios / len(semestre)
                print(f"\n📊 Promedio General del Semestre: {promedio_general:.2f}%")

        elif opcion == 4:
            # Guardamos los datos antes de salir del programa
            guardar_datos(semestre)
            print("¡Hasta luego! Tus datos se han guardado de forma segura.")
            break
        else:
            print("⚠️ Opción no válida. Por favor, escribe 1, 2, 3 o 4.")

if __name__ == "__main__":
    main()
