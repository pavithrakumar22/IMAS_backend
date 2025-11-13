import numpy as np
import cv2
import torch
import torch.nn.functional as F
import torchvision.transforms as transforms # type: ignore
import torchxrayvision as xrv # type: ignore
import google.generativeai as genai # type: ignore
from dotenv import load_dotenv # type: ignore
import os
import json

def analyse_image(image_path, weights="resnet50-res512-all", cuda=False, resize=True, min_prob=50.0, top_n=5):
    with open(image_path, "rb") as f:
        image_bytes = f.read()

    image_array = np.frombuffer(image_bytes, dtype=np.uint8)
    opencv_image = cv2.imdecode(image_array, cv2.IMREAD_COLOR)
    img = cv2.cvtColor(opencv_image, cv2.COLOR_BGR2RGB)
    img = xrv.datasets.normalize(img, 255)

    if len(img.shape) > 2:
        img = img[:, :, 0]
    if len(img.shape) < 2:
        return {"Error": "Image dimension lower than 2"}

    img = img[None, :, :]

    print("Image loaded succesfully....")

    transform = transforms.Compose([
        xrv.datasets.XRayCenterCrop(),
        xrv.datasets.XRayResizer(512)
    ]) if resize else transforms.Compose([xrv.datasets.XRayCenterCrop()])

    img = transform(img)
    model = xrv.models.get_model(weights)

    with torch.no_grad():
        img = torch.from_numpy(img).unsqueeze(0)
        if cuda:
            img = img.cuda()
            model = model.cuda()

        preds = model(img).cpu()
        preds_dict = dict(zip(xrv.datasets.default_pathologies, preds[0].detach().numpy()))
        preds_percent = {k: round(float(v) * 100, 2) for k, v in preds_dict.items()}

    filtered = {k: v for k, v in preds_percent.items() if v >= 50.0}
    sorted_preds = dict(sorted(filtered.items(), key=lambda x: x[1], reverse=True))
    top_preds = dict(list(sorted_preds.items())[:top_n])

    if not top_preds:
        top_preds = dict(sorted(preds_percent.items(), key=lambda x: x[1], reverse=True)[:top_n])

    load_dotenv()
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        raise ValueError("❌ Gemini API key not found in .env file.")
    
    print("API Integrated...")

    genai.configure(api_key=api_key)
    model_gemini = genai.GenerativeModel('gemini-2.5-flash')

    findings_paragraph_prompt = f"""
    You are a friendly medical assistant helping to explain AI chest X-ray results in simple, everyday language.

    The model predicted the following possible findings with these probability percentages:
    {top_preds}

    Write a single paragraph describing what the X-ray suggests, as if you are describing the patient's symptoms or condition summary for a doctor to understand. 

    Guidelines:
    - Use natural medical language suitable for a "symptom description" field (e.g., "The patient appears to have mild infection signs in the lungs, possibly indicating pneumonia...").
    - Avoid structured formats, lists, or JSON.
    - Be clear and factual, but not diagnostic.
    - Mention the most likely findings (based on probability) naturally in the sentence.
    - Avoid giving treatment or medical advice.
    - Output plain text only (no markdown or symbols).
    """

    response = model_gemini.generate_content(findings_paragraph_prompt)
    text = response.text.strip()

    if text.startswith("```"):
        text = text.strip("`").strip()
        if text.lower().startswith("json"):
            text = text[4:].strip()

    try:
        detailed_json = json.loads(text)
    except Exception:
        detailed_json = {"output": text}

    print("Response generated succesfully...")

    return detailed_json

# #Testing
# response = analyse_image(".//images//xr-3.jpg")
# print("\nGenerated Response: ")
# print()
# print(response)