# AMFV – Fábrica de constancias digitales BPFV REAL v1

Este paquete contiene los archivos finales para generar y enviar constancias digitales del taller:

**Buenas prácticas de Farmacovigilancia: Inspecciones y auditorías. De la preparación a la ejecución estratégica.**

Ambiente real configurado:

- GitHub Pages: `https://amfv-credenciales.github.io/amfv-credenciales`
- Repositorio esperado: `amfv-credenciales`
- Cuenta de envío esperada: `amfv2005@gmail.com`
- Pestaña esperada en Google Sheets: `BPFV_mailmerge`

## Estructura

```text
assertions/        Salida generada: JSON individual por participante
badges/            BadgeClass Open Badges v2
credentials/       Salida generada: página HTML individual por participante
data/              Templates locales; NO subir datos reales a GitHub
images/            Insignia final y logo AMFV original
scripts/           Python generador y Apps Script de envío
index.html         Página base del sitio
issuer.json        Emisor Open Badges v2
```

## Uso rápido

1. Copiar `data/attendees_TEMPLATE.csv` o `data/attendees_PRUEBA_ELEAZAR.csv`.
2. Renombrar la copia como `data/attendees.csv`.
3. Validar que tenga columnas exactas: `full_name,email,issued_on`.
4. Ejecutar desde la raíz:

```bat
python scripts\generate_assertions.py
```

5. Publicar en GitHub Desktop los cambios públicos:
   - `assertions/`
   - `credentials/`
   - `badges/bpfv.json`
   - `evidence/bpfv.html`
   - `images/bpfv-badge.png`
   - `images/amfv-logo.jpg`
   - `issuer.json`
   - `index.html`

6. No subir a GitHub:
   - `data/attendees.csv`
   - `data/output_mailmerge.csv`

7. Importar `data/output_mailmerge.csv` a Google Sheets.
8. Renombrar la pestaña como `BPFV_mailmerge`.
9. Abrir Apps Script y pegar el contenido de:

```text
scripts/apps_script_envio_constancias.gs
```

10. Ejecutar primero:

```text
checkSheetSetup
checkQuota
sendBadgeEmails
```

El script viene con `TEST_MODE = true`, por lo que el primer correo se enviará a `eleazar.co14@gmail.com`.

Cuando se confirme que todo funciona, cambiar en Apps Script:

```javascript
const TEST_MODE = true;
```

a:

```javascript
const TEST_MODE = false;
```

Luego ejecutar `sendBadgeEmails` para el envío real.
