# 🚀 School Management System - Render Deployment Guide

## Hatua za Ku-deploy kwenye Render.com

### 1. **Kutengeneza Account ya Render**
- Nenda [render.com](https://render.com)
- Tengeneza account kwa kutumia GitHub

### 2. **Ku-upload Code kwenye GitHub**
```bash
# Tengeneza GitHub repository
git init
git add .
git commit -m "Initial commit - School Management System"
git branch -M main
git remote add origin https://github.com/USERNAME/school-management-system.git
git push -u origin main
```

### 3. **Kutengeneza PostgreSQL Database**
1. Kwenye Render dashboard, bofya "New +"
2. Chagua "PostgreSQL"
3. Jaza:
   - **Name**: `school-management-db`
   - **Database**: `school_management_db`
   - **User**: `school_admin`
   - **Region**: `Oregon (US West)`
4. Bofya "Create Database"

### 4. **Ku-deploy Backend API**
1. Bofya "New +" → "Web Service"
2. Connect GitHub repository
3. Jaza:
   - **Name**: `school-management-api`
   - **Environment**: `PHP`
   - **Build Command**: `chmod +x build.sh && ./build.sh`
   - **Start Command**: `php -S 0.0.0.0:$PORT`
   - **Root Directory**: `backend`

4. **Environment Variables**:
   ```
   ENVIRONMENT=production
   DATABASE_HOST=[from database]
   DATABASE_PORT=[from database]
   DATABASE_NAME=[from database]
   DATABASE_USER=[from database]
   DATABASE_PASSWORD=[from database]
   JWT_SECRET=[generate random string]
   ```

### 5. **Ku-deploy Frontend**
1. Bofya "New +" → "Static Site"
2. Connect GitHub repository
3. Jaza:
   - **Name**: `school-management-frontend`
   - **Build Command**: `echo "No build needed"`
   - **Publish Directory**: `frontend`

### 6. **Kuhakikisha Database Imetengenezwa**
1. Kwenye database dashboard, bofya "Connect"
2. Tumia psql au database client
3. Run SQL script:
```sql
-- Copy content from backend/database/init_postgresql.sql
```

## 🔗 URLs Baada ya Deployment

- **Frontend**: `https://school-management-frontend.onrender.com`
- **Backend API**: `https://school-management-api.onrender.com`
- **Database**: Internal connection

## 🔑 Default Login Credentials

- **Admin**: `admin` / `admin123`
- **Teacher**: `teacher` / `teacher123`
- **Accountant**: `accountant` / `account123`
- **Head Teacher**: `headteacher` / `head123`

## 📝 Notes

- Free tier ina limitations (750 hours/month)
- Database ina 1GB storage limit
- Services zinaweza ku-sleep baada ya 15 minutes bila activity
- First request baada ya sleep inaweza kuchukua muda

## 🛠️ Troubleshooting

### Database Connection Issues
```bash
# Check environment variables
echo $DATABASE_HOST
echo $DATABASE_NAME

# Test connection
php -r "
require_once 'config/config.php';
require_once 'config/database.php';
try {
    \$db = Database::getInstance();
    echo 'Database connected successfully!';
} catch (Exception \$e) {
    echo 'Error: ' . \$e->getMessage();
}
"
```

### API Issues
- Check logs kwenye Render dashboard
- Hakikisha CORS headers ziko correct
- Verify environment variables

## 🎉 Success!

Baada ya deployment, system itakuwa available online 24/7!
