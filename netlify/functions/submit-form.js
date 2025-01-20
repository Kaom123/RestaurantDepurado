import { google } from "googleapis";
import SibApiV3Sdk from '@getbrevo/brevo';

export const handler = async (event, context) => {
  // Habilitar CORS
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
  };

  // Manejar la solicitud OPTIONS para CORS
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ message: 'Método no permitido' })
    };
  }

  try {
    const { name, email, phone, date } = JSON.parse(event.body);

    // Validaciones
    if (!name || !email || !phone || !date) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ 
          success: false, 
          message: "Todos los campos son obligatorios" 
        })
      };
    }

    // Google Sheets setup
    const auth = new google.auth.GoogleAuth({
      credentials: JSON.parse(process.env.GOOGLE_CREDENTIALS),
      scopes: ["https://www.googleapis.com/auth/spreadsheets"],
    });

    const sheets = google.sheets({ version: "v4", auth });

    // Agregar datos a Google Sheets
    await sheets.spreadsheets.values.append({
      spreadsheetId: process.env.SPREADSHEET_ID,
      range: "Reservas!A:D",
      valueInputOption: "USER_ENTERED",
      resource: {
        values: [[name, email, phone, date]],
      },
    });

    // Configuración de Brevo
    let apiInstance = new SibApiV3Sdk.TransactionalEmailsApi();
    apiInstance.apiClient.authentications['api-key'].apiKey = process.env.BREVO_API_KEY;

    // Crear y enviar el email
    let sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail();
    sendSmtpEmail.subject = "Confirmación de reserva";
    sendSmtpEmail.htmlContent = `
      <html>
        <body>
          <h1>Hola ${name}</h1>
          <p>Gracias por realizar una reserva. Aquí están los detalles:</p>
          <ul>
            <li>Nombre: ${name}</li>
            <li>Teléfono: ${phone}</li>
            <li>Fecha: ${date}</li>
          </ul>
          <p>¡Nos vemos pronto!</p>
        </body>
      </html>
    `;
    sendSmtpEmail.textContent = `
      Hola ${name},\n\n
      Gracias por realizar una reserva. Aquí están los detalles:\n\n
      Nombre: ${name}\n
      Teléfono: ${phone}\n
      Fecha: ${date}\n\n
      ¡Nos vemos pronto!
    `;
    sendSmtpEmail.sender = { 
      email: process.env.SENDER_EMAIL, 
      name: process.env.SENDER_NAME 
    };
    sendSmtpEmail.to = [{ email: email }];

    await apiInstance.sendTransacEmail(sendSmtpEmail);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ 
        success: true, 
        message: "Datos guardados y correo enviado con éxito" 
      })
    };

  } catch (error) {
    console.error('Error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        success: false, 
        message: "Error al procesar la solicitud" 
      })
    };
  }
};