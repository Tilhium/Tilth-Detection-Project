CC = gcc
CFLAGS = -Wall -O2
LDFLAGS = -lssl -lcrypto

all: telemetri

telemetri: telemetri.c
	$(CC) $(CFLAGS) -o telemetri telemetri.c $(LDFLAGS)

clean:
	rm -f telemetri
