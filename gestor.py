import json
import os
from typing import List, Optional

ARCHIVO_DATOS = "datos.json"

class Materia:
    def __init__(self, nombre: str, nota_minima: float = 60.0) -> None:
        self.nombre = nombre
        self.nota_minima = nota_minima
        self.acumulado_notas = 0.0
        self.puntos_totales_evaluados = 0.0
        self.evaluaciones = []

    def registrar_evaluacion(self, nombre_evaluacion: str, puntos_ganados: float, puntos_totales_prueba: float) -> None:
        self.acumulado_notas += puntos_ganados
        self.puntos_totales_evaluados += puntos_totales_prueba
        self.evaluaciones.append({
            "nombre": nombre_evaluacion,
            "ganados": puntos_ganados,
            "totales": puntos_totales_prueba,
        })

    def calcular_promedio(self) -> float:
        if self.puntos_totales_evaluados == 0:
            return 0.0
        return (self.acumulado_notas / self.puntos_totales_evaluados) * 100

    def obtener_estado(self) -> str:
        reporte = [
            f"\n=== REPORTE DE PROGRESO: {self.nombre.upper()} ===",
            f"  Puntos evaluados hasta ahora: {self.puntos_totales_evaluados} pts",
            f"  Puntaje ganado actual: {round(self.acumulado_notas, 2)} pts",
            f"  Rendimiento actual: {round(self.calcular_promedio(), 2)}%",
            "-" * 40,
        ]

        if self.evaluaciones:
            reporte.append("  Evaluaciones registradas:")
            for ev in self.evaluaciones:
                reporte.append(f"   - {ev['nombre']}: sacaste {ev['ganados']} de {ev['totales']} pts")
            reporte.append("-" * 40)
        else:
            reporte.append("  (No hay evaluaciones registradas aún)")
            reporte.append("-" * 40)

        if self.acumulado_notas >= self.nota_minima:
            reporte.append("  ✅ ¡Aprobada! Has alcanzado los puntos mínimos.")
        else:
            faltante = self.nota_minima - self.acumulado_notas
            reporte.append(f"  ⚠️ Te faltan {round(faltante, 2)} puntos para los {self.nota_minima} mínimos requeridos.")

        reporte.append("=" * 40)
        return "\n".join(reporte)

    def to_dict(self) -> dict:
        return {
            "nombre": self.nombre,
            "nota_minima": self.nota_minima,
            "acumulado_notas": self.acumulado_notas,
            "puntos_totales_evaluados": self.puntos_totales_evaluados,
            "evaluaciones": self.evaluaciones,
        }

    @classmethod
    def from_dict(cls, data: dict) -> Optional["Materia"]:
        try:
            materia = cls(data["nombre"], data.get("nota_minima", 60.0))
            materia.acumulado_notas = float(data.get("acumulado_notas", 0.0))
            materia.puntos_totales_evaluados = float(data.get("puntos_totales_evaluados", 0.0))
            materia.evaluaciones = data.get("evaluaciones", [])
            return materia
        except Exception:
            return None


def cargar_datos() -> List[Materia]:
    if not os.path.exists(ARCHIVO_DATOS):
        return []
    try:
        with open(ARCHIVO_DATOS, "r", encoding="utf-8") as f:
            contenido = f.read().strip()
            if not contenido:
                return []
            datos = json.loads(contenido)
            return [m for m in (Materia.from_dict(d) for d in datos) if m is not None]
    except Exception as e:
        print(f"\n⚠️ ATENCIÓN: El archivo 'datos.json' estaba corrupto ({e}).")
        print("Se ha iniciado un semestre limpio para evitar errores de lectura.")
        return []

def guardar_datos(semestre: List[Materia]) -> None:
    try:
        with open(ARCHIVO_DATOS, "w", encoding="utf-8") as f:
            json.dump([materia.to_dict() for materia in semestre], f, indent=4)
    except Exception as e:
        print(f"\n⚠️ Error al guardar los datos: {e}")

def solicitar_evaluaciones(materia: Materia, semestre: List[Materia]) -> None:
    while True:
        print(f"\n📝 Gestión de evaluaciones para: {materia.nombre}")
        continuar = input("¿Deseas registrar una evaluación? (si/no): ").strip().lower()
        
        # Aceptamos variantes comunes para evitar frustración
        if continuar in ["no", "n"]:
            print(f"Finalizando registro para {materia.nombre}...\n")
            break
        elif continuar not in ["si", "sí", "s", "yes", "y"]:
            print("⚠️ Opción no válida. Escribe 'si' o 'no'.")
            continue

        nombre_eval = input("\nNombre de la evaluación (ej: Parcial 1): ").strip()
        if not nombre_eval:
            print("⚠️ El nombre no puede estar vacío.")
            continue

        try:
            ptos_totales = float(input("¿Cuántos puntos en TOTAL vale la evaluación?: "))
            if ptos_totales <= 0:
                print("⚠️ El puntaje total debe ser mayor a cero.")
                continue

            ptos_ganados = float(input(f"¿Cuántos puntos SACASTE de esos {ptos_totales}?: "))
            if ptos_ganados < 0 or ptos_ganados > ptos_totales:
                print(f"⚠️ Los puntos obtenidos deben estar entre 0 y {ptos_totales}.")
                continue

            materia.registrar_evaluacion(nombre_eval, ptos_ganados, ptos_totales)
            guardar_datos(semestre)
            print("\n✅ ¡Evaluación guardada exitosamente!")

        except ValueError:
            print("\n⚠️ Error: Ingresa un número válido (ej: 20 o 15.5).")

def mostrar_menu_principal() -> str:
    print("=" * 50)
    print("      🎓 GESTOR ACADÉMICO INTELIGENTE 🎓")
    print("=" * 50)
    print("1. Agregar una nueva materia")
    print("2. Gestionar/Añadir notas a una materia")
    print("3. Ver resumen del semestre")
    print("4. Salir")
    print("-" * 50)
    return input("Elige una opción (1-4): ").strip()

def principal() -> None:
    semestre = cargar_datos()
    print("\nIniciando sistema académico...")
    if semestre:
        print(f"📂 Se cargaron {len(semestre)} materias registradas.")
    else:
        print("📂 No hay materias previas. Iniciando semestre nuevo.")

    while True:
        opcion = mostrar_menu_principal()

        if opcion == "1":
            nombre = input("\nIngresa el nombre de la nueva materia: ").strip()
            if not nombre:
                print("⚠️ El nombre no puede estar vacío.\n")
                continue

            existe = any(m.nombre.lower() == nombre.lower() for m in semestre)
            if existe:
                print(f"⚠️ '{nombre}' ya existe. Usa la opción 2 para gestionarla.\n")
            else:
                try:
                    nota_min = input("Nota mínima para aprobar (Presiona Enter para 60.0): ").strip()
                    nota_min_val = float(nota_min) if nota_min else 60.0
                except ValueError:
                    nota_min_val = 60.0

                nueva = Materia(nombre, nota_min_val)
                semestre.append(nueva)
                guardar_datos(semestre)
                print(f"✅ Materia '{nueva.nombre}' agregada con éxito.\n")
                solicitar_evaluaciones(nueva, semestre)

        elif opcion == "2":
            if not semestre:
                print("\n⚠️ No tienes materias registradas. Agrega una con la opción 1.\n")
                continue

            print("\n📚 Materias registradas:")
            for i, m in enumerate(semestre, start=1):
                print(f"  {i}. {m.nombre}")

            seleccion = input("\nIngresa el número de la materia (o '0' para volver): ").strip()
            try:
                idx = int(seleccion) - 1
                if idx == -1:
                    continue
                if 0 <= idx < len(semestre):
                    solicitar_evaluaciones(semestre[idx], semestre)
                else:
                    print("⚠️ Número fuera de rango.\n")
            except ValueError:
                print("⚠️ Por favor ingresa un número entero.\n")

        elif opcion == "3":
            if not semestre:
                print("\n📭 No hay materias registradas en el semestre.\n")
            else:
                print("\n" + "=" * 50)
                print("         📊 RESUMEN DEL SEMESTRE 📊")
                print("=" * 50)
                for m in semestre:
                    print(m.obtener_estado())
                
                promedios = [m.calcular_promedio() for m in semestre if m.puntos_totales_evaluados > 0]
                if promedios:
                    promedio_general = sum(promedios) / len(promedios)
                    print(f"\n🎯 Promedio General Actual: {round(promedio_general, 2)}%\n")
                else:
                    print("\n🎯 Aún no hay evaluaciones calificadas para un promedio general.\n")

        elif opcion == "4":
            guardar_datos(semestre)
            print("\n¡Datos guardados! Cerrando el gestor. 🎓\n")
            break

        else:
            print("\n⚠️ Opción no válida. Ingresa un número del 1 al 4.\n")

if __name__ == "__main__":
    try:
        principal()
    except KeyboardInterrupt:
        print("\n\nSaliendo de forma segura... 👋\n")
