# OCR App

Aplikasi OCR (Optical Character Recognition) berbasis web yang dibangun dengan Next.js dan Python.

## Fitur

- Upload gambar
- Ekstraksi teks dari gambar menggunakan Tesseract OCR
- Penyimpanan hasil di database MySQL
- Tampilan modern dan responsif
- Pencarian teks hasil ekstraksi

## Prasyarat

1. Node.js (versi 18 atau lebih baru)
2. Python (versi 3.8 atau lebih baru)
3. MySQL Server
4. Tesseract OCR
5. PNPM Package Manager

## Instalasi

1. Clone repository ini:
```bash
git clone https://github.com/GuavaPopper/PBO_OCR_PROJECT.git
cd PBO_OCR_PROJECT
```

2. Install PNPM jika belum ada:
```bash
npm install -g pnpm
```

3. Install dependensi Node.js:
```bash
pnpm install
```


4. Install dependensi Python:
```bash
pip install -r requirements.txt
```

5. Install Tesseract OCR:
- Windows: Download installer dari [GitHub](https://github.com/UB-Mannheim/tesseract/wiki)
- Linux: `sudo apt install tesseract-ocr`
- Mac: `brew install tesseract`

## Konfigurasi

1. Buat file `.env.local` di root project dan isi dengan kredensial database Anda:
```
MYSQL_HOST=<your-database-host>
MYSQL_USER=<your-database-username>
MYSQL_PASSWORD=<your-database-password>
MYSQL_DATABASE=<your-database-name>
```

2. Sesuaikan path Tesseract di `python/ocr.py` jika berbeda dari default

3. Jalankan script setup database:
```bash
python python/check_db.py
```

## Menjalankan Aplikasi

1. Aktifkan virtual environment Python (jika belum):
```bash
# Windows
venv\Scripts\activate
# Linux/Mac
source venv/bin/activate
```

2. Jalankan server development:
```bash
pnpm dev
```

3. Buka browser dan akses `http://localhost:3000`

## Penggunaan

1. Upload gambar melalui halaman utama
2. Tunggu proses ekstraksi selesai
3. Lihat hasil ekstraksi teks
4. Gunakan fitur pencarian untuk menemukan teks spesifik

## Lisensi

[MIT License](LICENSE)

## Kontribusi

Silakan buat issue atau pull request untuk kontribusi.
