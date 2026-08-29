import unittest
from gestor import Materia

class TestMateria(unittest.TestCase):
    def test_inicializacion(self):
        materia = Materia("Matemáticas")
        self.assertEqual(materia.nombre, "Matemáticas")
        self.assertEqual(materia.nota_minima, 60.0)
        self.assertEqual(materia.acumulado_notas, 0.0)
        self.assertEqual(materia.puntos_totales_evaluados, 0.0)

    def test_registrar_evaluacion_suma_puntos(self):
        materia = Materia("Física")

        materia.registrar_evaluacion("Parcial 1", 15.0, 20.0)
        self.assertEqual(materia.acumulado_notas, 15.0)
        self.assertEqual(materia.puntos_totales_evaluados, 20.0)

        materia.registrar_evaluacion("Parcial 2", 20.0, 30.0)
        self.assertEqual(materia.acumulado_notas, 35.0)
        self.assertEqual(materia.puntos_totales_evaluados, 50.0)

    def test_obtener_estado_aprobado(self):
        materia = Materia("Programación")
        materia.registrar_evaluacion("Proyecto Final", 65.0, 100.0)

        estado = materia.obtener_estado()
        self.assertIn("Puntos evaluados hasta ahora: 100.0", estado)
        self.assertIn("Puntaje ganado actual: 65.0 pts", estado)
        self.assertIn("¡Felicidades! Ya alcanzaste o superaste los 60 puntos para pasar.", estado)

    def test_obtener_estado_reprobado(self):
        materia = Materia("Historia")
        materia.registrar_evaluacion("Examen Medio", 30.0, 50.0)

        estado = materia.obtener_estado()
        self.assertIn("Puntos evaluados hasta ahora: 50.0", estado)
        self.assertIn("Puntaje ganado actual: 30.0 pts", estado)
        self.assertIn("Te faltan 30.0 puntos para llegar a los 60.0 puntos mínimos.", estado)

if __name__ == '__main__':
    unittest.main()
