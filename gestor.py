# Gestor Académico Inteligente - Sistema Completo

class Materia:
    def __init__(self, nombre_materia):
        self.nombre = nombre_materia
        self.nota_minima = 60.0  
        self.acumulado_notas = 0.0
        self.porcentaje_acumulado = 0.0

    def registrar_evaluacion(self, nombre_evaluacion, puntos_ganados, puntos_totales_prueba):
        self.acumulado_notas = self.acumulado_notas + puntos_ganados
        self.porcentaje_acumulado = self.porcentaje_acumulado + puntos_totales_prueba
        print(f"-> Evaluación registrada: {nombre_evaluacion} | Aporte directo: {puntos_ganados} pts")

    def mostrar_estado_actual(self):
        print("\n=== REPORTE DE PROGRESO:", self.nombre, "===")
        print("Puntos evaluados hasta ahora:", self.porcentaje_acumulado, "de 100 pts posibles")
        print("Puntaje ganado actual:", round(self.acumulado_notas, 2), "pts")
        
        if self.acumulado_notas >= self.nota_minima:
            print("¡Felicidades! Ya alcanzaste o superaste los 60 puntos para pasar.")
        else:
            faltante = self.nota_minima - self.acumulado_notas
            print("Te faltan", round(faltante, 2), "puntos para llegar a los 60 puntos mínimos.")

# --- PROGRAMA INTERACTIVO: EL SEMESTRE ---
print("=== CONFIGURACIÓN DE TU SEMESTRE ===")
semestre = []

while True:
    nombre_input = input("\nIngresa una materia (o escribe 'salir' para terminar): ")
    
    if nombre_input.lower() == "salir":
        break
        
    nueva_materia = Materia(nombre_input)
    
    # Bucle interno: Preguntamos las notas exclusivamente para esta materia
    while True:
        
        # --- MINI-BUCLE DE VALIDACIÓN (NUEVO) ---
        while True:
            continuar = input(f"¿Deseas registrar una nota para {nombre_input}? (si/no): ").lower()
            if continuar == "si" or continuar == "no":
                break # Rompe la trampa si escribes bien
            else:
                print("⚠️ Opción no válida. Por favor, escribe exactamente 'si' o 'no'.")
        # ----------------------------------------
                
        if continuar == "no":
            break
            
        nombre_eval = input("Nombre de la evaluación (ej: Parcial 1): ")
        
        try:
            puntos_totales = float(input("¿Cuántos puntos de la materia valía esta evaluación?: "))
            puntos_ganados = float(input(f"¿Cuántos puntos te ganaste de esos {puntos_totales}?: "))
            
            nueva_materia.registrar_evaluacion(nombre_eval, puntos_ganados, puntos_totales)
        except ValueError:
            print("⚠️ ¡Error! Debes ingresar un número válido, no letras.")
            
    # Guardamos la materia en la lista
    semestre.append(nueva_materia)
    print(f"✅ ¡{nombre_input} agregada con éxito a tu semestre!")

print("\n=== RESUMEN FINAL DE TU SEMESTRE ===")
for materia_guardada in semestre:
    materia_guardada.mostrar_estado_actual()