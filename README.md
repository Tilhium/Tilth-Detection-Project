# Tilth-Detection System 🚀

Bu proje, savunma sanayisinde ve Endüstri 4.0 mimarilerinde sıkça kullanılan **Uç Bilişim (Edge Computing)** ve **Yapay Zeka (YOLOv8)** tabanlı bir Komuta-Kontrol (C2) sistem simülasyonudur.

Sistem, gerçek dünyadaki bir İnsansız Hava Aracı (İHA) ile Yer Kontrol İstasyonu (GCS) arasındaki haberleşme senaryosunu modelleyerek tasarlanmıştır.

## 🏗️ Mimari Tasarım (Hibrit Edge-Cloud)

Sistem yükü, asimetrik donanım kapasitelerine göre ikiye bölünmüştür:

1. **Uç Cihaz / İHA (TilthOS):** 
   * **Görevi:** Sensör/Donanım telemetrisini toplamak ve merkeze iletmek.
   * **Teknoloji:** Buildroot kullanılarak sıfırdan oluşturulmuş 250 MB'lık ultra-minimal, özel Linux dağıtımı (TilthOS).
   * **İşlem:** C ile yazılmış statik derlenmiş bir daemon, Linux çekirdeğinden (`/proc/loadavg`) donanım yükünü okur, **AES-256-CBC ile askeri standartta şifreler** ve TCP (Port 4000) üzerinden Yer İstasyonuna fırlatır.

2. **Yer Kontrol İstasyonu / Kule (Karargah):**
   * **Görevi:** Ağır yapay zeka analizlerini gerçekleştirmek ve verileri komutana sunmak.
   * **Yapay Zeka Radarı:** Python ve YOLOv8 kullanılarak gelen görüntü işlenir. Hedef tespiti yapılarak yetkilendirilmiş Socket.io (Port 3000) üzerinden sunucuya iletilir.
   * **Veri İstasyonu:** Node.js, eşzamanlı olarak hem TCP hem de WebSocket üzerinden gelen şifreli ve doğrulanmış verileri alır, çözer ve birleştirir.
   * **Komuta Ekranı (C2 Dashboard):** React.js ile tasarlanmış askeri arayüz, yapay zeka tespitlerini ve uç cihazın işlemci durumunu canlı olarak aynı ekranda senkronize eder.

## 🛠️ Kullanılan Teknolojiler
* **Gömülü Sistemler:** Buildroot, QEMU, C, POSIX System Calls
* **Ağ & Güvenlik:** TCP Sockets, WebSocket (Socket.io), **AES-256-CBC Encryption**, Token Auth
* **Yapay Zeka:** Python, OpenCV, Ultralytics YOLOv8
* **Backend & Frontend:** Node.js, Express, React, Vite

## 🚀 Kurulum (Installation)

### 1. Çevre Değişkenleri (Environment Variables)
Proje kök dizinindeki `.env.example` dosyasının adını `.env` olarak değiştirin ve kendi güvenlik anahtarlarınızı belirleyin.

### 2. Komuta Sunucusu (Command Server)
```bash
cd command-server
npm install
```

### 3. Komuta Ekranı (Dashboard UI)
```bash
cd dashboard-ui
npm install
```

### 4. Yapay Zeka Modülü (Vision Module)
YOLOv8 ve OpenCV için Python bağımlılıklarını kurun. (Sanal ortam - virtualenv önerilir)
```bash
cd vision-module
pip install -r requirements.txt
```

### 5. Uç Cihaz (Edge Node - C Daemon)
C kodunu derlemek için sisteminizde `gcc` ve `libssl-dev` (OpenSSL) kurulu olmalıdır.
```bash
cd edge-node
make
```

## 🎮 Çalıştırma (Usage)

Her bir modülü farklı bir terminal penceresinde eşzamanlı olarak çalıştırın:

1. **Sunucuyu Başlatın:**
   ```bash
   cd command-server
   npm start
   ```

2. **Arayüzü Başlatın:**
   ```bash
   cd dashboard-ui
   npm run dev
   ```
   (Arayüze `http://localhost:5173` adresinden ulaşabilirsiniz.)

3. **Yapay Zeka Radarını Başlatın:**
   Dizinde bir `1.webm` video dosyası bulundurduğunuzdan emin olun (veya koddaki `0` parametresi ile webcaminizi kullanın).
   ```bash
   cd vision-module
   python vision.py
   ```

4. **Telemetri Cihazını Simüle Edin:**
   ```bash
   cd edge-node
   ./telemetri
   ```
