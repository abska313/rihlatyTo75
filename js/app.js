/**
 * ABSKA 214 - المنطق التنفيذي الرئيسي
 * يشمل: حساب الأيام، شجرة الشخصية، نظام المهام المتدرج، التحليلات، والتفاعل.
 */

document.addEventListener('DOMContentLoaded', async () => {
  // تهيئة التطبيق
  await App.init();
});

const App = {
  profile: null,
  currentDay: 1,
  totalDays: 214,
  isHardDayMode: false,

  async init() {
    // 1. فحص وجود بيانات الملف الشخصي
    const profileData = await ABSKA_DB.get('profile', 'user_config');
    if (!profileData || !profileData.startDate) {
      this.showView('onboarding');
      this.bindOnboarding();
      return;
    }

    this.profile = profileData;
    this.calculateJourneyDay();
    this.bindEvents();
    this.renderHeader();
    this.renderDashboard();
    this.checkSmartAdaptation();
    this.registerServiceWorker();
  },

  // حساب اليوم الحالي بدقة تامة ومنع تصفيره
  calculateJourneyDay() {
    const start = new Date(this.profile.startDate);
    const now = new Date();
    // ضبط الوقت لبداية اليوم لمقارنة التواريخ دون تأثير الساعات
    start.setHours(0, 0, 0, 0);
    now.setHours(0, 0, 0, 0);

    const diffTime = now.getTime() - start.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1;

    // اليوم محصور بين 1 و 214
    this.currentDay = Math.max(1, Math.min(diffDays, 214));
  },

  // معالجة واجهة الإعداد الأولي
  bindOnboarding() {
    const form = document.getElementById('onboarding-form');
    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      const name = document.getElementById('ob-name').value.trim();
      const age = document.getElementById('ob-age').value;
      const height = document.getElementById('ob-height').value;
      const weight = document.getElementById('ob-weight').value;
      const difficulty = document.getElementById('ob-difficulty').value;
      const focus = document.getElementById('ob-focus').value.trim();
      const letter = document.getElementById('ob-letter').value.trim();

      const newProfile = {
        key: 'user_config',
        name: name || 'عباس',
        age: age || null,
        height: height || null,
        weight: weight || null,
        difficulty: difficulty || 'medium',
        focus: focus || '',
        letterDay1: letter || '',
        startDate: new Date().toISOString(),
        xp: 0,
        level: 1,
        streak: 1,
        lastActiveDate: new Date().toISOString()
      };

      await ABSKA_DB.set('profile', newProfile);

      // توليد حزمة مهام ابتدائية واقعية للأسبوع الأول
      await this.seedInitialTasks();

      this.profile = newProfile;
      this.calculateJourneyDay();
      this.showToast('تم تثبيت اليوم الأول! بدأت رحلتك نحو التحوّل.');
      this.showView('dashboard');
      this.bindEvents();
      this.renderHeader();
      this.renderDashboard();
    });
  },

  // توليد مهام تأسيسية واقعية
  async seedInitialTasks() {
    const defaultTasks = [
      {
        id: 'task_' + Date.now() + '_1',
        title: 'تحديد موعد نوم واستيقاظ ثابت للأسبوع الحالي',
        desc: 'خطوة التأسيس الأولى: حماية الساعة البيولوجية ومستوى الطاقة.',
        domain: 'discipline',
        difficulty: 1,
        xp: 15,
        completed: false,
        date: new Date().toISOString().split('T')[0]
      },
      {
        id: 'task_' + Date.now() + '_2',
        title: 'حركة خفيفة / مشي 15 دقيقة',
        desc: 'نشاط بدني آمن دون إرهاق لتحفيز الدورة الدموية.',
        domain: 'fitness',
        difficulty: 1,
        xp: 15,
        completed: false,
        date: new Date().toISOString().split('T')[0]
      },
      {
        id: 'task_' + Date.now() + '_3',
        title: 'قراءة 5 صفحات من كتاب معرفي',
        desc: 'التركيز على المعنى بدلاً من السرعة.',
        domain: 'knowledge',
        difficulty: 1,
        xp: 15,
        completed: false,
        date: new Date().toISOString().split('T')[0]
      }
    ];

    for (const t of defaultTasks) {
      await ABSKA_DB.set('tasks', t);
    }
  },

  // ربط أحداث التنقل والعناصر
  bindEvents() {
    // 1. أزرار القائمة السفلية
    document.querySelectorAll('.bottom-nav .nav-item[data-view]').forEach(btn => {
      btn.addEventListener('click', () => {
        const viewId = btn.getAttribute('data-view');
        this.showView(viewId);
        document.querySelectorAll('.bottom-nav .nav-item').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
      });
    });

    // 2. درج الأقسام الإضافية (More)
    const btnMore = document.getElementById('nav-btn-more');
    const modalMore = document.getElementById('modal-more');
    const btnCloseMore = document.getElementById('btn-close-more');

    btnMore.addEventListener('click', () => modalMore.classList.remove('hidden'));
    btnCloseMore.addEventListener('click', () => modalMore.classList.add('hidden'));

    document.querySelectorAll('.drawer-item[data-view]').forEach(item => {
      item.addEventListener('click', () => {
        const viewId = item.getAttribute('data-view');
        modalMore.classList.add('hidden');
        this.showView(viewId);
      });
    });

    // 3. وضع اليوم الصعب
    document.getElementById('hard-mode-toggle').addEventListener('click', () => {
      this.toggleHardDayMode();
    });

    // 4. إجراءات لوحة التحكم
    document.getElementById('btn-quick-energy').addEventListener('click', () => {
      document.getElementById('modal-energy').classList.remove('hidden');
    });
    document.getElementById('btn-close-energy').addEventListener('click', () => {
      document.getElementById('modal-energy').classList.add('hidden');
    });
    document.querySelectorAll('.energy-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        const energy = btn.getAttribute('data-energy');
        await this.logEnergy(energy);
        document.getElementById('modal-energy').classList.add('hidden');
      });
    });

    document.getElementById('btn-quick-rescue').addEventListener('click', () => {
      document.getElementById('modal-rescue').classList.remove('hidden');
    });
    document.getElementById('btn-close-rescue').addEventListener('click', () => {
      document.getElementById('modal-rescue').classList.add('hidden');
    });
    document.getElementById('btn-confirm-rescue').addEventListener('click', async () => {
      await this.executeRescue();
    });

    document.getElementById('btn-goto-tasks').addEventListener('click', () => {
      this.showView('tasks');
    });

    // 5. إدارة المهام
    document.getElementById('btn-open-task-modal').addEventListener('click', () => {
      document.getElementById('form-task').reset();
      document.getElementById('task-id').value = '';
      document.getElementById('modal-task').classList.remove('hidden');
    });
    document.getElementById('btn-close-task-modal').addEventListener('click', () => {
      document.getElementById('modal-task').classList.add('hidden');
    });
    document.getElementById('form-task').addEventListener('submit', async (e) => {
      e.preventDefault();
      await this.saveTask();
    });

    // 6. النسخ الاحتياطي وإعادة الضبط
    document.getElementById('btn-export-backup').addEventListener('click', async () => {
      const data = await ABSKA_DB.exportAll();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `ABSKA_214_BACKUP_${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      this.showToast('تم تصدير النسخة الاحتياطية بنجاح.');
    });

    document.getElementById('import-file-input').addEventListener('change', async (e) => {
      const file = e.target.files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = async (event) => {
        try {
          const parsed = JSON.parse(event.target.result);
          if (confirm('هل أنت متأكد من استعادة هذه النسخة؟ سيتم استبدال البيانات الحالية.')) {
            await ABSKA_DB.importAll(parsed);
            this.showToast('تمت استعادة البيانات بنجاح. جاري التحديث...');
            setTimeout(() => window.location.reload(), 1000);
          }
        } catch (err) {
          alert('فشل استيراد الملف: ' + err.message);
        }
      };
      reader.readAsText(file);
    });

    document.getElementById('btn-reset-db').addEventListener('click', async () => {
      if (confirm('تحذير نهائي: هل تريد حقاً مسح كافة البيانات وإعادة التطبيق للصفر؟')) {
        await ABSKA_DB.resetAll();
        window.location.reload();
      }
    });
  },

  // تحديث شريط الهيدر
  renderHeader() {
    document.getElementById('header-day-badge').textContent = `اليوم ${this.currentDay}`;
    document.getElementById('header-xp-badge').textContent = `${this.profile.xp} XP`;
  },

  // عرض الشاشة المحددة
  showView(viewName) {
    document.querySelectorAll('.view').forEach(v => v.classList.add('hidden'));
    const target = document.getElementById(`view-${viewName}`);
    if (target) {
      target.classList.remove('hidden');
      window.scrollTo(0, 0);

      // تشغيل دوال العرض الخاصة بكل شاشة
      if (viewName === 'dashboard') this.renderDashboard();
      if (viewName === 'tasks') this.renderTasks();
      if (viewName === 'journey') this.renderJourneyMap();
      if (viewName === 'tree') this.renderPersonalityTree();
      if (viewName === 'reports') this.renderReports();
      if (viewName === 'post214') this.renderPost214();
    }
  },

  // لوحة التحكم الرئيسية
  async renderDashboard() {
    document.getElementById('user-greeting').textContent = `مرحباً، ${this.profile.name}`;
    document.getElementById('dashboard-day-num').innerHTML = `اليوم ${this.currentDay} <span class="hero-total">/ ${this.totalDays}</span>`;
    document.getElementById('streak-count').textContent = this.profile.streak || 1;

    // شريط التقدم
    const percent = Math.round((this.currentDay / this.totalDays) * 100);
    document.getElementById('journey-progress-bar').style.width = `${percent}%`;
    document.getElementById('journey-percent').textContent = `${percent}% مكتمل`;
    document.getElementById('days-remaining').textContent = `باقي ${this.totalDays - this.currentDay} يومًا`;

    // اللقب والمستوى
    const titles = ['المبتدئ الواعي', 'المثابر', 'صاحب الإيقاع', 'سيد الاستمرارية', 'المتحول الشامل'];
    const titleIndex = Math.min(Math.floor(this.profile.xp / 250), titles.length - 1);
    document.getElementById('user-title').textContent = titles[titleIndex];
    document.getElementById('user-level').textContent = `المستوى ${Math.floor(this.profile.xp / 100) + 1}`;

    // مهام اليوم في لوحة التحكم
    await this.renderDashboardTasks();
  },

  // عرض مهام اليوم
  async renderDashboardTasks() {
    const container = document.getElementById('dashboard-tasks-list');
    container.innerHTML = '';
    const allTasks = await ABSKA_DB.getAll('tasks');

    if (allTasks.length === 0) {
      container.innerHTML = '<p class="text-muted">لا توجد مهام مسجلة لهذا اليوم. اضغط لإضافة مهمة جديدة.</p>';
      return;
    }

    allTasks.slice(0, 4).forEach(task => {
      const el = document.createElement('div');
      el.className = `task-item ${task.completed ? 'completed' : ''}`;
      el.innerHTML = `
        <div class="task-checkbox-custom" data-id="${task.id}">
          ${task.completed ? '✓' : ''}
        </div>
        <div class="task-details">
          <div class="task-text-title">${task.title}</div>
          <div class="task-meta">
            <span>${this.getDomainName(task.domain)}</span>
            <span class="task-badge-xp">+${task.xp} XP</span>
          </div>
        </div>
      `;
      el.querySelector('.task-checkbox-custom').addEventListener('click', () => {
        this.toggleTaskComplete(task.id);
      });
      container.appendChild(el);
    });
  },

  // إكمال المهمة وإضافة النقاط بأمان (منع التكرار)
  async toggleTaskComplete(taskId) {
    const task = await ABSKA_DB.get('tasks', taskId);
    if (!task) return;

    if (!task.completed) {
      task.completed = true;
      this.profile.xp += task.xp;
      await ABSKA_DB.set('profile', this.profile);
      this.showToast(`+${task.xp} XP! خطوة ممتازة نحو التحول.`);
    } else {
      task.completed = false;
      this.profile.xp = Math.max(0, this.profile.xp - task.xp);
      await ABSKA_DB.set('profile', this.profile);
    }

    await ABSKA_DB.set('tasks', task);
    this.renderHeader();
    this.renderDashboard();
    if (!document.getElementById('view-tasks').classList.contains('hidden')) {
      this.renderTasks();
    }
  },

  // حفظ مهمة جديدة
  async saveTask() {
    const title = document.getElementById('task-title').value.trim();
    const desc = document.getElementById('task-desc').value.trim();
    const domain = document.getElementById('task-domain').value;
    const diff = parseInt(document.getElementById('task-difficulty').value, 10);
    const xpValues = { 1: 10, 2: 20, 3: 40 };

    const newTask = {
      id: 'task_' + Date.now(),
      title,
      desc,
      domain,
      difficulty: diff,
      xp: xpValues[diff] || 20,
      completed: false,
      date: new Date().toISOString().split('T')[0]
    };

    await ABSKA_DB.set('tasks', newTask);
    document.getElementById('modal-task').classList.add('hidden');
    this.showToast('تمت إضافة المهمة بنجاح.');
    this.renderDashboard();
    this.renderTasks();
  },

  // عرض كافة المهام مع الفرز
  async renderTasks() {
    const container = document.getElementById('all-tasks-list');
    container.innerHTML = '';
    const allTasks = await ABSKA_DB.getAll('tasks');

    if (allTasks.length === 0) {
      container.innerHTML = '<p class="text-muted">قائمة المهام فارغة تماماً.</p>';
      return;
    }

    allTasks.forEach(task => {
      const el = document.createElement('div');
      el.className = `task-item ${task.completed ? 'completed' : ''}`;
      el.innerHTML = `
        <div class="task-checkbox-custom" data-id="${task.id}">
          ${task.completed ? '✓' : ''}
        </div>
        <div class="task-details">
          <div class="task-text-title">${task.title}</div>
          <div class="task-meta">
            <span>${this.getDomainName(task.domain)}</span>
            <span class="task-badge-xp">+${task.xp} XP</span>
          </div>
        </div>
        <button class="btn-text text-muted" title="حذف المهمة" data-del="${task.id}">&times;</button>
      `;
      el.querySelector('.task-checkbox-custom').addEventListener('click', () => {
        this.toggleTaskComplete(task.id);
      });
      el.querySelector('[data-del]').addEventListener('click', async () => {
        if (confirm('هل تريد حذف هذه المهمة؟')) {
          await ABSKA_DB.delete('tasks', task.id);
          this.renderTasks();
          this.renderDashboard();
        }
      });
      container.appendChild(el);
    });
  },

  // خريطة الـ214 يومًا البصرية
  renderJourneyMap() {
    const grid = document.getElementById('journey-214-grid');
    grid.innerHTML = '';

    for (let day = 1; day <= this.totalDays; day++) {
      const cell = document.createElement('div');
      cell.className = 'matrix-cell';
      cell.textContent = day;

      if (day < this.currentDay) {
        cell.classList.add('done');
      } else if (day === this.currentDay) {
        cell.classList.add('today');
      } else {
        cell.classList.add('locked');
      }

      cell.title = `اليوم ${day}`;
      grid.appendChild(cell);
    }
  },

  // شجرة تطوير الشخصية (7 مسارات)
  async renderPersonalityTree() {
    const container = document.getElementById('personality-tree-container');
    container.innerHTML = '';

    const branches = [
      { id: 'fitness', name: 'الجسم واللياقة', icon: '💪', desc: 'النشاط البدني الآمن والتعافي الحركي.' },
      { id: 'discipline', name: 'الانضباط والاستمرارية', icon: '⏳', desc: 'تقليل التسويف وحماية الجدول اليومي.' },
      { id: 'knowledge', name: 'المعرفة والقراءة', icon: '📚', desc: 'استيعاب الأفكار وتطبيقها في الواقع.' },
      { id: 'skills', name: 'المهارات والمشاريع', icon: '🛠️', desc: 'بناء مشاريع عملية تترك أثراً ملموساً.' },
      { id: 'time', name: 'تنظيم الوقت والحياة', icon: '⏱️', desc: 'إدارة الطاقة والانتباه ومحاربة التشتت.' },
      { id: 'self', name: 'اكتشاف الذات والسلوك', icon: '🧭', desc: 'فهم المحفزات وتدوين الملاحظات الشخصية.' },
      { id: 'habits', name: 'العادات والروحية', icon: '🌱', desc: 'تثبيت القيم والعادات الداخلية اليومية.' }
    ];

    const tasks = await ABSKA_DB.getAll('tasks');

    branches.forEach(b => {
      const branchTasks = tasks.filter(t => t.domain === b.id);
      const completed = branchTasks.filter(t => t.completed).length;
      const progressPercent = branchTasks.length > 0 ? Math.round((completed / branchTasks.length) * 100) : 0;

      const card = document.createElement('div');
      card.className = 'tree-branch-card';
      card.innerHTML = `
        <div class="branch-header">
          <span class="branch-title">${b.icon} ${b.name}</span>
          <span class="badge-outline">${progressPercent}%</span>
        </div>
        <p class="text-muted" style="font-size:0.8rem;">${b.desc}</p>
        <div class="progress-bar-container" style="margin-top:8px;">
          <div class="progress-bar-fill" style="width: ${progressPercent}%;"></div>
        </div>
        <div style="font-size:0.75rem; color:var(--text-muted); margin-top:4px;">
          ${completed} من أصل ${branchTasks.length} مهام منجزة
        </div>
      `;
      container.appendChild(card);
    });
  },

  // الرسوم البيانية البسيطة عبر SVG النقي (دون مكتبات خارجية)
  async renderReports() {
    const chartContainer = document.getElementById('chart-tasks-weekly');
    chartContainer.innerHTML = '';

    const tasks = await ABSKA_DB.getAll('tasks');
    const completedCount = tasks.filter(t => t.completed).length;
    const pendingCount = tasks.length - completedCount;

    // رسم بياني شريطي بسيط عبر SVG
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('width', '100%');
    svg.setAttribute('height', '100%');
    svg.setAttribute('viewBox', '0 0 300 150');

    svg.innerHTML = `
      <rect x="30" y="20" width="80" height="${Math.min(100, completedCount * 15)}" fill="#6D1028" rx="6"/>
      <text x="70" y="140" fill="#AAA2A7" font-size="12" text-anchor="middle">المنجزة (${completedCount})</text>

      <rect x="160" y="20" width="80" height="${Math.min(100, pendingCount * 15)}" fill="#30262B" rx="6"/>
      <text x="200" y="140" fill="#AAA2A7" font-size="12" text-anchor="middle">المتبقية (${pendingCount})</text>
    `;

    chartContainer.appendChild(svg);
  },

  // رسالة اليوم 214 المغلقة
  renderPost214() {
    const box = document.getElementById('sealed-letter-content');
    if (this.currentDay >= 214) {
      box.innerHTML = `
        <div class="badge-tag">فُتحت الرسالة</div>
        <p style="white-space: pre-wrap; font-weight: 500;">${this.profile.letterDay1 || 'لم تسجل رسالة في اليوم الأول.'}</p>
      `;
    } else {
      box.innerHTML = `
        <p class="text-muted">هذه الرسالة مغلقة حتى اكتمال الـ214 يوماً. تبقى أمامك ${this.totalDays - this.currentDay} يوماً للوصول إليها وتأمل تحولك.</p>
      `;
    }
  },

  // وضع اليوم الصعب
  toggleHardDayMode() {
    this.isHardDayMode = !this.isHardDayMode;
    const btn = document.getElementById('hard-mode-toggle');
    if (this.isHardDayMode) {
      btn.style.borderColor = 'var(--warning)';
      this.showToast('تم تفعيل وضع اليوم الصعب: تقليص المهام للحد الأدنى لحماية استمراريتك.');
    } else {
      btn.style.borderColor = 'var(--border)';
      this.showToast('تم العودة للوضع المعتاد.');
    }
  },

  // تسجيل الطاقة
  async logEnergy(level) {
    const label = level === 'low' ? 'منخفض' : level === 'medium' ? 'متوسط' : 'مرتفع';
    document.getElementById('current-energy-val').textContent = label;
    await ABSKA_DB.set('system_logs', {
      id: 'energy_' + Date.now(),
      date: new Date().toISOString().split('T')[0],
      type: 'energy',
      value: level
    });
    this.showToast(`تم تسجيل مستوى الطاقة: ${label}`);
  },

  // تنفيذ خطة الإنقاذ
  async executeRescue() {
    const microStep = document.getElementById('rescue-micro-step').value.trim();
    if (!microStep) {
      alert('يرجى تحديد خطوة مصغرة واحدة للعودة.');
      return;
    }

    const rescueTask = {
      id: 'task_rescue_' + Date.now(),
      title: '🎯 خطوة العودة: ' + microStep,
      desc: 'مهمة إنقاذ لاستعادة الزخم والانضباط.',
      domain: 'discipline',
      difficulty: 1,
      xp: 15,
      completed: false,
      date: new Date().toISOString().split('T')[0]
    };

    await ABSKA_DB.set('tasks', rescueTask);
    document.getElementById('modal-rescue').classList.add('hidden');
    this.showToast('أهلاً بعودتك! تم إنشاء خطوة الإنقاذ.');
    this.renderDashboard();
    this.renderTasks();
  },

  // التكيّف الذكي بالقواعد المحلية
  async checkSmartAdaptation() {
    const logs = await ABSKA_DB.getAll('system_logs');
    const lowEnergyLogs = logs.filter(l => l.type === 'energy' && l.value === 'low');

    if (lowEnergyLogs.length >= 2) {
      const alertBox = document.getElementById('smart-adaptation-alert');
      if (alertBox) alertBox.classList.remove('hidden');
    }
  },

  // ترجمة أسماء المجالات
  getDomainName(key) {
    const map = {
      fitness: 'الجسم واللياقة',
      discipline: 'الانضباط',
      knowledge: 'المعرفة',
      skills: 'المهارات',
      time: 'إدارة الوقت',
      self: 'اكتشاف الذات',
      habits: 'العادات'
    };
    return map[key] || 'عام';
  },

  // عرض التنبيهات المنبثقة
  showToast(msg) {
    const t = document.getElementById('toast');
    t.textContent = msg;
    t.classList.remove('toast-hidden');
    setTimeout(() => {
      t.classList.add('toast-hidden');
    }, 3200);
  },

  // تسجيل Service Worker للعمل دون إنترنت
  registerServiceWorker() {
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('./service-worker.js')
          .then(reg => console.log('ABSKA Service Worker Registered:', reg.scope))
          .catch(err => console.log('Service Worker registration failed:', err));
      });
    }
  }
};
