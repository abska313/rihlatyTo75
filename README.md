# ABSKA — التحوّل الشامل | 214 يومًا (PWA)

نظام شخصي متكامل ومستقل لإحداث تحول جذري خلال 214 يومًا، مصمم كـ Progressive Web App (PWA) باللغة العربية الفصحى وبهوية بصرية سينمائية داكنة (أسود وماروني).

---

## مميزات النظام
- **تخزين محلي 100%:** يعمل عبر `IndexedDB` دون الحاجة إلى خادم خلفي أو واجهات برمجة تطبيقات خارجية.
- **تطبيق تقدمي (PWA):** قابل للتثبيت على هواتف Android وiOS وشاشات سطح المكتب مع تشغيل تام دون إنترنت (Offline-First).
- **حساب زمني دائم:** تثبيت تاريخ البداية وحساب اليوم الحالي من أصل 214 بدقة دون إعادة ضبط عند تحديث المتصفح.
- **أنظمة العودة والمرونة:** وضع اليوم الصعب (Hard Day Mode) ونظام الإنقاذ والتعافي (Rescue System).
- **النسخ الاحتياطي الكامل:** تصدير واستيراد لكافة البيانات بصيغة `JSON` مع التحقق من صحة الهيكل.

---

## طريقة الرفع والتشغيل على GitHub Pages

### الطريقة الأولى: عبر واجهة موقع GitHub مباشرة (الأسهل)
1. أنشئ مستودعًا جديدًا على حسابك باسم `abska-214` واجعله **Public**.
2. اضغط على **Add file** ثم **Upload files**.
3. اسحب وأفلت جميع الملفات والمجلدات بالهيكل التالي:
   - `index.html`
   - `manifest.webmanifest`
   - `service-worker.js`
   - `README.md`
   - مجلد `css/` (يحتوي على `style.css`)
   - مجلد `js/` (يحتوي على `db.js` و `app.js`)
   - مجلد `icons/` (يحتوي على `icon.svg`)
4. اضغط على **Commit changes**.
5. ادخل إلى إعدادات المستودع **Settings** > اختر من القائمة الجانبية **Pages**.
6. أسفل قسم **Build and deployment**:
   - Source: اختر **Deploy from a branch**.
   - Branch: اختر `main` ومجلد `/ (root)`.
7. اضغط **Save**. خلال دقيقة ستحصل على رابط حي ومباشر للموقع عبر بروتوكول HTTPS المشفر.

### الطريقة الثانية: عبر سطر الأوامر (Git CLI)
```bash
git init
git add .
git commit -m "Initial release of ABSKA 214 PWA"
git branch -M main
git remote add origin [https://github.com/USERNAME/abska-214.git](https://github.com/USERNAME/abska-214.git)
git push -u origin main
