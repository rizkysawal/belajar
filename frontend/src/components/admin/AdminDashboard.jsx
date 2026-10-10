import React, { useState, useEffect } from 'react';
import { LayoutDashboard, FileText, Layers, Settings, LogOut, ShieldCheck, RefreshCw, Sparkles, Tags } from 'lucide-react';
import { api } from '../../api';
import AnalyticsCard from './AnalyticsCard';
import ActivityTable from './ActivityTable';
import ModuleManager from './ModuleManager';
import CategoryManager from './CategoryManager';
import SettingsPanel from './SettingsPanel';

export default function AdminDashboard({ user, onLogout }) {
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState(null);
  const [activities, setActivities] = useState([]);
  const [modules, setModules] = useState([]);
  const [categories, setCategories] = useState([]);
  const [users, setUsers] = useState([]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [overviewRes, actRes, modRes, catRes, userRes] = await Promise.all([
        api.getAdminOverview(),
        api.getAdminActivities(),
        api.getAdminModules(),
        api.getAdminCategories(),
        api.getUsers()
      ]);

      if (overviewRes.success) setAnalytics(overviewRes.analytics);
      if (actRes.success) setActivities(actRes.activities);
      if (modRes.success) setModules(modRes.modules);
      if (catRes.success) setCategories(catRes.categories);
      if (userRes.success) setUsers(userRes.users);
    } catch (err) {
      console.error('Failed to load admin data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleFilterActivities = async (filters) => {
    try {
      const res = await api.getAdminActivities(filters);
      if (res.success) setActivities(res.activities);
    } catch (err) {
      console.error('Failed to filter activities:', err);
    }
  };

  const handleAddModule = async (newModuleData) => {
    const res = await api.createAdminModule(newModuleData);
    if (res.success) {
      await loadData();
    }
    return res;
  };

  const handleUpdateModule = async (id, moduleData) => {
    const res = await api.updateAdminModule(id, moduleData);
    if (res.success) {
      await loadData();
    }
    return res;
  };

  const handleToggleModuleActive = async (id, is_active) => {
    try {
      await api.updateAdminModule(id, { is_active });
      setModules(prev => prev.map(m => m.id === id ? { ...m, is_active: is_active ? 1 : 0 } : m));
    } catch (err) {
      console.error('Failed to toggle module active state:', err);
    }
  };

  const handleDeleteModule = async (id) => {
    try {
      await api.deleteAdminModule(id);
      setModules(prev => prev.filter(m => m.id !== id));
    } catch (err) {
      console.error('Failed to delete module:', err);
    }
  };

  const handleSeedSampleModules = async () => {
    try {
      const res = await api.seedSampleModules();
      if (res.success) {
        await loadData();
      }
    } catch (err) {
      console.error('Failed to load sample modules:', err);
    }
  };

  const handleAddCategory = async (catData) => {
    const res = await api.createAdminCategory(catData);
    if (res.success) {
      await loadData();
    }
    return res;
  };

  const handleUpdateCategory = async (id, catData) => {
    const res = await api.updateAdminCategory(id, catData);
    if (res.success) {
      await loadData();
    }
    return res;
  };

  const handleDeleteCategory = async (id) => {
    const res = await api.deleteAdminCategory(id);
    if (res.success) {
      await loadData();
    }
    return res;
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Top Header Bar */}
      <header className="bg-slate-900/90 border-b border-slate-800 sticky top-0 z-30 backdrop-blur-md px-4 sm:px-8 py-3.5">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-xl shadow-inner">
              👑
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold font-fun text-white">
                  Parent & Admin Monitoring Portal
                </h1>
                <span className="hidden sm:inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-semibold">
                  <ShieldCheck className="w-3 h-3" />
                  Master PIN Verified
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Pantau progres dan kelola materi belajar Hebat & Heven
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={loadData}
              className="p-2 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white border border-slate-700 transition-colors"
              title="Perbarui Data"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>

            <button
              onClick={onLogout}
              className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 text-xs font-bold font-fun transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span>Ganti Profil</span>
            </button>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <div className="bg-slate-900/50 border-b border-slate-800/80 px-4 sm:px-8">
        <div className="max-w-7xl mx-auto flex items-center gap-2 overflow-x-auto py-2.5">
          <button
            onClick={() => setActiveTab('overview')}
            className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-bold transition-all font-fun whitespace-nowrap ${
              activeTab === 'overview'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/25'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <LayoutDashboard className="w-4 h-4" />
            <span>1. Ringkasan Eksekutif</span>
          </button>

          <button
            onClick={() => setActiveTab('activities')}
            className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-bold transition-all font-fun whitespace-nowrap ${
              activeTab === 'activities'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/25'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>2. Log Aktivitas (Audit Trail)</span>
          </button>

          <button
            onClick={() => setActiveTab('modules')}
            className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-bold transition-all font-fun whitespace-nowrap ${
              activeTab === 'modules'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/25'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>3. Manajemen Modul (CMS)</span>
          </button>

          <button
            onClick={() => setActiveTab('categories')}
            className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-bold transition-all font-fun whitespace-nowrap ${
              activeTab === 'categories'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/25'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Tags className="w-4 h-4" />
            <span>4. Kelola Kategori</span>
          </button>

          <button
            onClick={() => setActiveTab('settings')}
            className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-bold transition-all font-fun whitespace-nowrap ${
              activeTab === 'settings'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/25'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Settings className="w-4 h-4" />
            <span>5. Pengaturan Akun</span>
          </button>
        </div>
      </div>

      {/* Main Tab Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-8">
        {loading && !analytics ? (
          <div className="flex flex-col items-center justify-center py-24">
            <div className="w-12 h-12 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin mb-4" />
            <p className="text-slate-400 text-xs font-medium font-fun">Memuat data monitoring orang tua...</p>
          </div>
        ) : (
          <>
            {activeTab === 'overview' && (
              <AnalyticsCard analytics={analytics} />
            )}

            {activeTab === 'activities' && (
              <ActivityTable
                activities={activities}
                onFilterChange={handleFilterActivities}
                loading={loading}
                onRefresh={loadData}
              />
            )}

            {activeTab === 'modules' && (
              <ModuleManager
                modules={modules}
                categories={categories}
                onAddModule={handleAddModule}
                onUpdateModule={handleUpdateModule}
                onToggleActive={handleToggleModuleActive}
                onDeleteModule={handleDeleteModule}
                onSeedSampleModules={handleSeedSampleModules}
              />
            )}

            {activeTab === 'categories' && (
              <CategoryManager
                categories={categories}
                onAddCategory={handleAddCategory}
                onUpdateCategory={handleUpdateCategory}
                onDeleteCategory={handleDeleteCategory}
              />
            )}

            {activeTab === 'settings' && (
              <SettingsPanel
                users={users}
                onProgressReset={loadData}
              />
            )}
          </>
        )}
      </main>
    </div>
  );
}
