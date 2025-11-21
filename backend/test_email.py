#!/usr/bin/env python
"""
Test email configuration
Run this to verify SMTP settings are correct
"""

import os
import smtplib
from dotenv import load_dotenv
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

# Load environment variables
load_dotenv()

def test_email_config():
    """Test email configuration"""
    sender_email = os.getenv('SENDER_EMAIL')
    sender_password = os.getenv('SENDER_PASSWORD')
    smtp_server = os.getenv('SMTP_SERVER', 'smtp.gmail.com')
    smtp_port = int(os.getenv('SMTP_PORT', 587))
    
    print("=" * 60)
    print("EMAIL CONFIGURATION TEST")
    print("=" * 60)
    print(f"SMTP Server: {smtp_server}")
    print(f"SMTP Port: {smtp_port}")
    print(f"Sender Email: {sender_email}")
    print(f"Password: {'*' * len(sender_password) if sender_password else 'NOT SET'}")
    print("=" * 60)
    
    # Validate configuration
    if not sender_email:
        print("❌ ERROR: SENDER_EMAIL not configured in .env file")
        return False
    
    if not sender_password:
        print("❌ ERROR: SENDER_PASSWORD not configured in .env file")
        return False
    
    # Test SMTP connection
    try:
        print("\n📡 Connecting to SMTP server...")
        with smtplib.SMTP(smtp_server, smtp_port) as server:
            print("✓ Connected to SMTP server")
            
            print("🔐 Starting TLS...")
            server.starttls()
            print("✓ TLS started")
            
            print(f"🔑 Logging in as {sender_email}...")
            server.login(sender_email, sender_password)
            print("✓ Login successful")
            
            print("\n✅ EMAIL CONFIGURATION IS VALID!")
            print("\nYou can now send emails successfully.")
            return True
            
    except smtplib.SMTPAuthenticationError as e:
        print(f"\n❌ AUTHENTICATION ERROR: {str(e)}")
        print("Possible causes:")
        print("  - Incorrect email address")
        print("  - Incorrect password")
        print("  - Gmail account needs 'Less secure app access' enabled")
        print("  - Gmail 2FA requires App Password instead")
        return False
    except smtplib.SMTPException as e:
        print(f"\n❌ SMTP ERROR: {str(e)}")
        print("Possible causes:")
        print("  - SMTP server is down")
        print("  - Firewall blocking SMTP port")
        print("  - Incorrect SMTP server or port")
        return False
    except Exception as e:
        print(f"\n❌ CONNECTION ERROR: {str(e)}")
        return False

if __name__ == '__main__':
    success = test_email_config()
    exit(0 if success else 1)
