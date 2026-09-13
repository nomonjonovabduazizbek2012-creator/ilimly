"""
Ilmly - Backend API
Flask + SQLite + JWT auth
Ro'yxatdan o'tish, login, kurslar CRUD, sotib olish, admin panel uchun API.
"""
import os
import sqlite3
import datetime
import subprocess
from functools import wraps

import jwt
from flask import Flask, request, jsonify, g
from flask_cors import CORS
from werkzeug.security import generate_password_hash, check_password_hash

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DB_PATH = os.path.join(BASE_DIR, "database.db")
SECRET_KEY = os.environ.get("SECRET_KEY", "ilmly-super-secret-key-2026")

app = Flask(__name__)
CORS(app)  # frontend boshqa portda ishlaganda CORS xatosi bermasligi uchun


# ---------------------------------------------------------------------------
# Database helpers
# ---------------------------------------------------------------------------
def get_db():
    if "db" not in g:
        g.db = sqlite3.connect(DB_PATH)
        g.db.row_factory = sqlite3.Row
    return g.db


@app.teardown_appcontext
def close_db(exception=None):
    db = g.pop("db", None)
    if db is not None:
        db.close()


def init_db():
    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()
    cur.execute(
        """
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            email TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            is_admin INTEGER DEFAULT 0,
            avatar TEXT,
            username TEXT UNIQUE,
            age INTEGER,
            gender TEXT,
            phone TEXT,
            xp INTEGER DEFAULT 0,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP
        )
        """
    )
    cur.execute(
        """
        CREATE TABLE IF NOT EXISTS courses (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            description TEXT NOT NULL,
            price REAL NOT NULL,
            image TEXT,
            lessons_count INTEGER DEFAULT 0,
            level TEXT DEFAULT 'Boshlang''ich',
            group_link TEXT,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP
        )
        """
    )
    cur.execute(
        """
        CREATE TABLE IF NOT EXISTS purchases (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            course_id INTEGER NOT NULL,
            purchased_at TEXT DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users (id),
            FOREIGN KEY (course_id) REFERENCES courses (id)
        )
        """
    )
    cur.execute(
        """
        CREATE TABLE IF NOT EXISTS code_snippets (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            title TEXT NOT NULL,
            language TEXT NOT NULL,
            html TEXT,
            css TEXT,
            js TEXT,
            python_code TEXT,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users (id)
        )
        """
    )
    cur.execute(
        """
        CREATE TABLE IF NOT EXISTS certificates (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            course_id INTEGER NOT NULL,
            title TEXT NOT NULL,
            file TEXT,
            issued_at TEXT DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users (id),
            FOREIGN KEY (course_id) REFERENCES courses (id)
        )
        """
    )
    cur.execute(
        """
        CREATE TABLE IF NOT EXISTS lesson_completions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            lesson_id INTEGER NOT NULL,
            completed_at TEXT DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(user_id, lesson_id),
            FOREIGN KEY (user_id) REFERENCES users (id),
            FOREIGN KEY (lesson_id) REFERENCES lessons (id)
        )
        """
    )
    cur.execute(
        """
        CREATE TABLE IF NOT EXISTS comments (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            content TEXT NOT NULL,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users (id)
        )
        """
    )
    cur.execute(
        """
        CREATE TABLE IF NOT EXISTS enrollment_requests (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            course_id INTEGER NOT NULL,
            status TEXT DEFAULT 'pending',
            created_at TEXT DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users (id),
            FOREIGN KEY (course_id) REFERENCES courses (id)
        )
        """
    )
    cur.execute(
        """
        CREATE TABLE IF NOT EXISTS modules (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            course_id INTEGER NOT NULL,
            title TEXT NOT NULL,
            order_index INTEGER DEFAULT 0,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (course_id) REFERENCES courses (id)
        )
        """
    )
    cur.execute(
        """
        CREATE TABLE IF NOT EXISTS lessons (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            module_id INTEGER NOT NULL,
            title TEXT NOT NULL,
            video_url TEXT,
            image TEXT,
            description TEXT,
            content TEXT,
            order_index INTEGER DEFAULT 0,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (module_id) REFERENCES modules (id)
        )
        """
    )

    # Default admin user: admin@ilmly.uz / admin123
    cur.execute("SELECT id FROM users WHERE email = ?", ("admin@ilmly.uz",))
    if not cur.fetchone():
        cur.execute(
            "INSERT INTO users (name, email, password_hash, is_admin) VALUES (?, ?, ?, ?)",
            ("Admin", "admin@ilmly.uz", generate_password_hash("admin123"), 1),
        )

    # Demo courses if table is empty
    cur.execute("SELECT COUNT(*) FROM courses")
    if cur.fetchone()[0] == 0:
        demo_courses = [
            ("Python asoslari", "Nol darajadan boshlab Python dasturlash tilini o'rganing: sintaksis, funksiyalar, OOP.", 149000, "python", 24, "Boshlang'ich"),
            ("React bilan zamonaviy web", "Komponentlar, hook'lar, state boshqaruvi va real loyihalar bilan React'ni chuqur o'rganing.", 199000, "react", 30, "O'rta"),
            ("Backend: Flask va API", "REST API yaratish, ma'lumotlar bazasi, autentifikatsiya va deploy qilishni o'rganing.", 179000, "flask", 20, "O'rta"),
            ("JavaScript chuqur kurs", "ES6+, asinxron dasturlash, DOM va zamonaviy JS ekotizimi.", 129000, "javascript", 26, "Boshlang'ich"),
            ("UI/UX va CSS animatsiyalar", "Chiroyli, jonli interfeyslar yaratish uchun CSS, animatsiya va dizayn asoslari.", 99000, "design", 18, "Boshlang'ich"),
            ("To'liq Full-Stack loyiha", "Frontend + Backend + Baza — boshidan oxirigacha real loyiha qurish.", 249000, "fullstack", 40, "Yuqori"),
        ]
        cur.executemany(
            "INSERT INTO courses (title, description, price, image, lessons_count, level) VALUES (?, ?, ?, ?, ?, ?)",
            demo_courses,
        )

    conn.commit()
    conn.close()


# ---------------------------------------------------------------------------
# Auth helpers
# ---------------------------------------------------------------------------
def create_token(user):
    payload = {
        "user_id": user["id"],
        "is_admin": bool(user["is_admin"]),
        "exp": datetime.datetime.utcnow() + datetime.timedelta(days=7),
    }
    return jwt.encode(payload, SECRET_KEY, algorithm="HS256")


def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        auth_header = request.headers.get("Authorization", "")
        token = auth_header.replace("Bearer ", "") if auth_header else None
        if not token:
            return jsonify({"error": "Token topilmadi, tizimga kiring"}), 401
        try:
            data = jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
        except jwt.ExpiredSignatureError:
            return jsonify({"error": "Sessiya muddati tugagan, qayta kiring"}), 401
        except jwt.InvalidTokenError:
            return jsonify({"error": "Token yaroqsiz"}), 401
        g.current_user_id = data["user_id"]
        g.current_is_admin = data["is_admin"]
        return f(*args, **kwargs)
    return decorated


def admin_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        if not getattr(g, "current_is_admin", False):
            return jsonify({"error": "Ruxsat yo'q: faqat admin uchun"}), 403
        return f(*args, **kwargs)
    return decorated


# ---------------------------------------------------------------------------
# Auth routes
# ---------------------------------------------------------------------------
@app.route("/api/register", methods=["POST"])
def register():
    data = request.get_json(silent=True) or {}
    first_name = (data.get("first_name") or "").strip()
    last_name = (data.get("last_name") or "").strip()
    name = f"{first_name} {last_name}".strip() or (data.get("name") or "").strip()
    email = (data.get("email") or "").strip().lower()
    password = data.get("password") or ""
    confirm_password = data.get("confirm_password")
    username = (data.get("username") or "").strip().lower() or None
    age = data.get("age")
    gender = (data.get("gender") or "").strip() or None
    phone = (data.get("phone") or "").strip() or None
    avatar = data.get("avatar") or None

    if not name or not email or not password:
        return jsonify({"error": "Ism, email va parolni to'ldiring"}), 400
    if len(password) < 6:
        return jsonify({"error": "Parol kamida 6 belgidan iborat bo'lishi kerak"}), 400
    if confirm_password is not None and password != confirm_password:
        return jsonify({"error": "Parollar mos kelmadi"}), 400

    db = get_db()
    existing = db.execute("SELECT id FROM users WHERE email = ?", (email,)).fetchone()
    if existing:
        return jsonify({"error": "Bu email allaqachon ro'yxatdan o'tgan"}), 409

    if username:
        existing_username = db.execute("SELECT id FROM users WHERE username = ?", (username,)).fetchone()
        if existing_username:
            return jsonify({"error": "Bu foydalanuvchi nomi band"}), 409

    try:
        age = int(age) if age not in (None, "") else None
    except (TypeError, ValueError):
        age = None

    cur = db.execute(
        "INSERT INTO users (name, email, password_hash, avatar, username, age, gender, phone) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
        (name, email, generate_password_hash(password), avatar, username, age, gender, phone),
    )
    db.commit()
    user = db.execute("SELECT * FROM users WHERE id = ?", (cur.lastrowid,)).fetchone()
    token = create_token(user)
    return jsonify({
        "token": token,
        "user": {
            "id": user["id"], "name": user["name"], "email": user["email"],
            "is_admin": bool(user["is_admin"]), "avatar": user["avatar"],
            "username": user["username"], "age": user["age"], "gender": user["gender"], "phone": user["phone"],
        },
    }), 201


@app.route("/api/login", methods=["POST"])
def login():
    data = request.get_json(silent=True) or {}
    email = (data.get("email") or "").strip().lower()
    password = data.get("password") or ""

    db = get_db()
    user = db.execute("SELECT * FROM users WHERE email = ?", (email,)).fetchone()
    if not user or not check_password_hash(user["password_hash"], password):
        return jsonify({"error": "Email yoki parol noto'g'ri"}), 401

    token = create_token(user)
    return jsonify({
        "token": token,
        "user": {
            "id": user["id"], "name": user["name"], "email": user["email"],
            "is_admin": bool(user["is_admin"]), "avatar": user["avatar"],
        },
    })


@app.route("/api/me/avatar", methods=["PUT"])
@token_required
def update_my_avatar():
    data = request.get_json(silent=True) or {}
    avatar = data.get("avatar")
    if not avatar:
        return jsonify({"error": "Rasm yuborilmadi"}), 400
    db = get_db()
    db.execute("UPDATE users SET avatar = ? WHERE id = ?", (avatar, g.current_user_id))
    db.commit()
    return jsonify({"message": "Profil rasmi yangilandi", "avatar": avatar})


@app.route("/api/me/change-password", methods=["POST"])
@token_required
def change_password():
    data = request.get_json(silent=True) or {}
    current_password = data.get("current_password") or ""
    new_password = data.get("new_password") or ""

    if len(new_password) < 6:
        return jsonify({"error": "Yangi parol kamida 6 belgidan iborat bo'lishi kerak"}), 400

    db = get_db()
    user = db.execute("SELECT * FROM users WHERE id = ?", (g.current_user_id,)).fetchone()
    if not check_password_hash(user["password_hash"], current_password):
        return jsonify({"error": "Joriy parol noto'g'ri"}), 401

    db.execute(
        "UPDATE users SET password_hash = ? WHERE id = ?",
        (generate_password_hash(new_password), g.current_user_id),
    )
    db.commit()
    return jsonify({"message": "Parol muvaffaqiyatli yangilandi"})


@app.route("/api/me", methods=["GET"])
@token_required
def me():
    db = get_db()
    user = db.execute("SELECT id, name, email, is_admin, avatar, xp FROM users WHERE id = ?", (g.current_user_id,)).fetchone()
    if not user:
        return jsonify({"error": "Foydalanuvchi topilmadi"}), 404
    xp = user["xp"] or 0
    return jsonify({
        "id": user["id"], "name": user["name"], "email": user["email"],
        "is_admin": bool(user["is_admin"]), "avatar": user["avatar"],
        "xp": xp, "level": xp // 100 + 1,
    })


# ---------------------------------------------------------------------------
# Course routes
# ---------------------------------------------------------------------------
def course_to_dict(row, purchased_ids=None):
    d = dict(row)
    if purchased_ids is not None:
        d["purchased"] = row["id"] in purchased_ids
    return d


@app.route("/api/courses", methods=["GET"])
def list_courses():
    db = get_db()
    courses = db.execute("SELECT * FROM courses ORDER BY id DESC").fetchall()

    purchased_ids = set()
    auth_header = request.headers.get("Authorization", "")
    token = auth_header.replace("Bearer ", "") if auth_header else None
    if token:
        try:
            data = jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
            rows = db.execute("SELECT course_id FROM purchases WHERE user_id = ?", (data["user_id"],)).fetchall()
            purchased_ids = {r["course_id"] for r in rows}
        except jwt.InvalidTokenError:
            pass

    return jsonify([course_to_dict(c, purchased_ids) for c in courses])


@app.route("/api/courses/<int:course_id>", methods=["GET"])
def get_course(course_id):
    db = get_db()
    course = db.execute("SELECT * FROM courses WHERE id = ?", (course_id,)).fetchone()
    if not course:
        return jsonify({"error": "Kurs topilmadi"}), 404
    return jsonify(dict(course))


@app.route("/api/courses", methods=["POST"])
@token_required
@admin_required
def add_course():
    data = request.get_json(silent=True) or {}
    title = (data.get("title") or "").strip()
    description = (data.get("description") or "").strip()
    price = data.get("price")
    image = (data.get("image") or "course").strip()
    lessons_count = data.get("lessons_count", 0)
    level = data.get("level", "Boshlang'ich")
    group_link = (data.get("group_link") or "").strip() or None

    if not title or not description or price is None:
        return jsonify({"error": "Nomi, tavsifi va narxini kiriting"}), 400

    db = get_db()
    cur = db.execute(
        "INSERT INTO courses (title, description, price, image, lessons_count, level, group_link) VALUES (?, ?, ?, ?, ?, ?, ?)",
        (title, description, float(price), image, int(lessons_count or 0), level, group_link),
    )
    db.commit()
    course = db.execute("SELECT * FROM courses WHERE id = ?", (cur.lastrowid,)).fetchone()
    return jsonify(dict(course)), 201


@app.route("/api/courses/<int:course_id>", methods=["PUT"])
@token_required
@admin_required
def update_course(course_id):
    db = get_db()
    course = db.execute("SELECT * FROM courses WHERE id = ?", (course_id,)).fetchone()
    if not course:
        return jsonify({"error": "Kurs topilmadi"}), 404

    data = request.get_json(silent=True) or {}
    title = data.get("title", course["title"])
    description = data.get("description", course["description"])
    price = data.get("price", course["price"])
    image = data.get("image", course["image"])
    lessons_count = data.get("lessons_count", course["lessons_count"])
    level = data.get("level", course["level"])
    group_link = data.get("group_link", course["group_link"])

    db.execute(
        "UPDATE courses SET title=?, description=?, price=?, image=?, lessons_count=?, level=?, group_link=? WHERE id=?",
        (title, description, price, image, lessons_count, level, group_link, course_id),
    )
    db.commit()
    updated = db.execute("SELECT * FROM courses WHERE id = ?", (course_id,)).fetchone()
    return jsonify(dict(updated))


@app.route("/api/courses/<int:course_id>", methods=["DELETE"])
@token_required
@admin_required
def delete_course(course_id):
    db = get_db()
    course = db.execute("SELECT * FROM courses WHERE id = ?", (course_id,)).fetchone()
    if not course:
        return jsonify({"error": "Kurs topilmadi"}), 404
    db.execute("DELETE FROM courses WHERE id = ?", (course_id,))
    db.execute("DELETE FROM purchases WHERE course_id = ?", (course_id,))
    db.commit()
    return jsonify({"message": "Kurs o'chirildi"})


# ---------------------------------------------------------------------------
# Module & Lesson routes
# ---------------------------------------------------------------------------
def module_with_lessons(db, module_row):
    lessons = db.execute(
        "SELECT * FROM lessons WHERE module_id = ? ORDER BY order_index, id",
        (module_row["id"],),
    ).fetchall()
    d = dict(module_row)
    d["lessons"] = [dict(l) for l in lessons]
    return d


@app.route("/api/courses/<int:course_id>/modules", methods=["GET"])
def list_modules(course_id):
    db = get_db()
    course = db.execute("SELECT id FROM courses WHERE id = ?", (course_id,)).fetchone()
    if not course:
        return jsonify({"error": "Kurs topilmadi"}), 404
    modules = db.execute(
        "SELECT * FROM modules WHERE course_id = ? ORDER BY order_index, id",
        (course_id,),
    ).fetchall()
    return jsonify([module_with_lessons(db, m) for m in modules])


@app.route("/api/courses/<int:course_id>/modules", methods=["POST"])
@token_required
@admin_required
def add_module(course_id):
    data = request.get_json(silent=True) or {}
    title = (data.get("title") or "").strip()
    if not title:
        return jsonify({"error": "Modul nomini kiriting"}), 400

    db = get_db()
    course = db.execute("SELECT id FROM courses WHERE id = ?", (course_id,)).fetchone()
    if not course:
        return jsonify({"error": "Kurs topilmadi"}), 404

    max_order = db.execute(
        "SELECT COALESCE(MAX(order_index), -1) o FROM modules WHERE course_id = ?", (course_id,)
    ).fetchone()["o"]

    cur = db.execute(
        "INSERT INTO modules (course_id, title, order_index) VALUES (?, ?, ?)",
        (course_id, title, max_order + 1),
    )
    db.commit()
    module = db.execute("SELECT * FROM modules WHERE id = ?", (cur.lastrowid,)).fetchone()
    return jsonify(module_with_lessons(db, module)), 201


@app.route("/api/modules/<int:module_id>", methods=["PUT"])
@token_required
@admin_required
def update_module(module_id):
    db = get_db()
    module = db.execute("SELECT * FROM modules WHERE id = ?", (module_id,)).fetchone()
    if not module:
        return jsonify({"error": "Modul topilmadi"}), 404
    data = request.get_json(silent=True) or {}
    title = (data.get("title") or module["title"]).strip()
    db.execute("UPDATE modules SET title = ? WHERE id = ?", (title, module_id))
    db.commit()
    updated = db.execute("SELECT * FROM modules WHERE id = ?", (module_id,)).fetchone()
    return jsonify(module_with_lessons(db, updated))


@app.route("/api/modules/<int:module_id>", methods=["DELETE"])
@token_required
@admin_required
def delete_module(module_id):
    db = get_db()
    module = db.execute("SELECT * FROM modules WHERE id = ?", (module_id,)).fetchone()
    if not module:
        return jsonify({"error": "Modul topilmadi"}), 404
    db.execute("DELETE FROM lessons WHERE module_id = ?", (module_id,))
    db.execute("DELETE FROM modules WHERE id = ?", (module_id,))
    db.commit()
    return jsonify({"message": "Modul o'chirildi"})


@app.route("/api/modules/<int:module_id>/lessons", methods=["POST"])
@token_required
@admin_required
def add_lesson(module_id):
    db = get_db()
    module = db.execute("SELECT * FROM modules WHERE id = ?", (module_id,)).fetchone()
    if not module:
        return jsonify({"error": "Modul topilmadi"}), 404

    data = request.get_json(silent=True) or {}
    title = (data.get("title") or "").strip()
    video_url = (data.get("video_url") or "").strip() or None
    image = data.get("image") or None
    description = (data.get("description") or "").strip()
    content = (data.get("content") or "").strip() or None

    if not title:
        return jsonify({"error": "Dars nomini kiriting"}), 400
    if not video_url and not image:
        return jsonify({"error": "Video havolasi yoki rasm kiritilishi shart"}), 400

    max_order = db.execute(
        "SELECT COALESCE(MAX(order_index), -1) o FROM lessons WHERE module_id = ?", (module_id,)
    ).fetchone()["o"]

    cur = db.execute(
        "INSERT INTO lessons (module_id, title, video_url, image, description, content, order_index) VALUES (?, ?, ?, ?, ?, ?, ?)",
        (module_id, title, video_url, image, description, content, max_order + 1),
    )
    # kurs darslar sonini avtomatik yangilaymiz
    db.execute(
        """
        UPDATE courses SET lessons_count = (
            SELECT COUNT(*) FROM lessons l
            JOIN modules m ON m.id = l.module_id
            WHERE m.course_id = ?
        ) WHERE id = ?
        """,
        (module["course_id"], module["course_id"]),
    )
    db.commit()
    lesson = db.execute("SELECT * FROM lessons WHERE id = ?", (cur.lastrowid,)).fetchone()
    return jsonify(dict(lesson)), 201


@app.route("/api/lessons/<int:lesson_id>", methods=["PUT"])
@token_required
@admin_required
def update_lesson(lesson_id):
    db = get_db()
    lesson = db.execute("SELECT * FROM lessons WHERE id = ?", (lesson_id,)).fetchone()
    if not lesson:
        return jsonify({"error": "Dars topilmadi"}), 404

    data = request.get_json(silent=True) or {}
    title = data.get("title", lesson["title"])
    video_url = data.get("video_url", lesson["video_url"])
    image = data.get("image", lesson["image"])
    description = data.get("description", lesson["description"])
    content = data.get("content", lesson["content"])

    db.execute(
        "UPDATE lessons SET title=?, video_url=?, image=?, description=?, content=? WHERE id=?",
        (title, video_url, image, description, content, lesson_id),
    )
    db.commit()
    updated = db.execute("SELECT * FROM lessons WHERE id = ?", (lesson_id,)).fetchone()
    return jsonify(dict(updated))


@app.route("/api/lessons/<int:lesson_id>", methods=["DELETE"])
@token_required
@admin_required
def delete_lesson(lesson_id):
    db = get_db()
    lesson = db.execute("SELECT * FROM lessons WHERE id = ?", (lesson_id,)).fetchone()
    if not lesson:
        return jsonify({"error": "Dars topilmadi"}), 404
    module = db.execute("SELECT * FROM modules WHERE id = ?", (lesson["module_id"],)).fetchone()
    db.execute("DELETE FROM lessons WHERE id = ?", (lesson_id,))
    if module:
        db.execute(
            """
            UPDATE courses SET lessons_count = (
                SELECT COUNT(*) FROM lessons l
                JOIN modules m ON m.id = l.module_id
                WHERE m.course_id = ?
            ) WHERE id = ?
            """,
            (module["course_id"], module["course_id"]),
        )
    db.commit()
    return jsonify({"message": "Dars o'chirildi"})


# ---------------------------------------------------------------------------
# Code playground routes
# ---------------------------------------------------------------------------
@app.route("/api/run-python", methods=["POST"])
@token_required
def run_python():
    data = request.get_json(silent=True) or {}
    code = data.get("code") or ""
    if len(code) > 20000:
        return jsonify({"error": "Kod juda uzun"}), 400
    try:
        result = subprocess.run(
            ["python3", "-c", code],
            capture_output=True,
            text=True,
            timeout=5,
        )
        output = result.stdout
        error = result.stderr
    except subprocess.TimeoutExpired:
        output = ""
        error = "Xatolik: kod bajarilishi juda uzoq davom etdi (5 soniyadan oshdi)"
    except Exception as e:
        output = ""
        error = f"Xatolik: {e}"
    return jsonify({"output": output, "error": error})


@app.route("/api/snippets", methods=["GET"])
@token_required
def list_snippets():
    db = get_db()
    rows = db.execute(
        "SELECT * FROM code_snippets WHERE user_id = ? ORDER BY id DESC",
        (g.current_user_id,),
    ).fetchall()
    return jsonify([dict(r) for r in rows])


@app.route("/api/snippets", methods=["POST"])
@token_required
def save_snippet():
    data = request.get_json(silent=True) or {}
    title = (data.get("title") or "").strip() or "Nomsiz kod"
    language = data.get("language") or "python"

    db = get_db()
    cur = db.execute(
        "INSERT INTO code_snippets (user_id, title, language, html, css, js, python_code) VALUES (?, ?, ?, ?, ?, ?, ?)",
        (
            g.current_user_id, title, language,
            data.get("html") or "", data.get("css") or "", data.get("js") or "",
            data.get("python_code") or "",
        ),
    )
    db.commit()
    row = db.execute("SELECT * FROM code_snippets WHERE id = ?", (cur.lastrowid,)).fetchone()
    return jsonify(dict(row)), 201


@app.route("/api/snippets/<int:snippet_id>", methods=["DELETE"])
@token_required
def delete_snippet(snippet_id):
    db = get_db()
    snippet = db.execute("SELECT * FROM code_snippets WHERE id = ?", (snippet_id,)).fetchone()
    if not snippet or snippet["user_id"] != g.current_user_id:
        return jsonify({"error": "Kod topilmadi"}), 404
    db.execute("DELETE FROM code_snippets WHERE id = ?", (snippet_id,))
    db.commit()
    return jsonify({"message": "O'chirildi"})


# ---------------------------------------------------------------------------
# Admin: user management routes
# ---------------------------------------------------------------------------
@app.route("/api/admin/users", methods=["GET"])
@token_required
@admin_required
def list_users():
    db = get_db()
    rows = db.execute(
        "SELECT id, name, email, is_admin, avatar, username, created_at FROM users ORDER BY id DESC"
    ).fetchall()
    return jsonify([dict(r) for r in rows])


@app.route("/api/admin/users/<int:user_id>/toggle-admin", methods=["POST"])
@token_required
@admin_required
def toggle_admin(user_id):
    db = get_db()
    user = db.execute("SELECT * FROM users WHERE id = ?", (user_id,)).fetchone()
    if not user:
        return jsonify({"error": "Foydalanuvchi topilmadi"}), 404
    if user_id == g.current_user_id:
        return jsonify({"error": "O'zingizni admin holatini o'zgartira olmaysiz"}), 400
    new_status = 0 if user["is_admin"] else 1
    db.execute("UPDATE users SET is_admin = ? WHERE id = ?", (new_status, user_id))
    db.commit()
    return jsonify({"message": "Holat yangilandi", "is_admin": bool(new_status)})


@app.route("/api/admin/users/<int:user_id>", methods=["DELETE"])
@token_required
@admin_required
def delete_user(user_id):
    if user_id == g.current_user_id:
        return jsonify({"error": "O'zingizni o'chira olmaysiz"}), 400
    db = get_db()
    user = db.execute("SELECT * FROM users WHERE id = ?", (user_id,)).fetchone()
    if not user:
        return jsonify({"error": "Foydalanuvchi topilmadi"}), 404
    db.execute("DELETE FROM purchases WHERE user_id = ?", (user_id,))
    db.execute("DELETE FROM enrollment_requests WHERE user_id = ?", (user_id,))
    db.execute("DELETE FROM comments WHERE user_id = ?", (user_id,))
    db.execute("DELETE FROM lesson_completions WHERE user_id = ?", (user_id,))
    db.execute("DELETE FROM certificates WHERE user_id = ?", (user_id,))
    db.execute("DELETE FROM users WHERE id = ?", (user_id,))
    db.commit()
    return jsonify({"message": "Foydalanuvchi o'chirildi"})


# ---------------------------------------------------------------------------
# Certificates ("Sertifikatlar") routes
# ---------------------------------------------------------------------------
@app.route("/api/admin/certificates", methods=["POST"])
@token_required
@admin_required
def issue_certificate():
    data = request.get_json(silent=True) or {}
    user_id = data.get("user_id")
    course_id = data.get("course_id")
    title = (data.get("title") or "").strip()
    file = data.get("file") or None

    if not user_id or not course_id or not title:
        return jsonify({"error": "Foydalanuvchi, kurs va sertifikat nomini kiriting"}), 400

    db = get_db()
    cur = db.execute(
        "INSERT INTO certificates (user_id, course_id, title, file) VALUES (?, ?, ?, ?)",
        (user_id, course_id, title, file),
    )
    db.commit()
    row = db.execute(
        """
        SELECT c.id, c.title, c.file, c.issued_at, u.name as user_name, co.title as course_title
        FROM certificates c
        JOIN users u ON u.id = c.user_id
        JOIN courses co ON co.id = c.course_id
        WHERE c.id = ?
        """,
        (cur.lastrowid,),
    ).fetchone()
    return jsonify(dict(row)), 201


@app.route("/api/admin/certificates", methods=["GET"])
@token_required
@admin_required
def list_all_certificates():
    db = get_db()
    rows = db.execute(
        """
        SELECT c.id, c.title, c.issued_at, u.name as user_name, co.title as course_title
        FROM certificates c
        JOIN users u ON u.id = c.user_id
        JOIN courses co ON co.id = c.course_id
        ORDER BY c.id DESC
        """
    ).fetchall()
    return jsonify([dict(r) for r in rows])


@app.route("/api/my-certificates", methods=["GET"])
@token_required
def my_certificates():
    db = get_db()
    rows = db.execute(
        """
        SELECT c.id, c.title, c.file, c.issued_at, co.title as course_title
        FROM certificates c
        JOIN courses co ON co.id = c.course_id
        WHERE c.user_id = ?
        ORDER BY c.id DESC
        """,
        (g.current_user_id,),
    ).fetchall()
    return jsonify([dict(r) for r in rows])


# ---------------------------------------------------------------------------
# Lesson completion & progress routes
# ---------------------------------------------------------------------------
@app.route("/api/lessons/<int:lesson_id>/complete", methods=["POST"])
@token_required
def complete_lesson(lesson_id):
    db = get_db()
    lesson = db.execute("SELECT * FROM lessons WHERE id = ?", (lesson_id,)).fetchone()
    if not lesson:
        return jsonify({"error": "Dars topilmadi"}), 404

    xp_gained = 0
    try:
        db.execute(
            "INSERT INTO lesson_completions (user_id, lesson_id) VALUES (?, ?)",
            (g.current_user_id, lesson_id),
        )
        db.execute("UPDATE users SET xp = xp + 10 WHERE id = ?", (g.current_user_id,))
        db.commit()
        xp_gained = 10
    except Exception:
        pass  # allaqachon tugatilgan, XP qayta berilmaydi

    user = db.execute("SELECT xp FROM users WHERE id = ?", (g.current_user_id,)).fetchone()
    total_xp = user["xp"] if user else 0
    level = total_xp // 100 + 1

    return jsonify({
        "message": "Dars tugatildi deb belgilandi",
        "xp_gained": xp_gained,
        "total_xp": total_xp,
        "level": level,
    })


@app.route("/api/my-total-completed", methods=["GET"])
@token_required
def my_total_completed():
    db = get_db()
    total = db.execute(
        "SELECT COUNT(*) c FROM lesson_completions WHERE user_id = ?", (g.current_user_id,)
    ).fetchone()["c"]
    return jsonify({"total_completed": total})


@app.route("/api/courses/<int:course_id>/progress", methods=["GET"])
@token_required
def course_progress(course_id):
    db = get_db()
    total = db.execute(
        """
        SELECT COUNT(*) c FROM lessons l
        JOIN modules m ON m.id = l.module_id
        WHERE m.course_id = ?
        """,
        (course_id,),
    ).fetchone()["c"]
    completed = db.execute(
        """
        SELECT COUNT(*) c FROM lesson_completions lc
        JOIN lessons l ON l.id = lc.lesson_id
        JOIN modules m ON m.id = l.module_id
        WHERE m.course_id = ? AND lc.user_id = ?
        """,
        (course_id, g.current_user_id),
    ).fetchone()["c"]
    return jsonify({"total": total, "completed": completed})


@app.route("/api/courses/<int:course_id>/completed-lessons", methods=["GET"])
@token_required
def completed_lesson_ids(course_id):
    db = get_db()
    rows = db.execute(
        """
        SELECT l.id FROM lesson_completions lc
        JOIN lessons l ON l.id = lc.lesson_id
        JOIN modules m ON m.id = l.module_id
        WHERE m.course_id = ? AND lc.user_id = ?
        """,
        (course_id, g.current_user_id),
    ).fetchall()
    return jsonify([r["id"] for r in rows])


# ---------------------------------------------------------------------------
# Comments ("Fikrlar") routes
# ---------------------------------------------------------------------------
@app.route("/api/comments", methods=["GET"])
def list_comments():
    db = get_db()
    rows = db.execute(
        """
        SELECT c.id, c.content, c.created_at, u.name as user_name, u.avatar as user_avatar
        FROM comments c
        JOIN users u ON u.id = c.user_id
        ORDER BY c.id DESC
        """
    ).fetchall()
    return jsonify([dict(r) for r in rows])


@app.route("/api/comments", methods=["POST"])
@token_required
def add_comment():
    data = request.get_json(silent=True) or {}
    content = (data.get("content") or "").strip()
    if not content:
        return jsonify({"error": "Fikr matnini kiriting"}), 400

    db = get_db()
    cur = db.execute(
        "INSERT INTO comments (user_id, content) VALUES (?, ?)",
        (g.current_user_id, content),
    )
    db.commit()
    row = db.execute(
        """
        SELECT c.id, c.content, c.created_at, u.name as user_name, u.avatar as user_avatar
        FROM comments c JOIN users u ON u.id = c.user_id
        WHERE c.id = ?
        """,
        (cur.lastrowid,),
    ).fetchone()
    return jsonify(dict(row)), 201


@app.route("/api/comments/<int:comment_id>", methods=["DELETE"])
@token_required
@admin_required
def delete_comment(comment_id):
    db = get_db()
    db.execute("DELETE FROM comments WHERE id = ?", (comment_id,))
    db.commit()
    return jsonify({"message": "Fikr o'chirildi"})


# ---------------------------------------------------------------------------
# Enrollment request ("ariza") routes
# ---------------------------------------------------------------------------
@app.route("/api/courses/<int:course_id>/request-enroll", methods=["POST"])
@token_required
def request_enroll(course_id):
    db = get_db()
    course = db.execute("SELECT * FROM courses WHERE id = ?", (course_id,)).fetchone()
    if not course:
        return jsonify({"error": "Kurs topilmadi"}), 404

    already_owned = db.execute(
        "SELECT id FROM purchases WHERE user_id = ? AND course_id = ?",
        (g.current_user_id, course_id),
    ).fetchone()
    if already_owned:
        return jsonify({"error": "Bu kursga allaqachon yozilgansiz"}), 409

    pending = db.execute(
        "SELECT id FROM enrollment_requests WHERE user_id = ? AND course_id = ? AND status = 'pending'",
        (g.current_user_id, course_id),
    ).fetchone()
    if pending:
        return jsonify({"error": "Arizangiz allaqachon yuborilgan, admin ko'rib chiqmoqda"}), 409

    db.execute(
        "INSERT INTO enrollment_requests (user_id, course_id, status) VALUES (?, ?, 'pending')",
        (g.current_user_id, course_id),
    )
    db.commit()
    return jsonify({"message": "Arizangiz yuborildi, admin tez orada ko'rib chiqadi"}), 201


@app.route("/api/my-request-status/<int:course_id>", methods=["GET"])
@token_required
def my_request_status(course_id):
    db = get_db()
    req = db.execute(
        "SELECT status FROM enrollment_requests WHERE user_id = ? AND course_id = ? ORDER BY id DESC LIMIT 1",
        (g.current_user_id, course_id),
    ).fetchone()
    return jsonify({"status": req["status"] if req else None})


@app.route("/api/admin/requests", methods=["GET"])
@token_required
@admin_required
def list_requests():
    db = get_db()
    rows = db.execute(
        """
        SELECT r.id, r.status, r.created_at,
               u.id as user_id, u.name as user_name, u.email as user_email,
               c.id as course_id, c.title as course_title
        FROM enrollment_requests r
        JOIN users u ON u.id = r.user_id
        JOIN courses c ON c.id = r.course_id
        WHERE r.status = 'pending'
        ORDER BY r.id DESC
        """
    ).fetchall()
    return jsonify([dict(r) for r in rows])


@app.route("/api/admin/requests/<int:request_id>/approve", methods=["POST"])
@token_required
@admin_required
def approve_request(request_id):
    db = get_db()
    req = db.execute("SELECT * FROM enrollment_requests WHERE id = ?", (request_id,)).fetchone()
    if not req:
        return jsonify({"error": "Ariza topilmadi"}), 404

    existing = db.execute(
        "SELECT id FROM purchases WHERE user_id = ? AND course_id = ?",
        (req["user_id"], req["course_id"]),
    ).fetchone()
    if not existing:
        db.execute(
            "INSERT INTO purchases (user_id, course_id) VALUES (?, ?)",
            (req["user_id"], req["course_id"]),
        )
    db.execute("UPDATE enrollment_requests SET status = 'approved' WHERE id = ?", (request_id,))
    db.commit()
    return jsonify({"message": "Ariza qabul qilindi, foydalanuvchi kursga qo'shildi"})


@app.route("/api/admin/requests/<int:request_id>/reject", methods=["POST"])
@token_required
@admin_required
def reject_request(request_id):
    db = get_db()
    req = db.execute("SELECT * FROM enrollment_requests WHERE id = ?", (request_id,)).fetchone()
    if not req:
        return jsonify({"error": "Ariza topilmadi"}), 404
    db.execute("UPDATE enrollment_requests SET status = 'rejected' WHERE id = ?", (request_id,))
    db.commit()
    return jsonify({"message": "Ariza rad etildi"})


# ---------------------------------------------------------------------------
# Purchase routes
# ---------------------------------------------------------------------------
@app.route("/api/courses/<int:course_id>/purchase", methods=["POST"])
@token_required
def purchase_course(course_id):
    db = get_db()
    course = db.execute("SELECT * FROM courses WHERE id = ?", (course_id,)).fetchone()
    if not course:
        return jsonify({"error": "Kurs topilmadi"}), 404

    existing = db.execute(
        "SELECT id FROM purchases WHERE user_id = ? AND course_id = ?",
        (g.current_user_id, course_id),
    ).fetchone()
    if existing:
        return jsonify({"error": "Bu kursni allaqachon sotib olgansiz"}), 409

    db.execute(
        "INSERT INTO purchases (user_id, course_id) VALUES (?, ?)",
        (g.current_user_id, course_id),
    )
    db.commit()
    return jsonify({"message": "Kurs muvaffaqiyatli sotib olindi"}), 201


@app.route("/api/my-courses", methods=["GET"])
@token_required
def my_courses():
    db = get_db()
    rows = db.execute(
        """
        SELECT c.* FROM courses c
        JOIN purchases p ON p.course_id = c.id
        WHERE p.user_id = ?
        ORDER BY p.purchased_at DESC
        """,
        (g.current_user_id,),
    ).fetchall()
    return jsonify([dict(r) for r in rows])


# ---------------------------------------------------------------------------
# Admin stats
# ---------------------------------------------------------------------------
@app.route("/api/admin/dashboard", methods=["GET"])
@token_required
@admin_required
def admin_dashboard():
    db = get_db()

    users_count = db.execute("SELECT COUNT(*) c FROM users").fetchone()["c"]
    courses_count = db.execute("SELECT COUNT(*) c FROM courses").fetchone()["c"]
    lessons_count = db.execute("SELECT COUNT(*) c FROM lessons").fetchone()["c"]
    comments_count = db.execute("SELECT COUNT(*) c FROM comments").fetchone()["c"]

    # so'nggi 7 kunlik ro'yxatdan o'tishlar
    growth = []
    for i in range(6, -1, -1):
        day = (datetime.datetime.utcnow() - datetime.timedelta(days=i)).strftime("%Y-%m-%d")
        count = db.execute(
            "SELECT COUNT(*) c FROM users WHERE date(created_at) = ?", (day,)
        ).fetchone()["c"]
        growth.append({"date": day[5:], "count": count})

    recent_users = db.execute(
        "SELECT id, name, email, is_admin, created_at FROM users ORDER BY id DESC LIMIT 5"
    ).fetchall()

    recent_comments = db.execute(
        """
        SELECT c.id, c.content, c.created_at, u.name as user_name, 'comment' as kind
        FROM comments c JOIN users u ON u.id = c.user_id
        ORDER BY c.id DESC LIMIT 4
        """
    ).fetchall()
    recent_requests = db.execute(
        """
        SELECT r.id, co.title as content, r.created_at, u.name as user_name, 'request' as kind
        FROM enrollment_requests r
        JOIN users u ON u.id = r.user_id
        JOIN courses co ON co.id = r.course_id
        ORDER BY r.id DESC LIMIT 4
        """
    ).fetchall()

    activity = [dict(r) for r in recent_comments] + [dict(r) for r in recent_requests]
    activity.sort(key=lambda a: a["created_at"], reverse=True)
    activity = activity[:6]

    return jsonify({
        "users_count": users_count,
        "courses_count": courses_count,
        "lessons_count": lessons_count,
        "comments_count": comments_count,
        "growth": growth,
        "recent_users": [dict(u) for u in recent_users],
        "recent_activity": activity,
    })


@app.route("/api/admin/stats", methods=["GET"])
@token_required
@admin_required
def admin_stats():
    db = get_db()
    users_count = db.execute("SELECT COUNT(*) c FROM users").fetchone()["c"]
    courses_count = db.execute("SELECT COUNT(*) c FROM courses").fetchone()["c"]
    purchases_count = db.execute("SELECT COUNT(*) c FROM purchases").fetchone()["c"]
    revenue = db.execute(
        "SELECT COALESCE(SUM(c.price), 0) r FROM purchases p JOIN courses c ON c.id = p.course_id"
    ).fetchone()["r"]
    pending_requests = db.execute(
        "SELECT COUNT(*) c FROM enrollment_requests WHERE status = 'pending'"
    ).fetchone()["c"]
    return jsonify({
        "users": users_count,
        "courses": courses_count,
        "purchases": purchases_count,
        "revenue": revenue,
        "pending_requests": pending_requests,
    })


@app.route("/api/health", methods=["GET"])
def health():
    return jsonify({"status": "ok"})


if __name__ == "__main__":
    init_db()
    app.run(debug=True, port=5000)
