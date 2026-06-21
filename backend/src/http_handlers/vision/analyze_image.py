import os
import json
from openai import OpenAI

from src.auth.auth import inject_user, require_role_categories, require_roles
from src.http_handlers.common import bad_request, internal_server_error, ok
from src.models.user import User
from src.utils.enums import Role, RoleCategory
from src.utils.logger import get_logger

logger = get_logger(__name__)

API_KEY = os.environ.get("VISION_API_KEY")

client = OpenAI(
    api_key=API_KEY,
    base_url="https://llm.wavespeed.ai/v1",
    max_retries=3,
)
@inject_user()
@require_role_categories({RoleCategory.USER})
@require_roles({Role.ADMIN, Role.USER})
def handler(event, context, user: User):
    try:
        if not API_KEY:
            logger.error("[VISION_ANALYZE] VISION_API_KEY missing in environment variables.")
            return internal_server_error("Server configuration error (API Key missing).")

        body = json.loads(event.get("body") or "{}")
        base64_image = body.get("image")

        if not base64_image:
            return bad_request("Missing 'image' in request body.")

        if not base64_image.startswith("data:image"):
            base64_image = f"data:image/jpeg;base64,{base64_image}"

        prompt = """
                    You are a conservative medical image analysis system.
                    
                    TASK:
                    Analyze the image and detect ONLY symptoms that can be visually observed with reasonable confidence.
                    
                    Allowed symptoms:
                    - Hair_Loss
                    - Dry_Skin
                    - Dry_Lips
                    - Skin_Rash_or_Redness
                    - Oral_Ulcers
                    - Brittle_Nails
                    - Dry_Eyes
                    
                    DO NOT infer, guess, or estimate symptoms that are not directly visible.
                    
                    SCORING RULES:
                    
                    0.3 = Mild visual evidence
                          Small or subtle finding.
                    
                    0.6 = Moderate visual evidence
                          Clearly visible finding affecting a noticeable area.
                    
                    1.0 = Strong visual evidence
                          Obvious finding with high confidence.
                    
                    IMPORTANT:
                    
                    1. If the anatomical region required for a symptom is NOT visible in the image,
                       DO NOT include that symptom.
                    
                    2. If the region is visible but there is NO visible sign of the symptom,
                       DO NOT include that symptom.
                    
                    3. Only return symptoms with score > 0.
                    
                    4. Never infer symptoms from age, sex, ethnicity, lighting, image quality,
                       facial expression, posture, or context.
                    
                    5. Be highly conservative.
                       False positives are worse than false negatives.
                    
                    6. Use only visual evidence present in the image.
                    
                    OUTPUT FORMAT:
                    
                    Return ONLY a valid JSON object.
                    
                    Examples:
                    
                    {}
                    
                    or
                    
                    {
                      "Dry_Lips": 0.6,
                      "Hair_Loss": 0.3
                    }
                    
                    Do not return explanations.
                    Do not return markdown.
                    Do not return text before or after the JSON.
                    """

        response = client.chat.completions.create(
            model="openai/gpt-4o-mini",
            messages=[
                {
                    "role": "user",
                    "content": [
                        {"type": "text", "text": prompt},
                        {
                            "type": "image_url",
                            "image_url": {"url": base64_image}
                        }
                    ]
                }
            ],
            max_tokens=300
        )

        ai_response_text = response.choices[0].message.content.strip()

        if ai_response_text.startswith("```"):
            ai_response_text = ai_response_text.replace("```json", "").replace("```", "").strip()

        extracted_symptoms = json.loads(ai_response_text)

        logger.info("[VISION_ANALYZE] The image was analyzed successfully.")
        return ok(data=extracted_symptoms)

    except json.JSONDecodeError:
        logger.exception("[VISION_ANALYZE] The response from the AI model could not be parsed as valid JSON.")
        return bad_request("The AI response could not be parsed. Please ensure the image is clear and try again.")
    except Exception as e:
        logger.exception(f"[VISION_ANALYZE] Unexpected error {str(e)}")
        return internal_server_error("An unexpected error occurred while analyzing the image. Please try again later.")