import cv2
import json
import socketio
import os
from ultralytics import YOLO
from dotenv import load_dotenv

# Root dizindeki .env'yi yükle
load_dotenv(dotenv_path="../.env")
API_KEY = os.getenv("AI_MODULE_API_KEY", "fallback-ai-key")

# ZAFİYET GİDERİLDİ: Sadece bağlantı atmak yerine auth token eklendi
sio = socketio.Client()
sio.connect('http://localhost:3000', auth={'token': API_KEY}) 

model = YOLO('yolov8n.pt') 
cap = cv2.VideoCapture("1.webm") # Fiziksel cihazda 0 yapılarak webcame bağlanabilir

print("Yapay Zeka Radarı Başlatıldı.")

while cap.isOpened():
    ret, frame = cap.read()
    if not ret:
        break

    results = model(frame)
    tespitler = []

    for result in results:
        boxes = result.boxes
        for box in boxes:
            class_id = int(box.cls[0])
            class_name = model.names[class_id]
            x1, y1, x2, y2 = box.xyxy[0].tolist()
            x_merkez = int((x1 + x2) / 2)
            y_merkez = int((y1 + y2) / 2)
            
            veri = {"hedef": class_name, "x": x_merkez, "y": y_merkez}
            tespitler.append(veri)

    if len(tespitler) > 0:
        hedef_paketi = json.dumps(tespitler)
        sio.emit('hedef_verisi', hedef_paketi)

    annotated_frame = results[0].plot()
    cv2.imshow("Tilth-Detection Radar", annotated_frame)

    if cv2.waitKey(1) & 0xFF == ord('q'):
        break

cap.release()
sio.disconnect()
cv2.destroyAllWindows()
