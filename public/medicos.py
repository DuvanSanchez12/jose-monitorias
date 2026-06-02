import pandas as pd
import numpy as np

# Dataset con datos médicos confidenciales de pacientes
pacientes = pd.DataFrame({
    "id_paciente":   ["PAC-9081",     "PAC-3241",      "PAC-5521"],
    "nombre_completo":["Carlos Mendoza", "Elena Rostova",  "Diego Delgado"],
    "presion_arterial":[142,           118,            135],
    "glucosa_mg_dL":  [105,           88,             160],
    "diagnostico":    ["Hipertensión", "Controlado",   "Diabetes Type 2"],
})

print("🏥 DATOS MÉDICOS ORIGINALES (CONFIDENCIALES):")
print(pacientes)

# 1. Supresión: eliminar columnas con datos que identifican directamente al paciente
# Borramos el ID del hospital y su nombre real.
pacientes_anon = pacientes.drop(columns=["id_paciente", "nombre_completo"])

# 2. Generalización: presión arterial exacta → categoría clínica
# En lugar de dar el número exacto, lo agrupamos según rangos médicos tradicionales.
def clasificar_presion(presion):
    if presion < 120:   return "Normal"
    elif presion < 140: return "Prehipertensión"
    else:               return "Hipertensión"

pacientes_anon["presion_arterial"] = pacientes_anon["presion_arterial"].apply(clasificar_presion)

# 3. Perturbación: añadir ruido gaussiano al nivel de glucosa (±10%)
# Los investigadores no necesitan saber si tenía 160 o 158 de glucosa exacta para notar la tendencia,
# pero alterar el dato ligeramente protege la identidad del paciente en el laboratorio.
np.random.seed(42)
ruido_glucosa = np.random.normal(0, pacientes_anon["glucosa_mg_dL"] * 0.10)
pacientes_anon["glucosa_mg_dL"] = (pacientes_anon["glucosa_mg_dL"] + ruido_glucosa).round(1)

print("\n🧪 DATOS ANONIMIZADOS (LISTOS PARA INVESTIGACIÓN):")
print(pacientes_anon)