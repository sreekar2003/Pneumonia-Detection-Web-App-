from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import os
from keras.preprocessing.image import img_to_array, load_img
from keras.applications.vgg16 import preprocess_input
import tensorflow.keras as keras
import numpy as np

app = FastAPI()

# Path to the model (keeping the correct path as it is)
model_path = '/Users/sunny/Desktop/Project/App/src/model.h5'
model = keras.models.load_model(model_path)

class PredictionRequest(BaseModel):
    name: str

def get_test_img_data(path: str):
    # Update target size to match the model input size (80x80 as per the error message)
    img = load_img(path, target_size=(80, 80))  
    img = img_to_array(img)
    img = np.expand_dims(img, axis=0)  # Add batch dimension
    img = preprocess_input(img)  # Apply any necessary preprocessing (e.g., normalization)
    return img

def get_pneumonia_stage(probability: float) -> str:
    """
    Determine the pneumonia stage based on the predicted probability.
    """
    if 0.5 < probability <= 0.7:
        return "Stage 1 (Mild)"
    elif 0.7 < probability <= 0.85:
        return "Stage 2 (Moderate)"
    elif probability > 0.85:
        return "Stage 3 (Severe)"
    return None

@app.get("/predict")
async def predict(name: str):
    img_path = os.path.join("/Users", "sunny", "Desktop", "Project", "App", "public", "uploads", name)
    
    print(f"Checking image path: {img_path}")  # Log the image path to check
    if not os.path.exists(img_path):
        raise HTTPException(status_code=404, detail="Image file not found")
    
    try:
        img_data = get_test_img_data(img_path)
        prediction = model.predict(img_data)
        probability = prediction[0][0]  # Access the first prediction value
        
        if probability > 0.5:
            result = "PNEUMONIA IS DETECTED."
            stage = get_pneumonia_stage(probability)
        else:
            result = "PNEUMONIA IS NOT DETECTED."
            stage = None
        
        return {"prediction": result, "stage": stage}
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error during prediction process: {e}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000)