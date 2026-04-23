# Cài đặt Docker cho YT-medical (macOS)

## Cách 1: Cài bằng Homebrew

Máy bạn đã có Homebrew. Mở **Terminal** (ngoài Cursor) và chạy:

```bash
brew install --cask docker
```

**Nếu gặp lỗi "directories are not writable"**, sửa quyền Homebrew rồi chạy lại (chỉ cần làm một lần):

```bash
sudo chown -R $(whoami) /opt/homebrew /Users/happylife/Library/Logs/Homebrew
brew install --cask docker
```

Sau khi cài xong:

1. Mở **Docker Desktop** từ Applications (hoặc Spotlight).
2. Chấp nhận điều khoản, đợi Docker khởi động (icon whale trên menu bar sáng lên).
3. Kiểm tra:

```bash
docker --version
docker compose version
```

## Cách 2: Tải Docker Desktop từ trang chủ (không cần Homebrew)

1. Mở: https://docs.docker.com/desktop/setup/install/mac-install/
2. Chọn **Apple chip** (Mac M1/M2/M3).
3. Tải file **Docker.dmg** → mở → kéo **Docker** vào **Applications**.
4. Mở **Docker** trong Applications (hoặc Spotlight gõ "Docker"), chấp nhận điều khoản và đợi Docker khởi động (icon cá voi trên menu bar).
5. Kiểm tra trong terminal: `docker --version` và `docker compose version`.

---

## Chạy app sau khi đã có Docker

Từ thư mục gốc project:

```bash
# Chỉ chạy database (MySQL, Redis, MongoDB)
docker compose up -d mysql redis mongodb

# Hoặc chạy cả backend + frontend bằng Docker
docker compose up -d
```

Backend cần file `backend/.env` với biến kết nối MySQL (ví dụ `DB_HOST=localhost`, `DB_PORT=3306`, `DB_USERNAME=root`, `DB_PASSWORD=secret`, `DB_DATABASE=telemedicine`). Khi chạy backend **trên máy** (không dùng container), dùng `DB_HOST=localhost`. Khi chạy backend **trong Docker**, dùng `DB_HOST=mysql`.
