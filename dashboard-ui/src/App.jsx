import { useEffect, useState } from 'react'
import io from 'socket.io-client'

const socket = io('http://localhost:3000')

function App() {
  const [hedefler, setHedefler] = useState([])
  const [telemetri, setTelemetri] = useState("Bağlantı Bekleniyor...") 

  useEffect(() => {
    socket.on('hedef_verisi', (data) => {
      const parsedData = JSON.parse(data)
      setHedefler(parsedData)
    })

    socket.on('sistem_telemetri', (data) => {
      setTelemetri(data)
    })

    return () => {
      socket.off('hedef_verisi')
      socket.off('sistem_telemetri')
    }
  }, [])

  return (
    <div style={{ 
      backgroundColor: '#0a0a0a', 
      color: '#00ff00', 
      minHeight: '100vh', 
      padding: '40px', 
      fontFamily: 'monospace' 
    }}>
      <h1 style={{ borderBottom: '2px solid #00ff00', paddingBottom: '10px' }}>
        TILTH-DETECTION // KOMUTA KONTROL MERKEZİ
      </h1>
      
      <div style={{ display: 'flex', gap: '30px', marginTop: '30px' }}>
        
        {/* SOL PANEL: YAPAY ZEKA RADAR AKIŞI */}
        <div style={{ flex: '2', border: '1px solid #333', padding: '20px' }}>
          <h2>RADAR AKIŞI</h2>
          
          {hedefler.length === 0 ? (
            <p style={{ color: '#888' }}>Bölge temiz. Yapay zeka modülünden veri bekleniyor...</p>
          ) : (
            <ul style={{ listStyleType: 'none', padding: 0 }}>
              {hedefler.map((hedef, index) => (
                <li key={index} style={{ marginBottom: '10px', fontSize: '1.2rem' }}>
                  <span style={{ color: '#ff3333' }}>[🚨 TESPİT]</span> {hedef.hedef.toUpperCase()} - KOORDİNATLAR: X: {hedef.x}, Y: {hedef.y}
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* SAĞ PANEL: TILTHOS SİSTEM TELEMETRİSİ */}
        <div style={{ flex: '1', border: '1px solid #00ff00', padding: '20px', backgroundColor: '#111', height: 'fit-content' }}>
          <h2 style={{ color: '#00ff00', borderBottom: '1px dashed #333', paddingBottom: '10px', marginTop: 0 }}>
            📡 UÇ CİHAZ TELEMETRİSİ
          </h2>
          
          <div style={{ marginTop: '20px', fontSize: '1.1rem' }}>
            <p style={{ color: '#888', marginBottom: '5px' }}>İŞLEMCİ YÜKÜ (Load Avg):</p>
            <p style={{ color: '#00ff00', fontWeight: 'bold', fontSize: '1.3rem' }}>{telemetri}</p>
            
            <div style={{ marginTop: '30px', paddingTop: '20px', borderTop: '1px dashed #333' }}>
              <p style={{ color: '#888', fontSize: '0.9rem', marginBottom: '5px' }}>AĞ GÜVENLİĞİ:</p>
              <p style={{ color: telemetri === "Bağlantı Bekleniyor..." ? '#ffaa00' : '#00ff00' }}>
                {telemetri === "Bağlantı Bekleniyor..." ? "BEKLENİYOR..." : "🟢 AKTİF (AES-256 ŞİFRELİ)"}
              </p>
            </div>
            
            <div style={{ marginTop: '20px' }}>
              <p style={{ color: '#888', fontSize: '0.9rem', marginBottom: '5px' }}>İŞLETİM SİSTEMİ:</p>
              <p style={{ color: '#00ff00' }}>TilthOS (Buildroot Edge OS)</p>
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}

export default App
