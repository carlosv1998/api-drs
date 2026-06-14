import {
  EmailVerificationData,
  NotificationEmailData,
  PasswordResetData,
  WelcomeEmailData,
} from '../dtos/send-email.dto';

const baseStyle = `
  <style>
    body {
      font-family: Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
    }
    .container {
      background-color: #f9f9f9;
      border-radius: 10px;
      padding: 30px;
      margin: 20px 0;
    }
    .button {
      display: inline-block;
      padding: 12px 30px;
      background-color: #007bff;
      color: white !important;
      text-decoration: none;
      border-radius: 5px;
      margin: 20px 0;
    }
    .footer {
      text-align: center;
      color: #666;
      font-size: 12px;
      margin-top: 30px;
    }
    h1 {
      color: #007bff;
    }
  </style>
`;

export function getEmailVerificationTemplate(
  data: EmailVerificationData,
): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      ${baseStyle}
    </head>
    <body>
      <div class="container">
        <h1>Verifica tu correo electrónico</h1>
        <p>Hola ${data.firstName},</p>
        <p>Gracias por registrarte. Para completar tu registro, por favor verifica tu correo electrónico haciendo clic en el siguiente botón:</p>
        <a href="${data.verificationUrl}" class="button">Verificar correo</a>
        <p>Si no solicitaste esta verificación, puedes ignorar este correo.</p>
        <p>Saludos,<br>El equipo</p>
      </div>
      <div class="footer">
        <p>Este es un correo automático, por favor no respondas.</p>
      </div>
    </body>
    </html>
  `;
}

export function getPasswordResetTemplate(data: PasswordResetData): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      ${baseStyle}
    </head>
    <body>
      <div class="container">
        <h1>Recupera tu contraseña</h1>
        <p>Hola ${data.firstName},</p>
        <p>Recibimos una solicitud para restablecer tu contraseña. Haz clic en el siguiente botón para crear una nueva contraseña:</p>
        <a href="${data.resetUrl}" class="button">Restablecer contraseña</a>
        <p>Este enlace expirará en ${data.expiresIn}.</p>
        <p>Si no solicitaste restablecer tu contraseña, puedes ignorar este correo de forma segura.</p>
        <p>Saludos,<br>El equipo</p>
      </div>
      <div class="footer">
        <p>Este es un correo automático, por favor no respondas.</p>
      </div>
    </body>
    </html>
  `;
}

export function getWelcomeEmailTemplate(data: WelcomeEmailData): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      ${baseStyle}
    </head>
    <body>
      <div class="container">
        <h1>¡Bienvenido!</h1>
        <p>Hola ${data.firstName},</p>
        <p>¡Tu cuenta ha sido verificada exitosamente! Estamos emocionados de tenerte con nosotros.</p>
        <p>Ahora puedes iniciar sesión y comenzar a usar nuestra plataforma:</p>
        <a href="${data.loginUrl}" class="button">Iniciar sesión</a>
        <p>Si tienes alguna pregunta, no dudes en contactarnos.</p>
        <p>Saludos,<br>El equipo</p>
      </div>
      <div class="footer">
        <p>Este es un correo automático, por favor no respondas.</p>
      </div>
    </body>
    </html>
  `;
}

export function getNotificationEmailTemplate(
  data: NotificationEmailData,
): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      ${baseStyle}
    </head>
    <body>
      <div class="container">
        <h1>${data.title}</h1>
        <p>${data.message}</p>
        ${
          data.actionUrl && data.actionText
            ? `
          <a href="${data.actionUrl}" class="button">${data.actionText}</a>
        `
            : ''
        }
        <p>Saludos,<br>El equipo</p>
      </div>
      <div class="footer">
        <p>Este es un correo automático, por favor no respondas.</p>
      </div>
    </body>
    </html>
  `;
}
