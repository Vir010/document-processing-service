import { useMemo, useRef, useState } from 'react';
import {
  LayoutDashboard, Files, Workflow, Plug, Settings, Search,
  Bell, Plus, UploadCloud, FileText, FileSpreadsheet, FileImage,
  MoreHorizontal, ChevronDown, ChevronLeft, ChevronRight,
  ArrowUpDown, CheckCircle2, Clock3, AlertCircle, X,
  Download, Trash2, RefreshCw, Eye, Filter, Menu,
  TrendingUp, ShieldCheck, Sparkles, CalendarDays, CircleHelp,
  FileCheck2, Building2, Activity
} from 'lucide-react';

type Status = 'Обработан' | 'В обработке' | 'Ошибка' | 'Загружен';
type Doc = {
  id: string;
  name: string;
  type: string;
  size: string;
  date: string;
  status: Status;
  company: string;
  inn: string;
  amount: string;
  docDate: string;
  confidence: number;
  isLocal?: boolean;
  file?: File;
};

const initialDocs: Doc[] = [
  { id: 'DOC-1048', name: 'Счет_на_оплату_1048.pdf', type: 'PDF', size: '1.8 МБ', date: '30 окт. 2026, 10:42', status: 'Обработан', company: 'ООО «Альфа Трейд»', inn: '7701234567', amount: '248 500 ₽', docDate: '29.10.2026', confidence: 98 },
  { id: 'DOC-1047', name: 'Акт_выполненных_работ.pdf', type: 'PDF', size: '2.4 МБ', date: '30 окт. 2026, 09:18', status: 'В обработке', company: 'ООО «СтройПроект»', inn: '7723456789', amount: '—', docDate: '—', confidence: 0 },
  { id: 'DOC-1046', name: 'Накладная_ТД-882.xlsx', type: 'XLSX', size: '640 КБ', date: '29 окт. 2026, 16:35', status: 'Обработан', company: 'АО «ТехноСнаб»', inn: '7812345678', amount: '86 200 ₽', docDate: '28.10.2026', confidence: 96 },
  { id: 'DOC-1045', name: 'Договор_поставки_2026.pdf', type: 'PDF', size: '3.1 МБ', date: '29 окт. 2026, 14:12', status: 'Ошибка', company: 'ООО «Вектор»', inn: '5009876543', amount: '—', docDate: '—', confidence: 42 },
  { id: 'DOC-1044', name: 'Счет-фактура_778.pdf', type: 'PDF', size: '980 КБ', date: '29 окт. 2026, 11:06', status: 'Обработан', company: 'ООО «МегаОпт»', inn: '7734567890', amount: '132 000 ₽', docDate: '28.10.2026', confidence: 99 },
  { id: 'DOC-1043', name: 'Чек_командировка.jpg', type: 'JPG', size: '420 КБ', date: '28 окт. 2026, 17:50', status: 'Загружен', company: 'Не определено', inn: '—', amount: '—', docDate: '—', confidence: 0 },
  { id: 'DOC-1042', name: 'Счет_поставщика_1042.pdf', type: 'PDF', size: '1.2 МБ', date: '28 окт. 2026, 12:24', status: 'Обработан', company: 'ООО «Логистика Плюс»', inn: '7712340987', amount: '54 900 ₽', docDate: '27.10.2026', confidence: 97 },
  { id: 'DOC-1041', name: 'УПД_№341.pdf', type: 'PDF', size: '2.0 МБ', date: '27 окт. 2026, 15:09', status: 'Обработан', company: 'ООО «ПромКомплект»', inn: '7720098765', amount: '318 750 ₽', docDate: '27.10.2026', confidence: 95 }
];

const navItems = [
  { id: 'overview', label: 'Обзор', icon: LayoutDashboard },
  { id: 'documents', label: 'Документы', icon: Files, count: '128' },
  { id: 'processing', label: 'Обработка', icon: Workflow },
  { id: 'integrations', label: 'Интеграции', icon: Plug }
];

function formatSize(bytes: number) {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} КБ`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} МБ`;
}

function getFileType(name: string) {
  const ext = name.split('.').pop()?.toUpperCase() || 'FILE';
  return ext;
}

function StatusBadge({ status }: { status: Status }) {
  const icons = {
    'Обработан': <CheckCircle2 size={14} />,
    'В обработке': <Clock3 size={14} />,
    'Ошибка': <AlertCircle size={14} />,
    'Загружен': <UploadCloud size={14} />
  };
  return <span className={`status status-${status === 'Обработан' ? 'success' : status === 'В обработке' ? 'processing' : status === 'Ошибка' ? 'error' : 'uploaded'}`}>{icons[status]}{status}</span>;
}

function FileIcon({ type }: { type: string }) {
  const Icon = type === 'XLSX' || type === 'CSV' ? FileSpreadsheet : type === 'JPG' || type === 'PNG' ? FileImage : FileText;
  return <span className={`file-icon file-${type.toLowerCase()}`}><Icon size={19} /></span>;
}

export default function App() {
  const [docs, setDocs] = useState<Doc[]>(initialDocs);
  const [page, setPage] = useState('documents');
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('Все документы');
  const [selected, setSelected] = useState<Doc | null>(null);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [toast, setToast] = useState('');
  const [menuId, setMenuId] = useState<string | null>(null);
  const [mobileNav, setMobileNav] = useState(false);
  const [sortNewest, setSortNewest] = useState(true);
  const fileInput = useRef<HTMLInputElement>(null);

  const notify = (message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(''), 3200);
  };

  const filteredDocs = useMemo(() => {
    let result = docs.filter(doc => {
      const text = `${doc.name} ${doc.id} ${doc.company} ${doc.inn}`.toLowerCase();
      const matchesQuery = text.includes(query.toLowerCase());
      const matchesFilter = filter === 'Все документы' ||
        (filter === 'Обработаны' && doc.status === 'Обработан') ||
        (filter === 'В обработке' && doc.status === 'В обработке') ||
        (filter === 'С ошибками' && doc.status === 'Ошибка') ||
        (filter === 'Загружены' && doc.status === 'Загружен');
      return matchesQuery && matchesFilter;
    });
    return [...result].sort((a, b) => sortNewest ? b.id.localeCompare(a.id) : a.id.localeCompare(b.id));
  }, [docs, query, filter, sortNewest]);

  const stats = {
    total: docs.length + 120,
    processed: docs.filter(d => d.status === 'Обработан').length + 108,
    pending: docs.filter(d => d.status === 'В обработке' || d.status === 'Загружен').length + 12,
    errors: docs.filter(d => d.status === 'Ошибка').length + 3
  };

  const addFiles = (files: FileList | File[]) => {
    const allowed = Array.from(files).filter(file =>
      /\.(pdf|png|jpg|jpeg|tif|tiff|xlsx|xls|csv|doc|docx)$/i.test(file.name)
    );
    if (!allowed.length) {
      notify('Поддерживаемые форматы: PDF, изображения, Excel и Word');
      return;
    }
    const created: Doc[] = allowed.map((file, index) => ({
      id: `DOC-${Date.now().toString().slice(-6)}${index}`,
      name: file.name,
      type: getFileType(file.name),
      size: formatSize(file.size),
      date: new Date().toLocaleString('ru-RU', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
      status: 'Загружен',
      company: 'Не определено',
      inn: '—',
      amount: '—',
      docDate: '—',
      confidence: 0,
      isLocal: true,
      file
    }));
    setDocs(prev => [...created, ...prev]);
    setUploadOpen(false);
    setPage('documents');
    notify(`Загружено файлов: ${created.length}`);
  };

  const processDoc = (doc: Doc) => {
    setDocs(prev => prev.map(item => item.id === doc.id ? { ...item, status: 'В обработке' } : item));
    setSelected(null);
    setMenuId(null);
    notify('Документ отправлен на обработку');
    window.setTimeout(() => {
      setDocs(prev => prev.map(item => item.id === doc.id ? { ...item, status: 'Обработан', company: item.company === 'Не определено' ? 'Данные требуют проверки' : item.company, confidence: item.confidence || 92 } : item));
      notify('Демонстрационная обработка завершена');
    }, 2200);
  };

  const deleteDoc = (id: string) => {
    setDocs(prev => prev.filter(doc => doc.id !== id));
    setSelected(null);
    setMenuId(null);
    notify('Документ удалён из списка');
  };

  const exportCsv = () => {
    const header = ['ID', 'Название', 'Тип', 'Статус', 'Компания', 'ИНН', 'Сумма', 'Дата документа'];
    const rows = filteredDocs.map(d => [d.id, d.name, d.type, d.status, d.company, d.inn, d.amount, d.docDate]);
    const csv = [header, ...rows].map(row => row.map(value => `"${String(value).replace(/"/g, '""')}"`).join(';')).join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'docflow-documents.csv';
    a.click();
    URL.revokeObjectURL(url);
    notify('Экспорт CSV подготовлен');
  };

  const pageTitle = page === 'overview' ? 'Обзор' : page === 'processing' ? 'Обработка' : page === 'integrations' ? 'Интеграции' : page === 'settings' ? 'Настройки' : 'Документы';

  return (
    <div className="app-shell" onClick={() => menuId && setMenuId(null)}>
      <aside className={`sidebar ${mobileNav ? 'sidebar-open' : ''}`}>
        <div className="brand">
          <div className="brand-mark"><FileCheck2 size={22} strokeWidth={2.4} /></div>
          <span>doc<span>flow</span></span>
          <button className="mobile-close icon-button" onClick={() => setMobileNav(false)}><X size={19} /></button>
        </div>

        <div className="workspace-switch">
          <div className="workspace-avatar">А</div>
          <div className="workspace-copy"><strong>Альфа Компания</strong><span>Рабочее пространство</span></div>
          <ChevronDown size={16} />
        </div>

        <div className="nav-caption">РАБОЧЕЕ ПРОСТРАНСТВО</div>
        <nav className="main-nav">
          {navItems.map(item => {
            const Icon = item.icon;
            return <button key={item.id} className={`nav-item ${page === item.id ? 'active' : ''}`} onClick={() => { setPage(item.id); setMobileNav(false); }}>
              <Icon size={19} /><span>{item.label}</span>{item.count && <small>{item.count}</small>}
            </button>;
          })}
        </nav>

        <div className="sidebar-bottom">
          <div className="help-card">
            <div className="help-icon"><CircleHelp size={17} /></div>
            <strong>Нужна помощь?</strong>
            <p>Посмотрите руководство по работе с DocFlow</p>
            <button onClick={() => notify('Раздел справки будет подключён отдельно')}>Открыть справку <ChevronRight size={14} /></button>
          </div>
          <button className={`nav-item ${page === 'settings' ? 'active' : ''}`} onClick={() => setPage('settings')}><Settings size={19} /><span>Настройки</span></button>
          <div className="profile">
            <div className="profile-avatar">ИП</div>
            <div className="profile-copy"><strong>Иван Петров</strong><span>Администратор</span></div>
            <MoreHorizontal size={19} />
          </div>
        </div>
      </aside>

      {mobileNav && <div className="mobile-backdrop" onClick={() => setMobileNav(false)} />}

      <main className="main-area">
        <header className="topbar">
          <button className="icon-button mobile-menu" onClick={() => setMobileNav(true)}><Menu size={21} /></button>
          <div className="breadcrumbs">Рабочее пространство <span>/</span> <strong>{pageTitle}</strong></div>
          <div className="topbar-actions">
            <span className="system-status"><i /> Все системы работают</span>
            <button className="icon-button notification-button" onClick={() => notify('Новых уведомлений нет')}><Bell size={19} /><i /></button>
            <div className="topbar-divider" />
            <div className="topbar-user">ИП</div>
          </div>
        </header>

        <div className="content">
          {page === 'documents' && <>
            <div className="page-heading">
              <div><div className="eyebrow">УПРАВЛЕНИЕ ДОКУМЕНТАМИ</div><h1>Документы</h1><p>Загружайте, обрабатывайте и контролируйте документы в одном месте.</p></div>
              <button className="primary-button" onClick={() => setUploadOpen(true)}><Plus size={18} /> Загрузить документ</button>
            </div>

            <section className="stats-grid">
              <div className="stat-card"><div className="stat-top"><span>Всего документов</span><div className="stat-icon purple"><Files size={18} /></div></div><div className="stat-value">{stats.total}</div><div className="stat-foot"><TrendingUp size={14} /> <b>+12%</b> <span>за этот месяц</span></div></div>
              <div className="stat-card"><div className="stat-top"><span>Успешно обработано</span><div className="stat-icon green"><CheckCircle2 size={18} /></div></div><div className="stat-value">{stats.processed}</div><div className="stat-foot"><span className="green-text">84,4%</span><span>от общего количества</span></div></div>
              <div className="stat-card"><div className="stat-top"><span>Ожидают обработки</span><div className="stat-icon orange"><Clock3 size={18} /></div></div><div className="stat-value">{stats.pending}</div><div className="stat-foot"><span>Требуют внимания</span></div></div>
              <div className="stat-card"><div className="stat-top"><span>Ошибки обработки</span><div className="stat-icon red"><AlertCircle size={18} /></div></div><div className="stat-value">{stats.errors}</div><div className="stat-foot"><span>Проверьте документы</span></div></div>
            </section>

            <section className="documents-panel">
              <div className="panel-heading"><div><h2>Все документы</h2><p>Последние загруженные и обработанные файлы</p></div><button className="secondary-button" onClick={exportCsv}><Download size={16} /> Экспортировать</button></div>
              <div className="toolbar">
                <div className="search-box"><Search size={17} /><input value={query} onChange={e => setQuery(e.target.value)} placeholder="Поиск по названию, компании или ИНН..." /><kbd>⌘ K</kbd></div>
                <div className="filter-wrap"><Filter size={16} /><select value={filter} onChange={e => setFilter(e.target.value)}><option>Все документы</option><option>Обработаны</option><option>В обработке</option><option>С ошибками</option><option>Загружены</option></select><ChevronDown size={14} /></div>
              </div>

              <div className="table-wrap">
                <table>
                  <thead><tr><th><button className="sort-button" onClick={() => setSortNewest(v => !v)}>Документ <ArrowUpDown size={13} /></button></th><th>Компания</th><th>Дата загрузки</th><th>Статус</th><th>Сумма</th><th></th></tr></thead>
                  <tbody>
                    {filteredDocs.map(doc => <tr key={doc.id} onClick={() => setSelected(doc)}>
                      <td><div className="document-cell"><FileIcon type={doc.type} /><div className="document-name"><strong>{doc.name}</strong><span>{doc.id} <i>·</i> {doc.size}</span></div></div></td>
                      <td><span className="company-name">{doc.company}</span></td>
                      <td><span className="date-cell">{doc.date}</span></td>
                      <td><StatusBadge status={doc.status} /></td>
                      <td><span className="amount-cell">{doc.amount}</span></td>
                      <td className="action-cell" onClick={e => e.stopPropagation()}>
                        <div className="menu-anchor"><button className="icon-button row-menu" onClick={() => setMenuId(menuId === doc.id ? null : doc.id)}><MoreHorizontal size={19} /></button>
                          {menuId === doc.id && <div className="dropdown-menu">
                            <button onClick={() => { setSelected(doc); setMenuId(null); }}><Eye size={15} /> Просмотреть</button>
                            <button onClick={() => processDoc(doc)}><RefreshCw size={15} /> Обработать повторно</button>
                            <button className="danger-action" onClick={() => deleteDoc(doc.id)}><Trash2 size={15} /> Удалить</button>
                          </div>}
                        </div>
                      </td>
                    </tr>)}
                    {!filteredDocs.length && <tr><td colSpan={6}><div className="empty-state"><Files size={30} /><strong>Документы не найдены</strong><span>Измените параметры поиска или загрузите новый файл</span><button className="secondary-button" onClick={() => { setQuery(''); setFilter('Все документы'); }}>Сбросить фильтры</button></div></td></tr>}
                  </tbody>
                </table>
              </div>
              <div className="table-footer"><span>Показано <b>{filteredDocs.length}</b> из <b>{docs.length}</b> документов</span><div className="pagination"><button className="icon-button" disabled><ChevronLeft size={17} /></button><button className="page-number active-page">1</button><button className="page-number" onClick={() => notify('Это демонстрационная страница списка')}>2</button><button className="page-number" onClick={() => notify('Это демонстрационная страница списка')}>3</button><span>...</span><button className="page-number" onClick={() => notify('Это демонстрационная страница списка')}>13</button><button className="icon-button" onClick={() => notify('Это демонстрационная страница списка')}><ChevronRight size={17} /></button></div></div>
            </section>

            <div className="bottom-note"><ShieldCheck size={17} /><span>Ваши документы защищены. Все файлы обрабатываются в защищённом контуре.</span><span className="note-link" onClick={() => setPage('integrations')}>Подробнее об интеграциях <ChevronRight size={14} /></span></div>
          </>}

          {page === 'overview' && <section className="placeholder-page"><div className="eyebrow">РАБОЧЕЕ ПРОСТРАНСТВО</div><h1>Добро пожаловать в DocFlow</h1><p>Единое пространство для загрузки и автоматической обработки документов.</p><div className="overview-cards"><div className="overview-card"><Files /><strong>{stats.total}</strong><span>Всего документов</span></div><div className="overview-card"><CheckCircle2 /><strong>{stats.processed}</strong><span>Обработано</span></div><div className="overview-card"><Clock3 /><strong>{stats.pending}</strong><span>Ожидают обработки</span></div></div><button className="primary-button" onClick={() => setPage('documents')}>Перейти к документам <ChevronRight size={17} /></button></section>}

          {page === 'processing' && <section className="placeholder-page"><div className="eyebrow">АВТОМАТИЗАЦИЯ</div><h1>Обработка документов</h1><p>Контроль очереди и результатов распознавания.</p><div className="process-card"><div className="process-icon"><Workflow size={23} /></div><div><strong>Пайплайн обработки</strong><p>Загрузка → OCR → Извлечение данных → Валидация → Экспорт в ERP</p><span className="status status-processing"><Activity size={14} /> Демонстрационный режим</span></div></div><button className="secondary-button" onClick={() => setPage('documents')}>Открыть список документов</button></section>}

          {page === 'integrations' && <section className="placeholder-page"><div className="eyebrow">ПОДКЛЮЧЕНИЯ</div><h1>Интеграции</h1><p>Сервисы для обмена документами и передачи проверенных данных.</p><div className="integration-list"><div className="integration-card"><div className="integration-logo"><Building2 /></div><div><strong>ERP-система</strong><p>Передача проверенных документов в учётную систему</p></div><span className="integration-state">Не подключено</span><button className="secondary-button" onClick={() => notify('Подключение ERP появится после настройки backend API')}>Настроить</button></div><div className="integration-card"><div className="integration-logo"><Sparkles /></div><div><strong>OCR / ML</strong><p>Распознавание текста и извлечение реквизитов</p></div><span className="integration-state connected">Stub adapter</span><button className="secondary-button" onClick={() => notify('Сейчас используется демонстрационный адаптер')}>Подробнее</button></div></div></section>}

          {page === 'settings' && <section className="placeholder-page"><div className="eyebrow">ПРОФИЛЬ И СИСТЕМА</div><h1>Настройки</h1><p>Управление рабочим пространством DocFlow.</p><div className="settings-card"><div><strong>Рабочее пространство</strong><span>Альфа Компания</span></div><div><strong>Пользователь</strong><span>Иван Петров · Администратор</span></div><div><strong>Режим приложения</strong><span>Frontend demo · Backend API ещё не подключён</span></div><div><strong>Версия интерфейса</strong><span>1.0.0</span></div></div></section>}
        </div>
      </main>

      {uploadOpen && <div className="modal-backdrop" onClick={() => setUploadOpen(false)}><div className="modal upload-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-heading"><div><h2>Загрузка документов</h2><p>Добавьте файлы для дальнейшей обработки</p></div><button className="icon-button" onClick={() => setUploadOpen(false)}><X size={20} /></button></div>
        <div className={`dropzone ${dragging ? 'dragging' : ''}`} onDragOver={e => { e.preventDefault(); setDragging(true); }} onDragLeave={() => setDragging(false)} onDrop={e => { e.preventDefault(); setDragging(false); addFiles(e.dataTransfer.files); }}>
          <div className="upload-illustration"><UploadCloud size={27} /></div><strong>Перетащите файлы сюда</strong><span>или выберите их на компьютере</span>
          <button className="secondary-button" onClick={() => fileInput.current?.click()}>Выбрать файлы</button>
          <input ref={fileInput} type="file" multiple accept=".pdf,.png,.jpg,.jpeg,.tif,.tiff,.xlsx,.xls,.csv,.doc,.docx" hidden onChange={e => e.target.files && addFiles(e.target.files)} />
          <small>PDF, PNG, JPG, TIFF, XLSX, XLS, CSV, DOC, DOCX · До 25 МБ на файл</small>
        </div>
        <div className="upload-security"><ShieldCheck size={16} /> Файлы будут доступны только участникам рабочего пространства.</div>
        <div className="modal-footer"><button className="secondary-button" onClick={() => setUploadOpen(false)}>Отмена</button></div>
      </div></div>}

      {selected && <div className="modal-backdrop" onClick={() => setSelected(null)}><div className="modal detail-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-heading"><div><div className="eyebrow">{selected.id}</div><h2>Информация о документе</h2></div><button className="icon-button" onClick={() => setSelected(null)}><X size={20} /></button></div>
        <div className="detail-file"><FileIcon type={selected.type} /><div><strong>{selected.name}</strong><span>{selected.type} · {selected.size} · {selected.date}</span></div></div>
        <div className="detail-status"><span>Статус обработки</span><StatusBadge status={selected.status} /></div>
        <div className="detail-section-title">Извлечённые данные</div>
        <div className="detail-grid"><div><span>Контрагент</span><strong>{selected.company}</strong></div><div><span>ИНН</span><strong>{selected.inn}</strong></div><div><span>Сумма документа</span><strong>{selected.amount}</strong></div><div><span>Дата документа</span><strong>{selected.docDate}</strong></div><div><span>Уверенность распознавания</span><strong>{selected.confidence ? `${selected.confidence}%` : 'Нет данных'}</strong></div><div><span>Передача в ERP</span><strong>Не отправлен</strong></div></div>
        <div className="detail-info"><AlertCircle size={16} /><span>Данные в этом интерфейсе демонстрационные. Реальное OCR-распознавание подключается через backend.</span></div>
        <div className="modal-footer"><button className="danger-outline" onClick={() => deleteDoc(selected.id)}><Trash2 size={16} /> Удалить</button><div className="footer-spacer" /><button className="secondary-button" onClick={() => setSelected(null)}>Закрыть</button><button className="primary-button" onClick={() => processDoc(selected)}><RefreshCw size={16} /> Обработать</button></div>
      </div></div>}

      {toast && <div className="toast"><CheckCircle2 size={17} />{toast}</div>}
    </div>
  );
}
