#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <unistd.h>
#include <arpa/inet.h>
#include <openssl/evp.h>
#include <openssl/rand.h>
#include <openssl/err.h>

#define SERVER_IP "127.0.0.1"
#define SERVER_PORT 4000
// Gerçek kullanımda bu şifre dinamik olarak alınmalı (örneğin env'den veya güvenli bir vault'tan)
// server.js'deki `crypto.scryptSync('guvenli-telemetri-sifresi', 'tuz-degeri', 32)` çıktısının statik hali
// (Node.js tarafındaki AES anahtarının C tarafındaki karşılığı). 
// Bu örnekte doğrudan 32 byte anahtar kullanıyoruz:
const unsigned char AES_KEY[32] = {
    0x2c, 0x1f, 0x3d, 0x5a, 0x1b, 0x90, 0xae, 0x47, 
    0xb3, 0xfc, 0x82, 0xd1, 0x55, 0xef, 0x66, 0x19, 
    0xc4, 0x21, 0x5a, 0x0f, 0xd0, 0x4a, 0x33, 0xb8, 
    0x8e, 0x65, 0x12, 0xaa, 0x7c, 0xd4, 0x01, 0x9b
};

void handle_errors() {
    ERR_print_errors_fp(stderr);
    abort();
}

int encrypt(unsigned char *plaintext, int plaintext_len, unsigned char *key,
            unsigned char *iv, unsigned char *ciphertext) {
    EVP_CIPHER_CTX *ctx;
    int len;
    int ciphertext_len;

    if(!(ctx = EVP_CIPHER_CTX_new())) handle_errors();
    if(1 != EVP_EncryptInit_ex(ctx, EVP_aes_256_cbc(), NULL, key, iv))
        handle_errors();
    if(1 != EVP_EncryptUpdate(ctx, ciphertext, &len, plaintext, plaintext_len))
        handle_errors();
    ciphertext_len = len;
    if(1 != EVP_EncryptFinal_ex(ctx, ciphertext + len, &len))
        handle_errors();
    ciphertext_len += len;
    EVP_CIPHER_CTX_free(ctx);
    return ciphertext_len;
}

int main() {
    int sock;
    struct sockaddr_in server_addr;
    char loadavg_buffer[128];
    unsigned char iv[16];
    unsigned char ciphertext[256];
    unsigned char packet[512];
    
    printf("[TILTHOS] Edge Telemetry Daemon Starting...\n");

    // Socket oluştur
    sock = socket(AF_INET, SOCK_STREAM, 0);
    if (sock < 0) {
        perror("Socket creation failed");
        return 1;
    }

    server_addr.sin_family = AF_INET;
    server_addr.sin_port = htons(SERVER_PORT);
    inet_pton(AF_INET, SERVER_IP, &server_addr.sin_addr);

    // Sunucuya bağlan
    if (connect(sock, (struct sockaddr *)&server_addr, sizeof(server_addr)) < 0) {
        perror("Connection to C2 Server failed");
        return 1;
    }
    printf("[TILTHOS] Connected to C2 Server (Port 4000).\n");

    while (1) {
        // /proc/loadavg oku
        FILE *fp = fopen("/proc/loadavg", "r");
        if (fp != NULL) {
            fgets(loadavg_buffer, sizeof(loadavg_buffer), fp);
            fclose(fp);
        } else {
            strcpy(loadavg_buffer, "0.00 0.00 0.00 1/100 1234");
        }
        
        // IV üret (16 byte rastgele)
        if (!RAND_bytes(iv, sizeof(iv))) handle_errors();

        // Şifrele
        int ciphertext_len = encrypt((unsigned char *)loadavg_buffer, strlen(loadavg_buffer), (unsigned char *)AES_KEY, iv, ciphertext);

        // Paketi hazırla: [16 byte IV] + [Şifreli Veri]
        memcpy(packet, iv, 16);
        memcpy(packet + 16, ciphertext, ciphertext_len);
        int total_len = 16 + ciphertext_len;

        // Gönder
        if (send(sock, packet, total_len, 0) < 0) {
            perror("Send failed");
            break;
        }

        printf("Sent encrypted telemetry: %s", loadavg_buffer);
        sleep(2); // 2 saniyede bir gönder
    }

    close(sock);
    return 0;
}