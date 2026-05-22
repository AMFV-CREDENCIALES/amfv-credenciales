const SHEET_NAME = "BPFV_mailmerge";

// ===============================
// CONFIGURACIÓN DE ENVÍO
// ===============================

// true = modo prueba: manda solo 1 correo al correo de prueba.
// false = modo real: manda correos a los participantes de la columna email.
const TEST_MODE = true;

// Correo que recibirá la prueba institucional inicial.
const TEST_EMAIL = "eleazar.co14@gmail.com";

// En modo prueba se manda solo 1 correo.
// En modo real se pueden mandar hasta 50 por ejecución.
const MAX_SEND_PER_RUN = TEST_MODE ? 1 : 50;

// Asunto final del correo.
const EMAIL_SUBJECT = "AMFV | Tu constancia digital está lista";


// ===============================
// FUNCIÓN PRINCIPAL DE ENVÍO
// ===============================

function sendBadgeEmails() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(SHEET_NAME);

  if (!sheet) {
    throw new Error(
      `No se encontró la pestaña "${SHEET_NAME}". Revisa que el nombre de la pestaña sea exactamente "${SHEET_NAME}".`
    );
  }

  const data = sheet.getDataRange().getValues();

  if (data.length < 2) {
    throw new Error("La hoja no tiene datos para enviar.");
  }

  const headers = data[0].map(h => String(h).trim());

  const col = (name) => headers.indexOf(name);

  const iName = col("full_name");
  const iEmail = col("email");
  const iCredentialId = col("credential_id");
  const iCredentialUrl = col("credential_url");
  const iLinkedinAddUrl = col("linkedin_add_url");
  const iLinkedinShareUrl = col("linkedin_share_url");
  const iSent = col("sent");
  const iSentAt = col("sent_at");
  const iMessageId = col("message_id");

  const requiredColumns = {
    full_name: iName,
    email: iEmail,
    credential_id: iCredentialId,
    credential_url: iCredentialUrl,
    sent: iSent,
    sent_at: iSentAt,
    message_id: iMessageId
  };

  const missingColumns = Object.entries(requiredColumns)
    .filter(([_, index]) => index === -1)
    .map(([name]) => name);

  if (missingColumns.length > 0) {
    throw new Error("Faltan columnas requeridas: " + missingColumns.join(", "));
  }

  let sentCount = 0;

  for (let r = 1; r < data.length; r++) {
    if (sentCount >= MAX_SEND_PER_RUN) break;

    const row = data[r];

    const fullName = String(row[iName] || "").trim();
    const email = String(row[iEmail] || "").trim();
    const credentialId = String(row[iCredentialId] || "").trim();
    const credentialUrl = String(row[iCredentialUrl] || "").trim();
    const linkedinAddUrl = iLinkedinAddUrl !== -1 ? String(row[iLinkedinAddUrl] || "").trim() : "";
    const linkedinShareUrl = iLinkedinShareUrl !== -1 ? String(row[iLinkedinShareUrl] || "").trim() : "";
    const sentValue = String(row[iSent] || "").trim();

    // Si la columna sent tiene cualquier valor, no se envía.
    // Ejemplos: YES, HOLD, NO ENVIAR, etc.
    if (sentValue !== "") continue;

    // Si faltan datos clave, se salta la fila.
    if (!fullName || !email || !credentialId || !credentialUrl) continue;

    const recipient = TEST_MODE ? TEST_EMAIL : email;
    const subject = TEST_MODE ? "[PRUEBA] " + EMAIL_SUBJECT : EMAIL_SUBJECT;

    const plainBody = buildPlainBody({
      fullName,
      credentialUrl,
      credentialId
    });

    const htmlBody = buildEmailHtml({
      fullName,
      credentialUrl,
      credentialId,
      linkedinAddUrl,
      linkedinShareUrl
    });

    GmailApp.sendEmail(recipient, subject, plainBody, {
      name: "AMFV",
      htmlBody: htmlBody
    });

    const now = new Date();

    if (TEST_MODE) {
      // En modo prueba NO marcamos sent = YES.
      // Esto permite usar la misma fila después para el envío real.
      sheet.getRange(r + 1, iSentAt + 1).setValue(now);
      sheet.getRange(r + 1, iMessageId + 1).setValue("TEST_SENT_TO_" + TEST_EMAIL);
    } else {
      // En modo real sí marcamos la fila como enviada.
      sheet.getRange(r + 1, iSent + 1).setValue("YES");
      sheet.getRange(r + 1, iSentAt + 1).setValue(now);
      sheet.getRange(r + 1, iMessageId + 1).setValue("SENT");
    }

    sentCount++;
  }

  Logger.log("Correos enviados en esta ejecución: " + sentCount);
  Logger.log("Modo prueba activo: " + TEST_MODE);
  Logger.log("Correo de prueba: " + TEST_EMAIL);
}


// ===============================
// CUERPO EN TEXTO PLANO
// ===============================

function buildPlainBody({ fullName, credentialUrl, credentialId }) {
  return (
    `Hola ${fullName},\n\n` +
    `Gracias por tu participación en el taller “Buenas prácticas de Farmacovigilancia: Inspecciones y auditorías. De la preparación a la ejecución estratégica.”, organizado por la Asociación Mexicana de Farmacovigilancia, A.C.\n\n` +
    `Tu constancia digital ya se encuentra disponible para consulta. En el siguiente enlace podrás visualizarla y acceder a sus elementos de verificación:\n\n` +
    `${credentialUrl}\n\n` +
    `Credential ID: ${credentialId}\n\n` +
    `También encontrarás opciones para agregar o compartir esta constancia en LinkedIn.\n\n` +
    `Atentamente,\n` +
    `Asociación Mexicana de Farmacovigilancia, A.C.`
  );
}


// ===============================
// CUERPO EN HTML
// ===============================

function buildEmailHtml({ fullName, credentialUrl, credentialId, linkedinAddUrl, linkedinShareUrl }) {
  const safeName = escapeHtml(fullName);
  const safeCredentialId = escapeHtml(credentialId);

  let linkedinHtml = "";

  if (linkedinAddUrl || linkedinShareUrl) {
    linkedinHtml = `
      <p style="margin-top:20px;"><strong>Opciones para LinkedIn:</strong></p>
      <ul>
        ${linkedinAddUrl ? `<li><a href="${linkedinAddUrl}">Agregar constancia a LinkedIn</a></li>` : ""}
        ${linkedinShareUrl ? `<li><a href="${linkedinShareUrl}">Compartir constancia en LinkedIn</a></li>` : ""}
      </ul>
    `;
  }

  return `
    <div style="font-family: Arial, sans-serif; color:#222222; line-height:1.5; max-width:680px;">
      <p>Hola ${safeName},</p>

      <p>
        Gracias por tu participación en el taller
        <strong>“Buenas prácticas de Farmacovigilancia: Inspecciones y auditorías. De la preparación a la ejecución estratégica.”</strong>,
        organizado por la <strong>Asociación Mexicana de Farmacovigilancia, A.C.</strong>
      </p>

      <p>
        Tu constancia digital ya se encuentra disponible para consulta. En el siguiente enlace podrás visualizarla y acceder a sus elementos de verificación:
      </p>

      <p style="margin:24px 0;">
        <a href="${credentialUrl}"
           style="background:#1d2a5c; color:#ffffff; padding:12px 18px; border-radius:8px;
                  text-decoration:none; display:inline-block; font-weight:bold;">
          Ver mi constancia digital
        </a>
      </p>

      <p>
        Si el botón no funciona, copia y pega este enlace en tu navegador:
      </p>

      <p>
        <a href="${credentialUrl}" style="color:#1d2a5c; word-break:break-all;">
          ${credentialUrl}
        </a>
      </p>

      <p>
        <strong>Credential ID:</strong> ${safeCredentialId}
      </p>

      ${linkedinHtml}

      <p style="margin-top:24px;">
        Atentamente,<br>
        Asociación Mexicana de Farmacovigilancia, A.C.
      </p>
    </div>
  `;
}


// ===============================
// VALIDACIÓN RÁPIDA DE LA HOJA
// ===============================

function checkSheetSetup() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(SHEET_NAME);

  if (!sheet) {
    throw new Error(`No se encontró la pestaña "${SHEET_NAME}".`);
  }

  const data = sheet.getDataRange().getValues();

  if (data.length < 2) {
    throw new Error("La hoja no tiene filas de datos.");
  }

  const headers = data[0].map(h => String(h).trim());

  const requiredHeaders = [
    "full_name",
    "email",
    "issued_on",
    "credential_id",
    "credential_url",
    "assertion_url",
    "linkedin_add_url",
    "linkedin_share_url",
    "evidence_url",
    "sent",
    "sent_at",
    "message_id"
  ];

  const missingHeaders = requiredHeaders.filter(h => !headers.includes(h));

  if (missingHeaders.length > 0) {
    throw new Error("Faltan columnas en la hoja: " + missingHeaders.join(", "));
  }

  Logger.log("Validación correcta.");
  Logger.log("Pestaña encontrada: " + SHEET_NAME);
  Logger.log("Filas detectadas, incluyendo encabezado: " + data.length);
  Logger.log("Columnas detectadas: " + headers.join(", "));
}


// ===============================
// REVISAR CUOTA DE CORREOS
// ===============================

function checkQuota() {
  const quota = MailApp.getRemainingDailyQuota();
  Logger.log("Cuota restante de correos para hoy: " + quota);
}


// ===============================
// UTILIDAD PARA CARACTERES ESPECIALES
// ===============================

function escapeHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
