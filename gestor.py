import json
import os
from typing import List, Optional

ARCHIVO_DATOS = "datos.json"

class Materia:
    """Clase que representa una materia académica y su progreso."""

    def __init__(self, nombre: str, nota_minima: float = 60.0) -> None:
        self.nombre = nombre
        self.nota_minima = nota_minima
        self.acumulado_notas = 0.0
        self.puntos_totales_evaluados = 0.0

    def registrar_evaluacion(self, nombre_evaluacion: str, puntos_ganados: float, puntos_totales_prueba: float) -> None:
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
            reporte.append("  ✅ ¡Felicidades! Ya alcanzaste o superaste los puntos para pasar.")
        else:
            faltante = self.nota_minima - self.acumulado_notas
            reporte.append(f"  ⚠️ Te faltan {round(faltante, 2)} puntos para llegar a los {self.nota_minima} puntos mínimos.")

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
            materia.puntos_totales_evaluados = data.get("puntos_totales_evaluados", 0.0)
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


def solicitar_evaluaciones(materia: Materia, semestre: List[Materia]) -> None:
    """Maneja la entrada del usuario para registrar las evaluaciones."""
    while True:
        while True:
            print(f"\n📝  Gestión de {materia.nombre}")
            continuar = input("¿Deseas registrar una nueva nota? (si/no): ").strip().lower()
            if continuar in ("si", "no"):
                break
            print("⚠️  Opción no válida. Escribe exactamente 'si' o 'no'.")

        if continuar == "no":
            print(f"Saliendo de la gestión de {materia.nombre}...\n")
            break

        nombre_eval = input("\nNombre de la evaluación (ej: Parcial 1): ").strip()
        if not nombre_eval:
            print("⚠️  El nombre de la evaluación no puede estar vacío.")
            continue

        try:
            ptos = float(input("¿Cuántos puntos valía esta evaluación?: "))
            if ptos <= 0:
                print("⚠️  Los puntos totales deben ser mayores a cero.")
                continue

            ptos_gan = float(input(f"¿Cuántos te ganaste de esos {ptos}?: "))
            if ptos_gan < 0 or ptos_gan > ptos:
                print("⚠️  Los puntos deben estar entre 0 y el total.")
                continue

            materia.registrar_evaluacion(nombre_eval, ptos_gan, ptos)
            print("\n✅  ¡Evaluación registrada exitosamente!")
            print(f"    Evaluación: {nombre_eval} | Aporte: {ptos_gan} pts")
            guardar_datos(semestre)
        except ValueError:
            print("\n⚠️  ¡Error! Debes ingresar un número válido (ej: 15.5 o 20), no texto u otros caracteres.")
        except Exception:
            print("\n⚠️  Ocurrió un error inesperado al registrar.")


def eliminar_materia(lista_materias: List[Materia], nombre_a_eliminar: str) -> bool:
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
            archivo.write(f"Puntos ganados: {round(materia.acumulado_notas, 2)} pts\n")
            archivo.write(f"Puntos evaluados: {round(materia.puntos_totales_evaluados, 2)} pts\n")
            archivo.write("-" * 40 + "\n")
            
    print("\n📄 ¡Éxito! Revisa tu carpeta, se ha creado 'boletin_oficial.txt'.")


def buscar_materias(lista_materias: List[Materia], texto: str) -> None:
    """Busca y muestra materias que coincidan parcialmente con el texto."""
    print(f"\n🔍 Buscando coincidencias para '{texto}'...")
    coincidencias = 0
    
    for materia in lista_materias:
        if texto.lower() in materia.nombre.lower():
            print(materia.obtener_estado())
            coincidencias += 1
            
    if coincidencias == 0:
        print(f"⚠️  No se encontró ninguna materia que contenga '{texto}'.")


def mostrar_menu_principal() -> str:
    """Muestra el menú principal y obtiene la elección del usuario."""
    print("=" * 50)
    print("    🎓 GESTOR ACADÉMICO INTELIGENTE 🎓")
    print("=" * 50)
    print("Opciones disponibles:")
    print("  1. Agregar una nueva materia")
    print("  2. Gestionar una materia existente")
    print("  3. Ver resumen final de todas las materias")
    print("  4. Eliminar una materia")
    print("  5. Exportar boletín a TXT")
    print("  6. Buscar materia específica")
    print("  7. Salir")
    print("-" * 50)
    return input("Elige una opción (1-7): ").strip()


def principal() -> None:
    """Función principal que ejecuta el flujo interactivo del programa."""
    print("\nIniciando el sistema...")
    semestre = cargar_datos()

    if semestre:
        print(f"✅ ¡Bienvenido de nuevo! Se han cargado {len(semestre)} materias del historial.\n")
    else:
        print("✅ ¡Bienvenido! Estás comenzando un nuevo semestre.\n")

    while True:
        opcion = mostrar_menu_principal()

        if opcion == "1":
            nombre_input = input("\nIngresa el nombre de la nueva materia: ").strip()
            if not nombre_input:
                print("⚠️  El nombre de la materia no puede estar vacío.\n")
                input("\nPresiona Enter para continuar...")
                continue

            materia_existente = next((m for m in semestre if m.nombre.lower() == nombre_input.lower()), None)
            if materia_existente:
                print(f"⚠️  La materia '{nombre_input}' ya existe. Usa la opción 2 para gestionarla.\n")
            else:
                nueva_materia = Materia(nombre_input)
                semestre.append(nueva_materia)
                guardar_datos(semestre)
                print(f"✅ ¡'{nueva_materia.nombre}' se ha agregado con éxito a tu semestre!\n")
                solicitar_evaluaciones(nueva_materia, semestre)
            input("\nPresiona Enter para continuar al menú...")

        elif opcion == "2":
            if not semestre:
                print("\n⚠️  No tienes materias registradas actualmente. Agrega una primero.\n")
                input("\nPresiona Enter para continuar...")
                continue

            print("\n📚 Tus materias actuales:")
            for idx, materia in enumerate(semestre, start=1):
                print(f"  {idx}. {materia.nombre}")

            seleccion = input("\nIngresa el número de la materia que deseas gestionar (o '0' para cancelar): ").strip()
            try:
                seleccion_idx = int(seleccion) - 1
                if seleccion_idx == -1:
                    print("Cancelando...\n")
                elif 0 <= seleccion_idx < len(semestre):
                    materia_seleccionada = semestre[seleccion_idx]
                    solicitar_evaluaciones(materia_seleccionada, semestre)
                else:
                    print("\n⚠️  Número de materia no válido.\n")
            except ValueError:
                print("\n⚠️  Por favor, ingresa un número válido.\n")
            input("\nPresiona Enter para continuar al menú...")

        elif opcion == "3":
            if not semestre:
                print("\n⚠️  No hay materias para mostrar.\n")
            else:
                print("\n" + "=" * 50)
                print("        📊 RESUMEN FINAL DE TU SEMESTRE 📊")
                print("=" * 50)
                promedio_actual = calcular_promedio_general(semestre)
                print(f" 🏆 PROMEDIO GENERAL ACTUAL: {promedio_actual} puntos 🏆")
                for materia in semestre:
                    print(materia.obtener_estado())
            input("\nPresiona Enter para continuar al menú...")

        elif opcion == "4":
            if not semestre:
                print("\n⚠️  No tienes materias registradas para eliminar.\n")
            else:
                print("\n🗑️  Eliminar Materia")
                nombre_borrar = input("Ingresa el nombre exacto de la materia a eliminar: ").strip()
                exito = eliminar_materia(semestre, nombre_borrar)
                if exito:
                    guardar_datos(semestre)
                    print(f"\n✅  La materia '{nombre_borrar}' fue eliminada permanentemente.")
                else:
                    print(f"\n⚠️  No se encontró ninguna materia llamada '{nombre_borrar}'.")
            input("\nPresiona Enter para continuar al menú...")

        elif opcion == "5":
            print("\nGenerando documento oficial...")
            exportar_boletin(semestre)
            input("\nPresiona Enter para continuar al menú...")

        elif opcion == "6":
            if not semestre:
                print("\n⚠️  No tienes materias registradas para buscar.\n")
            else:
                texto_busqueda = input("\nIngresa una parte del nombre de la materia: ").strip()
                buscar_materias(semestre, texto_busqueda)
            input("\nPresiona Enter para continuar al menú...")

        elif opcion == "7":
            print("\n¡Gracias por usar el Gestor Académico Inteligente! 🎓\n")
            break

        else:
            print("\n⚠️  Opción no válida. Por favor, selecciona una opción del 1 al 7.\n")
            input("\nPresiona Enter para continuar...")


if __name__ == "__main__":
    try:
        principal()
    except KeyboardInterrupt:
        print("\n\nSaliendo del programa de forma segura... 👋\n")
