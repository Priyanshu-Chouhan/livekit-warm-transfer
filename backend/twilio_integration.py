"""
Optional Twilio Integration for Real Phone Number Transfers
"""

import os
from twilio.rest import Client
from twilio.twiml import VoiceResponse
from typing import Optional

class TwilioIntegration:
    def __init__(self):
        self.account_sid = os.getenv("TWILIO_ACCOUNT_SID")
        self.auth_token = os.getenv("TWILIO_AUTH_TOKEN")
        self.phone_number = os.getenv("TWILIO_PHONE_NUMBER")
        
        if all([self.account_sid, self.auth_token, self.phone_number]):
            self.client = Client(self.account_sid, self.auth_token)
            self.enabled = True
        else:
            self.client = None
            self.enabled = False
            print("Twilio credentials not found. Phone integration disabled.")

    async def initiate_phone_transfer(self, 
                                    caller_phone: str, 
                                    agent_phone: str, 
                                    call_summary: str) -> Optional[str]:
        """
        Initiate a warm transfer to a real phone number
        
        Args:
            caller_phone: Phone number of the caller
            agent_phone: Phone number of the receiving agent
            call_summary: AI-generated call summary
            
        Returns:
            Call SID if successful, None if failed
        """
        if not self.enabled:
            raise Exception("Twilio integration not enabled")

        try:
            # Create a conference for the warm transfer
            conference_name = f"warm-transfer-{caller_phone}-{agent_phone}"
            
            # Call the receiving agent first
            agent_call = self.client.calls.create(
                to=agent_phone,
                from_=self.phone_number,
                url=f"https://your-webhook-url.com/conference/{conference_name}",
                method='POST'
            )
            
            # Call the original caller
            caller_call = self.client.calls.create(
                to=caller_phone,
                from_=self.phone_number,
                url=f"https://your-webhook-url.com/conference/{conference_name}",
                method='POST'
            )
            
            return {
                "agent_call_sid": agent_call.sid,
                "caller_call_sid": caller_call.sid,
                "conference_name": conference_name
            }
            
        except Exception as e:
            print(f"Twilio transfer failed: {e}")
            return None

    def generate_conference_twiml(self, conference_name: str, call_summary: str) -> str:
        """
        Generate TwiML for conference with call summary announcement
        """
        response = VoiceResponse()
        
        # Play call summary to the receiving agent
        response.say(f"Warm transfer initiated. Call summary: {call_summary}")
        
        # Join the conference
        response.dial().conference(conference_name)
        
        return str(response)

    def generate_caller_twiml(self, conference_name: str) -> str:
        """
        Generate TwiML for caller to join conference
        """
        response = VoiceResponse()
        
        # Brief hold music or message
        response.say("Please hold while we connect you to the next available agent.")
        
        # Join the conference
        response.dial().conference(conference_name)
        
        return str(response)

    async def send_sms_summary(self, agent_phone: str, call_summary: str) -> bool:
        """
        Send call summary via SMS to the receiving agent
        """
        if not self.enabled:
            return False

        try:
            message = self.client.messages.create(
                body=f"Warm Transfer Summary: {call_summary}",
                from_=self.phone_number,
                to=agent_phone
            )
            return True
        except Exception as e:
            print(f"SMS sending failed: {e}")
            return False

# Example usage in FastAPI routes
def add_twilio_routes(app):
    """Add Twilio-specific routes to FastAPI app"""
    
    twilio_integration = TwilioIntegration()
    
    @app.post("/api/twilio/transfer")
    async def twilio_transfer(caller_phone: str, agent_phone: str, call_summary: str):
        """Initiate warm transfer via Twilio"""
        if not twilio_integration.enabled:
            raise HTTPException(status_code=400, detail="Twilio integration not enabled")
        
        result = await twilio_integration.initiate_phone_transfer(
            caller_phone, agent_phone, call_summary
        )
        
        if result:
            return {"status": "success", "transfer_info": result}
        else:
            raise HTTPException(status_code=500, detail="Transfer failed")
    
    @app.post("/api/twilio/conference/{conference_name}")
    async def conference_webhook(conference_name: str, call_summary: str = ""):
        """Webhook for conference TwiML generation"""
        twiml = twilio_integration.generate_conference_twiml(conference_name, call_summary)
        return Response(content=twiml, media_type="application/xml")
    
    @app.post("/api/twilio/sms-summary")
    async def send_sms_summary(agent_phone: str, call_summary: str):
        """Send call summary via SMS"""
        success = await twilio_integration.send_sms_summary(agent_phone, call_summary)
        return {"status": "success" if success else "failed"}