import os
import requests
import json
import logging
import numpy as np
from core.config import settings

logger = logging.getLogger(__name__)

class HuggingFaceService:
    def __init__(self):
        self.token = settings.HF_ACCESS_TOKEN
        self.headers = {'Content-Type': 'application/json',"Authorization": f"Bearer {self.token}"}
        self.model_name = settings.HF_MODEL_NAME
        self.embedding_url = settings.HUGGING_FACE_ACCESS_URL

    def get_embedding(self, text: str) -> list:
        
        
        if self.embedding_url:
            try:
                logger.info(f"Calling online Hugging Face embedding API: {self.embedding_url}")

                response = requests.post(
                    self.embedding_url,
                    headers=self.headers,
                    json={"inputs": text},
                    timeout=15
                )
                if response.status_code == 200:
                    try:
                        data = response.json()
                    except json.JSONDecodeError as jde:
                        logger.warning(f"Embedding API response was not valid JSON: {jde}. Raw text: {response.text[:200]}")
                        raise jde

                    vector = self._pool_embedding(data)
                    
                    if len(vector) == settings.EMBEDDING_DIMENSION:
                        logger.info("Successfully fetched embedding from online API with correct dimension.")
                        return vector
                    else:
                        logger.warning(
                            f"Online API returned embedding dimension {len(vector)}, "
                            f"but expected {settings.EMBEDDING_DIMENSION}. Falling back to local model."
                        )
                else:
                    logger.warning(f"HF Embedding API returned status {response.status_code}: {response.text[:200]}")
            except Exception as e:
                logger.warning(f"HF Embedding API failed: {e}. Falling back to local model.")

        # logger.info("Falling back to local sentence-transformers model (CPU)")
        
    def _pool_embedding(self, data) -> list:
        """
        Pools Hugging Face feature extraction output to a 1D vector of floats.
        """
        try:
            arr = np.array(data)
            if arr.ndim == 1:
                return arr.tolist()
            elif arr.ndim == 2:
                return arr.mean(axis=0).tolist()
            elif arr.ndim == 3:
                return arr[0].mean(axis=0).tolist()
            else:
                return arr.flatten()[:settings.EMBEDDING_DIMENSION].tolist()
        except Exception as e:
            logger.warning(f"Failed to pool embedding: {e}")
            if isinstance(data, list):
                if len(data) > 0 and isinstance(data[0], list):
                    if len(data[0]) > 0 and isinstance(data[0][0], list):
                        return data[0][0]
                    return data[0]
                return data
            raise e

    def analyze_resume(self, text: str) -> dict:
        if not self.token:
            logger.warning("No Hugging Face token (HF_ACCESS_TOKEN or HF_TOKEN) provided. Returning fallback mock analysis.")
            return self._fallback_analysis()

        url = "https://router.huggingface.co/v1/chat/completions"
        
        prompt = f"""
            You are a professional resume analyzer. Analyze the following resume text and output a JSON object containing:
            1. "match_score": an integer between 0 and 100 based on standard industry match.
            2. "summary": a brief summary of the candidate's profile (3-4 sentences).
            3. "extracted_skills": a list of skills identified in the resume.
            4. "experience_years": an estimate of years of professional experience.
            5. "recommendations": suggestions for improvement.

            Ensure the output is ONLY valid JSON. Do not include markdown code blocks (like ```json), explanations, or trailing text.

            Resume Text:
            {text[:4000]}
        """
        try:
            logger.info("Calling Hugging Face chat completions API for LLM analysis.")
            payload = {
                "messages": [
                    {
                        "role": "user",
                        "content": prompt
                    }
                ],
                "model": "Qwen/Qwen2.5-7B-Instruct:together"
            }
            headers = {"Authorization": f"Bearer {self.token}"}
            response = requests.post(url, headers=headers, json=payload, timeout=30)
            if response.status_code == 200:
                try:
                    result = response.json()
                except json.JSONDecodeError as jde:
                    logger.warning(f"LLM API response was not valid JSON: {jde}. Raw text: {response.text[:200]}")
                    return self._fallback_analysis(summary=response.text[:500])

                # Extract generated text from chat choices
                generated_text = ""
                if "choices" in result and len(result["choices"]) > 0:
                    generated_text = result["choices"][0].get("message", {}).get("content", "")
                else:
                    generated_text = str(result)
                
                # Parse JSON
                try:
                    cleaned_text = generated_text.strip()
                    if cleaned_text.startswith("```json"):
                        cleaned_text = cleaned_text[7:]
                    if cleaned_text.endswith("```"):
                        cleaned_text = cleaned_text[:-3]
                    cleaned_text = cleaned_text.strip()
                    
                    return json.loads(cleaned_text)
                except json.JSONDecodeError:
                    logger.warning(f"Failed to parse LLM response as JSON. Raw output: {generated_text}")
                    # Attempt to extract JSON from text
                    return self._fallback_analysis(summary=generated_text[:500])
            else:
                logger.warning(f"HF LLM API returned status {response.status_code}: {response.text[:200]}")
        except Exception as e:
            logger.error(f"HF LLM API failed: {e}")

        return self._fallback_analysis()

    def _fallback_analysis(self, summary: str = None) -> dict:
        return {
            "match_score": 60,
            "summary": summary or "Successfully extracted text from resume, but Hugging Face LLM analysis was unavailable or access token was missing.",
            "extracted_skills": ["Information Extraction", "Resume Parsing"],
            "experience_years": 2,
            "recommendations": "Provide a valid HF_ACCESS_TOKEN in the environment to enable full AI model analysis."
        }