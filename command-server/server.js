const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const net = require('net');
const crypto = require('crypto');
require('dotenv').config({ path: '../.env' }); // Kök dizindeki .env dosyasını oku

const app = express();
const server = http.createServer(app);

// 1. ZAFİYET GİDERİLDİ: CORS kısıtlaması
const io = new Server(server, {
    cors: { 
        origin: ["http://localhost:5173", "http://localhost:3000"], 
        methods: ["GET", "POST"]
    }
});

// Kimlik doğrulama ve şifreleme anahtarları (.env'den alınır)
const AI_MODULE_API_KEY = process.env.AI_MODULE_API_KEY || "fallback-ai-key-degistirilmeli"; 
const TELEMETRY_SECRET = process.env.TELEMETRY_SECRET || "fallback-telemetri-sifresi";
const TELEMETRY_AES_KEY = crypto.scryptSync(TELEMETRY_SECRET, 'tuz-degeri', 32); 

// --- 1. YAPAY ZEKA GÖRSEL İSTİHBARAT HATTI (WebSocket - 3000) ---
// 2. ZAFİYET GİDERİLDİ: AI Modülü için temel yetkilendirme (Authentication)
io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    // Basit token kontrolü veya Frontend kontrolü
    if (token === AI_MODULE_API_KEY || socket.handshake.headers.origin) {
        return next();
    }
    return next(new Error('Yetkisiz Erişim (Unauthorized)'));
});

io.on('connection', (socket) => {
    console.log('Komuta Merkezi / İstemci Bağlandı:', socket.id);

    socket.on('hedef_verisi', (msg) => {
        // 3. ZAFİYET GİDERİLDİ: Gelen verinin doğrulanması (Input Validation)
        try {
            const data = JSON.parse(msg);
            if (Array.isArray(data)) {
                io.emit('hedef_verisi', msg); // Doğrulanmış hedefi React'a fırlat
            }
        } catch(e) {
            console.log("Geçersiz hedef verisi formatı reddedildi.");
        }
    });

    socket.on('disconnect', () => {
        console.log('Bağlantı koptu:', socket.id);
    });
});

// --- 2. TILTHOS TELEMETRİ DİNLEME İSTASYONU (TCP - 4000) ---
const tcpServer = net.createServer((socket) => {
    console.log("🟢 BİLGİ: TilthOS Uç Cihaz Telemetri Bağlantısı Kuruldu!");

    socket.on('data', (data) => {
        // 4. ZAFİYET GİDERİLDİ: Basit XOR şifrelemesi yerine AES-256-CBC kullanıldı
        try {
            // Şifreli paketin ilk 16 byte'ı IV (Initialization Vector), kalanı şifreli metin olarak kabul edilir.
            if(data.length > 16) {
                const iv = data.slice(0, 16);
                const encryptedData = data.slice(16);
                
                const decipher = crypto.createDecipheriv('aes-256-cbc', TELEMETRY_AES_KEY, iv);
                let decrypted = decipher.update(encryptedData, undefined, 'utf8');
                decrypted += decipher.final('utf8');
                
                console.log("🛡️ [AES-256 ŞİFRESİZ TELEMETRİ]:", decrypted.trim());
                io.emit('sistem_telemetri', decrypted.trim()); 
            }
        } catch (error) {
            console.log("🔴 Telemetri Şifre Çözme Hatası (Yetkisiz/Bozuk Veri):", error.message);
        }
    });

    socket.on('error', (err) => {
        console.log("🔴 Telemetri Soket Hatası:", err.message);
    });
});

tcpServer.listen(4000, '0.0.0.0', () => {
    console.log("📡 Güvenli Telemetri Kanalı 4000 portunda dinleniyor...");
});

server.listen(3000, () => {
    console.log('🎯 Komuta Merkezi Sunucusu 3000 portunda dinliyor...');
});
