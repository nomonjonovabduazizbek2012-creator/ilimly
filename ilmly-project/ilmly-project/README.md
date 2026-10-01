# Ilmly — Onlayn kurslar platformasi

To'liq loyiha: **Backend (Python/Flask + SQLite)** va **Frontend (React + Vite)**.
Ro'yxatdan o'tish, login, kurslarni ko'rish/sotib olish, admin panel (kurs qo'shish/tahrirlash/o'chirish).

```
project/
├── backend/     -> Python Flask API (baza shu yerda avtomatik yaratiladi)
└── frontend/    -> React ilova (React Router, Framer Motion animatsiyalar)
```

## 1. Backendni ishga tushirish

```bash
cd backend
python3 -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt
python3 app.py
```

Backend `http://localhost:5000` manzilida ishga tushadi. Birinchi ishga tushganda
`database.db` avtomatik yaratiladi, 6 ta namunaviy kurs va admin hisobi qo'shiladi:

- **Admin login:** `admin@ilmly.uz`
- **Admin parol:** `admin123`

## 2. Frontendni ishga tushirish

Yangi terminal oching:

```bash
cd frontend
npm install
npm run dev
```

Frontend `http://localhost:5173` manzilida ochiladi.

> Backend manzili `frontend/src/api.js` faylida `API_BASE` o'zgaruvchisida
> sozlangan (`http://localhost:5000/api`). Agar backendni boshqa server/portda
> ishga tushirsangiz, shu yerni o'zgartiring.

## 3. Loyihadagi imkoniyatlar

- **Ro'yxatdan o'tish / kirish** — JWT token asosida autentifikatsiya
- **Kurslar ro'yxati** — qidiruv, 3D tilt-hover animatsiyali kartalar
- **Kurs sahifasi** — tavsif, narx, "Sotib olish" tugmasi
- **Mening kurslarim** — foydalanuvchi sotib olgan kurslar ro'yxati
- **Admin panel** (`/admin`) — faqat admin uchun:
  - Statistika (foydalanuvchilar, kurslar, sotib olishlar, daromad)
  - Kurs qo'shish, tahrirlash, o'chirish
- Framer Motion bilan sahifa animatsiyalari va 3D tilt kartalar

## 4. Texnologiyalar

| Qism      | Texnologiya                                   |
|-----------|------------------------------------------------|
| Backend   | Python, Flask, SQLite, PyJWT, Werkzeug         |
| Frontend  | React 18, Vite, React Router, Framer Motion, Axios |

## 5. Ishlab chiqarishga (production) tayyorlash bo'yicha eslatmalar

- `backend/app.py` ichidagi `SECRET_KEY`ni maxfiy va uzunroq qiymatga almashtiring
- Production uchun `debug=True` ni o'chiring va WSGI server (gunicorn) ishlating
- CORS sozlamalarini faqat kerakli domenlarga cheklang
