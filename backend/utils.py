import qrcode
from io import BytesIO
import base64
import uuid
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from email.mime.image import MIMEImage
from flask import current_app
import os
import logging

logger = logging.getLogger(__name__)

def get_jwt_user_id():
    """
    Get JWT identity and convert to integer
    JWT stores identity as string, so we need to convert back to int
    """
    from flask_jwt_extended import get_jwt_identity
    jwt_id = get_jwt_identity()
    return int(jwt_id) if jwt_id else None

def generate_qr_code(data):
    """Generate QR code and return as base64"""
    qr = qrcode.QRCode(
        version=1,
        error_correction=qrcode.constants.ERROR_CORRECT_L,
        box_size=10,
        border=4,
    )
    qr.add_data(data)
    qr.make(fit=True)
    
    img = qr.make_image(fill_color="black", back_color="white")
    
    # Convert to base64
    buffer = BytesIO()
    img.save(buffer, format='PNG')
    buffer.seek(0)
    img_base64 = base64.b64encode(buffer.getvalue()).decode()
    
    return img_base64, img

def generate_unique_qr_data():
    """Generate unique QR data"""
    return f"BSFAIR-{uuid.uuid4().hex[:12].upper()}"

def send_reservation_email(user_email, user_name, stall_name, qr_data, qr_image):
    """Send reservation confirmation email with QR code"""
    try:
        sender_email = current_app.config.get('SENDER_EMAIL')
        sender_password = current_app.config.get('SENDER_PASSWORD')
        smtp_server = current_app.config.get('SMTP_SERVER', 'smtp.gmail.com')
        smtp_port = current_app.config.get('SMTP_PORT', 587)
        
        # Validate email configuration
        if not sender_email or not sender_password:
            logger.warning(f"Email configuration missing. SENDER_EMAIL: {sender_email}, PASSWORD: {'*' * len(sender_password) if sender_password else 'None'}")
            return False
        
        logger.info(f"Attempting to send reservation email to {user_email}")
        logger.debug(f"SMTP Server: {smtp_server}:{smtp_port}")
        
        # Create message
        message = MIMEMultipart("related")
        message["Subject"] = "Book Stall Reservation Confirmation - Colombo International Bookfair"
        message["From"] = sender_email
        message["To"] = user_email
        
        # Create the HTML part
        html = f"""
        <html>
            <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                    <div style="text-align: center; margin-bottom: 30px;">
                        <h1 style="color: #2c3e50;">📚 Reservation Confirmed</h1>
                        <p style="color: #7f8c8d; font-size: 14px;">Colombo International Bookfair</p>
                    </div>
                    
                    <div style="background-color: #ecf0f1; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
                        <p>Hello {user_name},</p>
                        <p>Thank you for reserving a stall at the Colombo International Bookfair! Your reservation has been confirmed.</p>
                    </div>
                    
                    <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; border-left: 4px solid #3498db; margin-bottom: 20px;">
                        <h3 style="margin-top: 0; color: #2c3e50;">Reservation Details:</h3>
                        <p><strong>Stall Name:</strong> {stall_name}</p>
                        <p><strong>QR Code:</strong> {qr_data}</p>
                        <p style="color: #7f8c8d; font-size: 12px;">Please keep this QR code safe. You will need to present it at the entrance.</p>
                    </div>
                    
                    <div style="text-align: center; margin: 30px 0;">
                        <h3 style="color: #2c3e50;">Your Exhibition Pass</h3>
                        <div style="background: white; padding: 10px; display: inline-block; border-radius: 8px;">
                            <img src="cid:qr_code" alt="QR Code" style="width: 200px; height: 200px;">
                        </div>
                    </div>
                    
                    <div style="background-color: #fff3cd; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
                        <p style="margin: 0; color: #856404;">
                            <strong>⚠️ Important:</strong> Please download this QR code or take a screenshot. You will need it to enter the exhibition.
                        </p>
                    </div>
                    
                    <div style="border-top: 1px solid #ecf0f1; padding-top: 20px; margin-top: 20px;">
                        <p style="color: #7f8c8d; font-size: 12px;">
                            If you have any questions, please contact our support team.<br>
                            <strong>Email:</strong> support@bookfair.lk<br>
                            <strong>Phone:</strong> +94-11-XXXX-XXXX
                        </p>
                    </div>
                </div>
            </body>
        </html>
        """
        
        msg_alternative = MIMEMultipart('alternative')
        message.attach(msg_alternative)
        msg_alternative.attach(MIMEText(html, "html"))
        
        # Attach QR code image
        img_data = BytesIO()
        qr_image.save(img_data, format='PNG')
        img_data.seek(0)
        
        img_mime = MIMEImage(img_data.getvalue())
        img_mime.add_header('Content-ID', '<qr_code>')
        img_mime.add_header('Content-Disposition', 'inline', filename='qr_code.png')
        message.attach(img_mime)
        
        # Send email
        logger.info(f"Connecting to SMTP server {smtp_server}:{smtp_port}")
        with smtplib.SMTP(smtp_server, smtp_port) as server:
            logger.info("Starting TLS...")
            server.starttls()
            logger.info(f"Logging in as {sender_email}")
            server.login(sender_email, sender_password)
            logger.info(f"Sending email to {user_email}")
            server.send_message(message)
            logger.info(f"Email sent successfully to {user_email}")
        
        return True
    except smtplib.SMTPAuthenticationError as e:
        logger.error(f"SMTP Authentication Error: Invalid email or password. Error: {str(e)}")
        return False
    except smtplib.SMTPException as e:
        logger.error(f"SMTP Error: {str(e)}")
        return False
    except Exception as e:
        logger.error(f"Error sending email to {user_email}: {str(e)}", exc_info=True)
        return False

def send_cancellation_email(user_email, user_name, stall_name):
    """Send reservation cancellation email"""
    try:
        sender_email = current_app.config.get('SENDER_EMAIL')
        sender_password = current_app.config.get('SENDER_PASSWORD')
        smtp_server = current_app.config.get('SMTP_SERVER', 'smtp.gmail.com')
        smtp_port = current_app.config.get('SMTP_PORT', 587)
        
        # Validate email configuration
        if not sender_email or not sender_password:
            logger.warning(f"Email configuration missing for cancellation email to {user_email}")
            return False
        
        logger.info(f"Attempting to send cancellation email to {user_email}")
        
        message = MIMEMultipart()
        message["Subject"] = "Reservation Cancelled - Colombo International Bookfair"
        message["From"] = sender_email
        message["To"] = user_email
        
        html = f"""
        <html>
            <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                    <div style="text-align: center; margin-bottom: 30px;">
                        <h1 style="color: #e74c3c;">❌ Reservation Cancelled</h1>
                        <p style="color: #7f8c8d; font-size: 14px;">Colombo International Bookfair</p>
                    </div>
                    
                    <div style="background-color: #fadbd8; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
                        <p>Hello {user_name},</p>
                        <p>Your reservation for stall <strong>{stall_name}</strong> has been cancelled.</p>
                    </div>
                    
                    <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
                        <p>If you wish to reserve another stall or have any questions, please visit our portal or contact our support team.</p>
                    </div>
                    
                    <div style="border-top: 1px solid #ecf0f1; padding-top: 20px; margin-top: 20px;">
                        <p style="color: #7f8c8d; font-size: 12px;">
                            <strong>Email:</strong> support@bookfair.lk<br>
                            <strong>Phone:</strong> +94-11-XXXX-XXXX
                        </p>
                    </div>
                </div>
            </body>
        </html>
        """
        
        message.attach(MIMEText(html, "html"))
        
        logger.info(f"Connecting to SMTP server {smtp_server}:{smtp_port}")
        with smtplib.SMTP(smtp_server, smtp_port) as server:
            logger.info("Starting TLS...")
            server.starttls()
            logger.info(f"Logging in as {sender_email}")
            server.login(sender_email, sender_password)
            logger.info(f"Sending cancellation email to {user_email}")
            server.send_message(message)
            logger.info(f"Cancellation email sent successfully to {user_email}")
        
        return True
    except smtplib.SMTPAuthenticationError as e:
        logger.error(f"SMTP Authentication Error: Invalid email or password. Error: {str(e)}")
        return False
    except smtplib.SMTPException as e:
        logger.error(f"SMTP Error: {str(e)}")
        return False
    except Exception as e:
        logger.error(f"Error sending cancellation email to {user_email}: {str(e)}", exc_info=True)
        return False
