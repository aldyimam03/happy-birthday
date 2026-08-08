# Birthday Moment

Halaman kejutan ulang tahun personal yang responsif, accessible, dan dapat dijalankan tanpa framework atau layanan eksternal.

## Menjalankan proyek

```bash
npm install
npm start
```

Kemudian buka `http://localhost:7777`.

## Kustomisasi

Ubah teks dan lokasi foto di `customize.json`. Nilai di file tersebut menjadi prioritas utama dan akan menimpa `DEFAULT_CONFIG` di `script/main.js`. Jika sebuah nilai kosong, hilang, atau file JSON gagal dimuat, aplikasi akan memakai nilai default dari JavaScript.

Simpan foto di folder `img`, lalu isi `imagePath` dengan path yang sesuai. Musik dapat diganti melalui `assets/audio/birthday.mp3`.

Jalankan pemeriksaan sintaks sebelum deploy:

```bash
npm run check
```

Proyek ini dapat dipublikasikan langsung melalui GitHub Pages atau static hosting lainnya.
