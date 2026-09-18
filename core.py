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
        self.evaluaciones = []

    def registrar_evaluacion(
        self,
        nombre_evaluacion: str,
        puntos_ganados: float,
        puntos_totales_prueba: float
    ) -> None:
        """Registra una nueva evaluación y suma los puntos."""
        self.acumulado_notas += puntos_ganados
        self.puntos_totales_evaluados += puntos_totales_prueba
        self.evaluaciones.append({
            "nombre": nombre_evaluacion,
            "puntos_ganados": puntos_ganados,
            "puntos_totales_prueba": puntos_totales_prueba
        })

    def editar_evaluacion(
        self,
        nombre_evaluacion: str,
        nuevos_puntos_ganados: float
    ) -> bool:
        """Edita una evaluación existente y recalcula los acumulados."""
        for eval_data in self.evaluaciones:
            if eval_data["nombre"].lower() == nombre_evaluacion.lower():
                self.acumulado_notas -= eval_data["puntos_ganados"]
                self.acumulado_notas += nuevos_puntos_ganados
                eval_data["puntos_ganados"] = nuevos_puntos_ganados
                return True
        return False

    def eliminar_evaluacion(self, nombre_evaluacion: str) -> bool:
        """Elimina una evaluación y recalcula los acumulados."""
        for eval_data in self.evaluaciones:
            if eval_data["nombre"].lower() == nombre_evaluacion.lower():
                self.acumulado_notas -= eval_data["puntos_ganados"]
                self.puntos_totales_evaluados -= eval_data[
                    "puntos_totales_prueba"
                ]
                self.evaluaciones.remove(eval_data)
                return True
        return False

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
            "puntos_totales_evaluados": self.puntos_totales_evaluados,
            "evaluaciones": self.evaluaciones
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
            materia.evaluaciones = data.get("evaluaciones", [])
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


def buscar_materias(
    lista_materias: List[Materia], texto: str
) -> List[Materia]:
    """Busca y retorna materias que coincidan parcialmente con el texto."""
    return [m for m in lista_materias if texto.lower() in m.nombre.lower()]


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
