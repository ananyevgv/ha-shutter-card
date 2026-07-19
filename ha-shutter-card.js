// ha-shutter-card.js
// v1.2.2 — Исправлено: сброс tilt при перезагрузке карточки + корректное обновление ламелей

import { SHUTTER_TRANSLATIONS } from './i18n/index.js';

// ─── Theme colors ──────────────────────────────────────────────────────
const HA_THEMES = {
  dark: {
    bg_card: '#1a1a2e',
    bg_card_alt: '#16213e',
    text_primary: '#ffffff',
    text_secondary: 'rgba(255,255,255,0.7)',
    text_muted: 'rgba(255,255,255,0.4)',
    border: 'rgba(255,255,255,0.06)',
    card_shadow: '0 12px 48px rgba(0,0,0,0.5)',
    overlay: 'rgba(0,0,0,0.3)',
  },
  light: {
    bg_card: '#f0f4f8',
    bg_card_alt: '#e2e8f0',
    text_primary: '#1a202c',
    text_secondary: 'rgba(0,0,0,0.7)',
    text_muted: 'rgba(0,0,0,0.4)',
    border: 'rgba(0,0,0,0.08)',
    card_shadow: '0 12px 48px rgba(0,0,0,0.15)',
    overlay: 'rgba(255,255,255,0.3)',
  }
};

function getHATheme(themeSetting) {
  if (themeSetting === 'dark') return 'dark';
  if (themeSetting === 'light') return 'light';
  const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  return isDark ? 'dark' : 'light';
}

// ─── Background presets ──────────────────────────────────────────────────
const SHUTTER_BG_PRESETS = [
  { id: 'default', label: 'Default', c1: '#0a1628', c2: '#1a2d4a' },
  { id: 'night', label: 'Night', c1: '#0d0d1a', c2: '#1a0a3a' },
  { id: 'sunset', label: 'Sunset', c1: '#1a0a00', c2: '#ff6b35' },
  { id: 'ocean', label: 'Ocean', c1: '#001020', c2: '#0055aa' },
  { id: 'deep_neon', label: '🔵 Neon', c1: '#020b18', c2: '#00d4ff' },
  { id: 'slate', label: 'Slate', c1: '#101820', c2: '#445566' },
  { id: 'custom', label: '✏ Custom', c1: null, c2: null },
];

function shutterPresetGradient(preset, c1, c2, alpha, haTheme) {
  const a = (alpha || 85) / 100;
  const p = SHUTTER_BG_PRESETS.find(x => x.id === preset) || SHUTTER_BG_PRESETS[0];
  let g1 = (preset === 'custom' ? c1 : p.c1) || '#0a1628';
  let g2 = (preset === 'custom' ? c2 : p.c2) || '#1a2d4a';
  
  if (preset === 'default') {
    g1 = haTheme === 'light' ? '#dce4ec' : g1;
    g2 = haTheme === 'light' ? '#c8d6e5' : g2;
  }
  
  return `linear-gradient(145deg, ${g1}${Math.round(a*255).toString(16).padStart(2,'0')} 0%, ${g2}${Math.round(a*255).toString(16).padStart(2,'0')} 100%)`;
}

// ─── DEFAULT CONFIG ──────────────────────────────────────────────────────
const SHUTTER_DEFAULT_CONFIG = {
  language: 'ru',
  theme: 'auto',
  mode: 'single',
  
  // Single mode
  entity_id: '',
  color_blind: 'rgba(26, 26, 46, 0.85)',
  
  // Dual mode
  left_entity_id: '',
  right_entity_id: '',
  left_color_blind: 'rgba(26, 26, 46, 0.85)',
  right_color_blind: 'rgba(26, 26, 46, 0.85)',
  
  // Tilt (наклон ламелей)
  tilt_entity_id: '',
  tilt_entity_left: '',
  tilt_entity_right: '',
  show_tilt_controls: false,
  show_tilt_visual: true,
  
  // Режим без датчика положения
  no_feedback: false,
  memory_type: 'localstorage',
  input_number_entity: '',
  left_input_number: '',
  right_input_number: '',
  
  // Общие настройки
  title: '',
  subtitle: '',
  owner_name: 'Smart Home',
  background_preset: 'default',
  bg_color1: '#0a1628',
  bg_color2: '#1a2d4a',
  bg_alpha: 85,
  bg_blur: 12,
  bg_image: '',

  color_accent: '#00d4ff',
  color_text: '',
  color_open: '#4ade80',
  color_closed: '#ef4444',

  show_greet: true,
  show_position: false,
  show_controls: true,
  show_status: true,
  invert_position: false,

  controls_position: 'bottom',

  show_camera: true,
  camera_size: 'medium',
  camera_refresh_interval: 300,
  camera_entity: '',
  
  camera_show_timestamp: true,
  camera_show_motion: true,
  camera_show_recording: true,

  motion_entity: '',
  recording_entity: '',
  
  show_progress_bar: true,
  progress_bar_style: 'gradient',
};

// ─── CSS ──────────────────────────────────────────────────────────────────
function getShutterCSS(haTheme) {
  const theme = HA_THEMES[haTheme] || HA_THEMES.dark;
  const bgGrad = shutterPresetGradient('default');
  
  return `
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
:host{display:block;font-family:'Inter',-apple-system,BlinkMacSystemFont,sans-serif}

/* ─── Card ─────────────────────────────────────────────────────────────── */
.card{background:${bgGrad};border-radius:24px;border:1px solid ${theme.border};
  overflow:hidden;position:relative;box-shadow:${theme.card_shadow},inset 0 1px 0 rgba(255,255,255,0.04)}
.card::before{content:'';position:absolute;inset:0;pointer-events:none;
  background:radial-gradient(ellipse at 70% 30%,rgba(0,150,255,0.04),transparent 60%)}
.inner{position:relative;z-index:1;padding:18px 18px 14px}

/* ─── Layout ───────────────────────────────────────────────────────────── */
.shutter-layout{display:flex;flex-direction:column;gap:10px;position:relative}
.shutter-row{display:flex;align-items:stretch;gap:10px;width:100%;flex-wrap:wrap}

/* ─── Camera ───────────────────────────────────────────────────────────── */
.camera-section{flex:1;position:relative;border-radius:12px;overflow:hidden;
  background:rgba(0,0,0,0.5);border:1px solid ${theme.border};
  min-height:120px;display:flex;align-items:center;justify-content:center;z-index:1;
  cursor:grab;user-select:none}
.camera-section:active{cursor:grabbing}
.camera-section video{width:100%;height:100%;object-fit:cover;display:block;min-height:120px;background:#000;pointer-events:none}
.camera-section img{width:100%;height:100%;object-fit:cover;display:block;min-height:120px;background:#000;pointer-events:none}

.camera-section.camera-small{min-height:100px;max-height:150px}
.camera-section.camera-medium{min-height:150px;max-height:220px}
.camera-section.camera-large{min-height:200px;max-height:300px}

/* ─── Overlays ─────────────────────────────────────────────────────────── */
.camera-overlays{position:absolute;inset:0;pointer-events:none;z-index:1;border-radius:12px;overflow:hidden}
.camera-overlay-top{position:absolute;top:0;left:0;right:0;padding:8px 10px;
  display:flex;justify-content:space-between;align-items:flex-start;
  background:linear-gradient(180deg,rgba(0,0,0,0.5) 0%,transparent 100%);
  gap:8px;flex-wrap:wrap;pointer-events:none}
.camera-overlay-bottom{position:absolute;bottom:0;left:0;right:0;padding:6px 10px;
  display:flex;justify-content:space-between;align-items:center;
  background:linear-gradient(0deg,rgba(0,0,0,0.5) 0%,transparent 100%);
  gap:6px;flex-wrap:wrap;pointer-events:none}
.camera-overlay .badge{display:flex;align-items:center;gap:4px;padding:2px 8px;
  border-radius:10px;background:rgba(0,0,0,0.6);backdrop-filter:blur(6px);
  font-size:9px;font-weight:600;color:rgba(255,255,255,0.95);letter-spacing:0.3px}
.camera-overlay .badge .dot{width:5px;height:5px;border-radius:50%;display:inline-block}
.camera-overlay .badge .dot.red{background:#ef4444;animation:pulse 1.5s ease-in-out infinite}
.camera-overlay .badge .dot.green{background:#4ade80}
.camera-overlay .badge .dot.yellow{background:#f59e0b}
.camera-overlay .timestamp{font-size:10px;font-weight:500;color:rgba(255,255,255,0.9);
  font-variant-numeric:tabular-nums;text-shadow:0 1px 6px rgba(0,0,0,0.8)}
.camera-overlay .recording-indicator{display:flex;align-items:center;gap:4px;
  color:#ef4444;font-size:9px;font-weight:700}
.camera-overlay .recording-indicator .rec-dot{width:6px;height:6px;border-radius:50%;
  background:#ef4444;animation:pulse 0.8s ease-in-out infinite}

/* ─── Фоновое изображение ─────────────────────────────────────────────── */
.camera-section .shutter-bg-image{position:absolute;inset:0;z-index:0;
  background-size:cover;background-position:center;background-repeat:no-repeat;
  opacity:0.6;border-radius:12px}

/* ─── Шторка и ламели ──────────────────────────────────────────────────── */
.camera-shutters-overlay{position:absolute;inset:0;z-index:2;display:flex;pointer-events:none;border-radius:12px;overflow:hidden}
.camera-shutters-overlay .shutter-half{flex:1;position:relative;overflow:hidden;pointer-events:auto}

.camera-shutters-overlay .shutter-half .blind-overlay{position:absolute;inset:0;
  pointer-events:none;
  background: transparent;}

.camera-shutters-overlay .shutter-half .blind-overlay .slat{position:absolute;left:2%;right:2%;
  border-radius:2px;transform-origin:center center;
  transition:transform 0.5s ease,top 0.5s ease,opacity 0.5s ease,height 0.5s ease;
  pointer-events:none;
  box-shadow:0 1px 3px rgba(0,0,0,0.3),inset 0 1px 1px rgba(255,255,255,0.08),inset 0 -1px 1px rgba(0,0,0,0.15)}
.camera-shutters-overlay .shutter-half .blind-overlay .slat:nth-child(even){filter:brightness(1.08)}
.camera-shutters-overlay .shutter-half .blind-overlay .slat:nth-child(odd){filter:brightness(0.92)}
.camera-shutters-overlay .shutter-half .blind-overlay .slat::after{content:'';position:absolute;inset:0;border-radius:2px;
  background:linear-gradient(180deg,rgba(255,255,255,0.05) 0%,transparent 15%,transparent 85%,rgba(0,0,0,0.08) 100%);
  pointer-events:none}
.camera-shutters-overlay .shutter-divider{width:2px;background:rgba(255,255,255,0.15);flex-shrink:0;z-index:3;pointer-events:none}

/* ─── Tilt Controls ────────────────────────────────────────────────────── */
.tilt-controls{display:flex;gap:4px;justify-content:center;padding:2px 0;order:2}
.tilt-controls .tilt-btn{flex:1;max-width:50px;padding:4px 6px;border-radius:8px;
  border:1px solid ${theme.border};background:${haTheme === 'dark' ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)'};
  cursor:pointer;transition:all 0.2s;display:flex;flex-direction:column;align-items:center;
  font-family:inherit;color:${theme.text_muted};font-size:8px;font-weight:600}
.tilt-controls .tilt-btn:hover{background:${haTheme === 'dark' ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'};
  border-color:${haTheme === 'dark' ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.12)'}}
.tilt-controls .tilt-btn:active{transform:scale(0.95)}
.tilt-controls .tilt-btn .ico{font-size:14px;line-height:1.2}
.tilt-controls .tilt-btn.tilt-up:hover{border-color:var(--cv-accent,#00d4ff);color:var(--cv-accent,#00d4ff)}
.tilt-controls .tilt-btn.tilt-down:hover{border-color:var(--cv-accent,#00d4ff);color:var(--cv-accent,#00d4ff)}
.tilt-controls .tilt-btn.tilt-reset:hover{border-color:#f59e0b;color:#f59e0b}

/* ─── Offline / Loading ────────────────────────────────────────────────── */
.camera-section .camera-offline{display:flex;align-items:center;justify-content:center;height:100%;
  font-size:14px;color:rgba(255,255,255,0.3);flex-direction:column;gap:8px;width:100%;padding:20px}
.camera-section .camera-offline .ico{font-size:32px}
.camera-section .camera-loading{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;
  background:rgba(0,0,0,0.5);color:rgba(255,255,255,0.6);font-size:12px;z-index:3}
.camera-section .camera-loading .spinner{width:24px;height:24px;border:3px solid rgba(255,255,255,0.1);
  border-top-color:#fff;border-radius:50%;animation:spin 0.8s linear infinite;margin-right:10px}

/* ─── Drag Handle ──────────────────────────────────────────────────────── */
.drag-handle{position:absolute;bottom:20px;left:50%;transform:translateX(-50%);z-index:6;
  width:40px;height:4px;border-radius:2px;background:rgba(255,255,255,0.3);
  pointer-events:none;transition:opacity 0.3s}
.camera-section:hover .drag-handle{opacity:0.8}

/* ─── Header ───────────────────────────────────────────────────────────── */
.header{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:12px;flex-wrap:wrap;gap:6px}
.header-left{display:flex;flex-direction:column;gap:2px}
.header-title{font-size:20px;font-weight:700;color:${theme.text_primary};letter-spacing:-0.3px}
.header-sub{font-size:11px;color:${theme.text_muted};font-weight:400}
.header-right{display:flex;flex-direction:column;align-items:flex-end;gap:4px}
.header-greet{font-size:12px;color:${theme.text_secondary}}
.header-status{display:flex;align-items:center;gap:6px;padding:4px 12px;border-radius:20px;
  background:${haTheme === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'};
  border:1px solid ${theme.border};font-size:11px;font-weight:600;color:${theme.text_secondary}}
.header-status .dot{width:6px;height:6px;border-radius:50%;display:inline-block}
.dot.green{background:var(--cv-open,#4ade80);animation:pulse 2s ease-in-out infinite}
.dot.orange{background:#f59e0b;animation:pulse 1.5s ease-in-out infinite}
.dot.red{background:var(--cv-closed,#ef4444);animation:pulse 0.8s ease-in-out infinite}
.dot.off{background:#6b7280}

/* ─── Progress Bar ────────────────────────────────────────────────────── */
.progress-wrapper{width:100%;padding:2px 0;order:3}
.progress-bar{width:100%;height:6px;border-radius:4px;background:${haTheme === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'};
  overflow:hidden;position:relative;transition:opacity 0.3s}
.progress-bar .progress-fill{height:100%;border-radius:4px;transition:width 0.4s cubic-bezier(0.4,0,0.2,1);position:relative;width:0%}
.progress-bar .progress-fill.gradient{background:linear-gradient(90deg,var(--cv-closed,#ef4444),var(--cv-accent,#00d4ff),var(--cv-open,#4ade80))}
.progress-bar .progress-fill.solid{background:var(--cv-accent,#00d4ff)}
.progress-bar .progress-fill.animated{animation:progressPulse 1.5s ease-in-out infinite}
.progress-bar .progress-label{position:absolute;right:4px;top:50%;transform:translateY(-50%);
  font-size:8px;font-weight:700;color:${theme.text_primary};opacity:0.8;text-shadow:0 1px 4px rgba(0,0,0,0.5);
  pointer-events:none;display:none}
.progress-bar:hover .progress-label{display:block}

/* ─── Controls ─────────────────────────────────────────────────────────── */
.controls{display:flex;gap:6px;justify-content:center;padding:4px 0}
.controls .control-btn{flex:1;max-width:80px;padding:10px 6px;border-radius:12px;border:1px solid ${theme.border};
  background:${haTheme === 'dark' ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)'};
  cursor:pointer;transition:all 0.2s;display:flex;flex-direction:column;align-items:center;gap:2px;
  font-family:inherit;color:${theme.text_muted};font-size:9px;font-weight:600}
.controls .control-btn:hover{background:${haTheme === 'dark' ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'};
  border-color:${haTheme === 'dark' ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.12)'}}
.controls .control-btn:active{transform:scale(0.95)}
.controls .control-btn .ico{font-size:22px;line-height:1.2}
.controls .control-btn.open:hover{border-color:var(--cv-open,#4ade80);color:var(--cv-open,#4ade80)}
.controls .control-btn.stop:hover{border-color:#f59e0b;color:#f59e0b}
.controls .control-btn.close:hover{border-color:var(--cv-closed,#ef4444);color:var(--cv-closed,#ef4444)}

/* ─── Dual Mode ────────────────────────────────────────────────────────── */
.controls-left,.controls-right{display:flex;flex-direction:column;width:auto;min-width:45px;gap:4px;flex-shrink:0}
.controls-left{order:0}
.controls-right{order:2}
.controls-left .control-btn,.controls-right .control-btn{max-width:none;padding:10px 4px;flex:1;min-height:40px;
  border-radius:12px;border:1px solid ${theme.border};
  background:${haTheme === 'dark' ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)'};
  cursor:pointer;transition:all 0.2s;display:flex;flex-direction:column;align-items:center;gap:2px;
  font-family:inherit;color:${theme.text_muted};font-size:9px;font-weight:600}
.controls-left .control-btn:hover,.controls-right .control-btn:hover{background:${haTheme === 'dark' ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'};
  border-color:${haTheme === 'dark' ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.12)'}}
.controls-left .control-btn:active,.controls-right .control-btn:active{transform:scale(0.95)}
.controls-left .control-btn .ico,.controls-right .control-btn .ico{font-size:18px;line-height:1.2}
.controls-left .control-btn.open:hover,.controls-right .control-btn.open:hover{border-color:var(--cv-open,#4ade80);color:var(--cv-open,#4ade80)}
.controls-left .control-btn.stop:hover,.controls-right .control-btn.stop:hover{border-color:#f59e0b;color:#f59e0b}
.controls-left .control-btn.close:hover,.controls-right .control-btn.close:hover{border-color:var(--cv-closed,#ef4444);color:var(--cv-closed,#ef4444)}

/* ─── Single Mode ──────────────────────────────────────────────────────── */
.shutter-controls-left .shutter-row{flex-direction:row}
.shutter-controls-left .controls{flex-direction:column;width:auto;min-width:45px;gap:4px;flex-shrink:0}
.shutter-controls-left .controls .control-btn{max-width:none;padding:10px 4px;flex:1;min-height:40px}
.shutter-controls-left .controls .control-btn .ico{font-size:18px}
.shutter-controls-left .controls .control-btn span{font-size:8px}

.shutter-controls-right .shutter-row{flex-direction:row}
.shutter-controls-right .controls{flex-direction:column;width:auto;min-width:45px;gap:4px;flex-shrink:0;order:2}
.shutter-controls-right .controls .control-btn{max-width:none;padding:10px 4px;flex:1;min-height:40px}
.shutter-controls-right .controls .control-btn .ico{font-size:18px}
.shutter-controls-right .controls .control-btn span{font-size:8px}

.shutter-controls-top .controls{order:-1;width:100%;flex-direction:row;margin-bottom:4px}
.shutter-controls-top .controls .control-btn{max-width:80px}
.shutter-controls-top .shutter-row{flex-direction:column}

.shutter-controls-bottom .controls{order:1;width:100%;flex-direction:row;margin-top:4px}
.shutter-controls-bottom .controls .control-btn{max-width:80px}
.shutter-controls-bottom .shutter-row{flex-direction:column}

/* ─── Status Bar ───────────────────────────────────────────────────────── */
.status-bar{display:flex;justify-content:space-between;align-items:center;
  padding:8px 12px;background:${haTheme === 'dark' ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)'};
  border-radius:8px;border:1px solid ${theme.border};flex-wrap:wrap;gap:4px;
  margin-top:0;width:100%;order:4}
.status-left{display:flex;align-items:center;gap:6px;font-size:11px;color:${theme.text_muted}}
.status-left .state{font-weight:600;color:${theme.text_secondary}}
.status-dual{display:flex;align-items:center;gap:12px;font-size:10px;color:${theme.text_muted}}

/* ─── Badges ───────────────────────────────────────────────────────────── */
.no-feedback-badge{display:inline-flex;align-items:center;gap:4px;
  font-size:9px;color:${theme.text_muted};padding:2px 8px;
  border-radius:10px;background:${haTheme === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'};
  border:1px solid ${theme.border}}

/* ─── Animations ───────────────────────────────────────────────────────── */
@keyframes spin{to{transform:rotate(360deg)}}
@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.2}}
@keyframes progressPulse{0%,100%{opacity:1}50%{opacity:0.6}}

/* ─── Mobile ───────────────────────────────────────────────────────────── */
@media(max-width:500px){
  .inner{padding:12px}
  .header-title{font-size:17px}
  .shutter-layout{gap:8px}
  .shutter-row{flex-direction:column !important;gap:8px !important;align-items:stretch !important}
  .camera-section{width:100% !important;flex:none !important;min-height:130px !important;max-height:200px !important;order:2 !important}

  .controls-left,.controls-right{flex-direction:row !important;width:100% !important;min-width:unset !important;gap:4px !important;padding:0 !important}
  .controls-left{order:1 !important;justify-content:flex-start !important}
  .controls-right{order:3 !important;justify-content:flex-end !important}
  .controls-left .control-btn,.controls-right .control-btn{flex:0 1 auto !important;max-width:70px !important;min-height:36px !important;padding:4px 6px !important;font-size:8px !important}
  .controls-left .control-btn .ico,.controls-right .control-btn .ico{font-size:18px !important;line-height:1.2 !important}
  .controls-left .control-btn span,.controls-right .control-btn span{display:block !important;font-size:7px !important}

  .shutter-controls-dual .shutter-row{flex-direction:column !important}
  .shutter-controls-dual .controls-left,.shutter-controls-dual .controls-right{flex-direction:row !important;width:100% !important;min-width:unset !important;gap:4px !important}
  .shutter-controls-dual .controls-left{justify-content:flex-start !important}
  .shutter-controls-dual .controls-right{justify-content:flex-end !important}
  .shutter-controls-dual .controls-left .control-btn,.shutter-controls-dual .controls-right .control-btn{flex:0 1 auto !important;max-width:70px !important;min-height:36px !important;padding:4px 6px !important;font-size:8px !important}
  .shutter-controls-dual .controls-left .control-btn .ico,.shutter-controls-dual .controls-right .control-btn .ico{font-size:18px !important;line-height:1.2 !important}
  .shutter-controls-dual .controls-left .control-btn span,.shutter-controls-dual .controls-right .control-btn span{display:block !important;font-size:7px !important}
  .shutter-controls-dual .shutter-row .camera-section{order:2 !important}
  .shutter-controls-dual .shutter-row .controls-left{order:1 !important}
  .shutter-controls-dual .shutter-row .controls-right{order:3 !important}

  .shutter-controls-left .shutter-row,.shutter-controls-right .shutter-row{flex-direction:column !important}
  .shutter-controls-left .controls,.shutter-controls-right .controls{flex-direction:row !important;width:100% !important;min-width:unset !important;gap:4px !important;justify-content:center !important}
  .shutter-controls-left .controls .control-btn,.shutter-controls-right .controls .control-btn{flex:0 1 auto !important;max-width:70px !important;min-height:36px !important;padding:4px 6px !important;font-size:8px !important}
  .shutter-controls-left .controls .control-btn .ico,.shutter-controls-right .controls .control-btn .ico{font-size:18px !important;line-height:1.2 !important}
  .shutter-controls-left .controls .control-btn span,.shutter-controls-right .controls .control-btn span{display:block !important;font-size:7px !important}

  .shutter-controls-top .controls,.shutter-controls-bottom .controls{flex-direction:row !important;width:100% !important;gap:4px !important;justify-content:center !important}
  .shutter-controls-top .controls .control-btn,.shutter-controls-bottom .controls .control-btn{flex:0 1 auto !important;max-width:70px !important;min-height:36px !important;padding:4px 6px !important;font-size:8px !important}
  .shutter-controls-top .controls .control-btn .ico,.shutter-controls-bottom .controls .control-btn .ico{font-size:18px !important;line-height:1.2 !important}
  .shutter-controls-top .controls .control-btn span,.shutter-controls-bottom .controls .control-btn span{display:block !important;font-size:7px !important}

  .progress-wrapper{width:100% !important;order:4 !important}
  .progress-wrapper .progress-bar{height:4px !important}

  .status-bar{flex-wrap:wrap !important;justify-content:center !important;padding:6px 10px !important;order:5 !important}
  .status-dual{flex-wrap:wrap !important;justify-content:center !important;gap:4px !important;font-size:9px !important}
  .status-left{font-size:10px !important}

  .header{flex-direction:column !important;align-items:stretch !important;gap:4px !important;margin-bottom:8px !important}
  .header-right{align-items:flex-start !important;gap:2px !important}
  .header-status{font-size:10px !important;padding:2px 10px !important}
  .header-greet{font-size:11px !important}

  .camera-section.camera-small,.camera-section.camera-medium,.camera-section.camera-large{min-height:120px !important;max-height:180px !important}

  .tilt-controls{order:3 !important;width:100% !important}
  .tilt-controls .tilt-btn{max-width:60px !important;padding:4px 8px !important;font-size:8px !important}
  .tilt-controls .tilt-btn .ico{font-size:14px !important}
}
`;
}

// ─── MAIN CARD ────────────────────────────────────────────────────────────
class ShutterCard extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this._config = { ...SHUTTER_DEFAULT_CONFIG };
    this._hass = null;
    this._initialized = false;
    this._interval = null;
    this._cameraInterval = null;
    this._container = null;
    this._leftPos = 0;
    this._rightPos = 0;
    this._leftTilt = 50;
    this._rightTilt = 50;
    this._haTheme = 'dark';
    this._isDragging = false;
    this._dragStartY = 0;
    this._dragStartPos = 0;
    this._dragTarget = 0;
    this._dragSide = null;
    this._dragMode = 'position';
    this._subscribeEntities = [];
    this._isMoving = false;
    this._movementTimer = null;
  }

  static getConfigElement() {
    return document.createElement('shutter-card-editor');
  }

  static getStubConfig() {
    return {
      ...SHUTTER_DEFAULT_CONFIG,
      entity_id: 'cover.kitchen_window_motor_1',
      camera_entity: 'camera.kitchen_view',
      color_blind: 'rgba(26, 26, 46, 0.85)',
      controls_position: 'bottom',
      show_progress_bar: true,
      no_feedback: false,
      show_tilt_controls: false,
      show_tilt_visual: true,
    };
  }

  getCardSize() { return 6; }

  get t() {
    return SHUTTER_TRANSLATIONS[this._config.language || 'ru'] || SHUTTER_TRANSLATIONS.ru;
  }

  _getHATheme() {
    return getHATheme(this._config.theme || 'auto');
  }

  // ─── Работа с цветами ──────────────────────────────────────────────────
  _adjustColorBrightness(color, brightness) {
    if (!color) return `rgba(60, 60, 80, ${0.9 * brightness})`;
    
    const rgbaMatch = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/);
    if (rgbaMatch) {
      const r = Math.min(255, Math.round(parseInt(rgbaMatch[1]) * brightness));
      const g = Math.min(255, Math.round(parseInt(rgbaMatch[2]) * brightness));
      const b = Math.min(255, Math.round(parseInt(rgbaMatch[3]) * brightness));
      const a = rgbaMatch[4] ? parseFloat(rgbaMatch[4]) : 1;
      return `rgba(${r}, ${g}, ${b}, ${a})`;
    }
    
    if (color.startsWith('#')) {
      const hex = color.replace('#', '');
      let r, g, b;
      if (hex.length === 3) {
        r = parseInt(hex[0] + hex[0], 16);
        g = parseInt(hex[1] + hex[1], 16);
        b = parseInt(hex[2] + hex[2], 16);
      } else {
        r = parseInt(hex.substring(0, 2), 16);
        g = parseInt(hex.substring(2, 4), 16);
        b = parseInt(hex.substring(4, 6), 16);
      }
      return `rgb(${Math.min(255, Math.round(r * brightness))}, ${Math.min(255, Math.round(g * brightness))}, ${Math.min(255, Math.round(b * brightness))})`;
    }
    
    return color;
  }

  // ─── Работа с сущностями ──────────────────────────────────────────────
  hassSubscribe() {
    const entities = [];
    const cfg = this._config;
    if (cfg.mode === 'dual') {
      if (cfg.left_entity_id) entities.push(cfg.left_entity_id);
      if (cfg.right_entity_id) entities.push(cfg.right_entity_id);
      if (cfg.tilt_entity_left) entities.push(cfg.tilt_entity_left);
      if (cfg.tilt_entity_right) entities.push(cfg.tilt_entity_right);
    } else {
      if (cfg.entity_id) entities.push(cfg.entity_id);
      if (cfg.tilt_entity_id) entities.push(cfg.tilt_entity_id);
    }
    if (cfg.camera_entity) entities.push(cfg.camera_entity);
    if (cfg.motion_entity) entities.push(cfg.motion_entity);
    if (cfg.recording_entity) entities.push(cfg.recording_entity);
    
    if (cfg.no_feedback && cfg.memory_type === 'input_number') {
      if (cfg.mode === 'dual') {
        if (cfg.left_input_number) entities.push(cfg.left_input_number);
        if (cfg.right_input_number) entities.push(cfg.right_input_number);
      } else {
        if (cfg.input_number_entity) entities.push(cfg.input_number_entity);
      }
    }
    
    this._subscribeEntities = entities;
    return entities;
  }

  setConfig(config) {
    this._config = { ...SHUTTER_DEFAULT_CONFIG, ...config };
    this._haTheme = this._getHATheme();
    // ✅ Сбрасываем tilt при загрузке конфигурации
    this._leftTilt = 50;
    this._rightTilt = 50;
    this._initialized = false;
    this._render();
  }

  set hass(hass) {
    this._hass = hass;
    this._haTheme = this._getHATheme();
    if (this._initialized) {
      this._update();
    } else {
      this._render();
    }
  }

  connectedCallback() {
    this._interval = setInterval(() => this._update(), 5000);
    const refreshInterval = (this._config.camera_refresh_interval || 300) * 1000;
    this._cameraInterval = setInterval(() => this._refreshCamera(), refreshInterval);
    this._mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    this._mediaQuery.addEventListener('change', () => {
      if (this._config.theme === 'auto') {
        this._haTheme = this._getHATheme();
        this._update();
      }
    });
    this._handleStateChange = this._handleStateChange.bind(this);
    document.addEventListener('state-changed', this._handleStateChange);
  }

  disconnectedCallback() {
    if (this._interval) { clearInterval(this._interval); this._interval = null; }
    if (this._cameraInterval) { clearInterval(this._cameraInterval); this._cameraInterval = null; }
    if (this._mediaQuery) {
      this._mediaQuery.removeEventListener('change', () => {});
    }
    if (this._handleStateChange) {
      document.removeEventListener('state-changed', this._handleStateChange);
    }
    if (this._movementTimer) {
      clearTimeout(this._movementTimer);
      this._movementTimer = null;
    }
  }

  _handleStateChange(event) {
    if (!this._hass || !this._initialized) return;
    const entityId = event.detail?.entity_id;
    if (!entityId) return;
    if (this._subscribeEntities.includes(entityId)) {
      this._update();
    }
  }

  _state(entityId) {
    if (!entityId || !this._hass?.states) return null;
    return this._hass.states[entityId];
  }

  // ─── Сохранение позиции ──────────────────────────────────────────────
  _savePosition(entityId, position) {
    try {
      const key = `shutter_pos_${entityId}`;
      localStorage.setItem(key, JSON.stringify({
        position: position,
        timestamp: Date.now()
      }));
    } catch (e) {}
  }

  _getSavedPosition(entityId) {
    try {
      const key = `shutter_pos_${entityId}`;
      const data = localStorage.getItem(key);
      if (data) {
        const parsed = JSON.parse(data);
        if (Date.now() - parsed.timestamp < 86400000) {
          return parsed.position;
        }
      }
    } catch (e) {}
    return null;
  }

  _getInputNumberPosition(entityId) {
    const state = this._state(entityId);
    if (state && state.state !== 'unavailable' && state.state !== 'unknown') {
      const pos = parseFloat(state.state);
      if (!isNaN(pos)) {
        return Math.max(0, Math.min(100, pos));
      }
    }
    return null;
  }

  // ─── Получение позиции и наклона ─────────────────────────────────────
  _getTilt(entityId) {
    if (!entityId) return 50;
    const state = this._state(entityId);
    if (state) {
      const tilt = state.attributes?.current_tilt_position;
      if (tilt !== null && tilt !== undefined) {
        return Math.max(0, Math.min(100, tilt));
      }
    }
    return 50;
  }

  _getPosition(entityId) {
    if (!entityId) return 0;
    const cfg = this._config;
    let pos = 0;
    
    if (cfg.no_feedback) {
      let savedPos = null;
      if (cfg.memory_type === 'input_number') {
        let inputId = null;
        if (cfg.mode === 'dual') {
          if (entityId === cfg.left_entity_id) inputId = cfg.left_input_number;
          else if (entityId === cfg.right_entity_id) inputId = cfg.right_input_number;
        } else {
          inputId = cfg.input_number_entity;
        }
        if (inputId) {
          savedPos = this._getInputNumberPosition(inputId);
        }
      }
      if (savedPos === null) {
        savedPos = this._getSavedPosition(entityId);
      }
      if (savedPos !== null) {
        pos = savedPos;
        if (cfg.invert_position) pos = 100 - pos;
        return Math.max(0, Math.min(100, pos));
      }
    }
    
    const shutterState = this._state(entityId);
    if (shutterState) {
      const coverPos = shutterState.attributes?.current_position;
      if (coverPos !== null && coverPos !== undefined) {
        pos = coverPos;
        this._savePosition(entityId, pos);
      } else {
        const isClosed = shutterState.attributes?.is_closed;
        if (isClosed === true) pos = 0;
        else if (isClosed === false) pos = 100;
        this._savePosition(entityId, pos);
      }
    } else {
      const savedPos = this._getSavedPosition(entityId);
      if (savedPos !== null) {
        pos = savedPos;
      }
    }
    
    if (cfg.invert_position) pos = 100 - pos;
    return Math.max(0, Math.min(100, pos));
  }

  _getStatusText(pos, state) {
    const t = this.t;
    const cfg = this._config;
    
    if (cfg.no_feedback) {
      if (this._isMoving) {
        return { text: t.status.moving || 'Движется...', dot: 'orange', color: '#f59e0b' };
      }
      if (pos <= 1) return { text: t.status.closed, dot: 'red', color: cfg.color_closed || '#ef4444' };
      if (pos >= 99) return { text: t.status.open, dot: 'green', color: cfg.color_open || '#4ade80' };
      return { text: t.status.partial(pos), dot: 'orange', color: '#f59e0b' };
    }
    
    if (!state) {
      if (pos <= 1) return { text: t.status.closed, dot: 'red', color: cfg.color_closed || '#ef4444' };
      if (pos >= 99) return { text: t.status.open, dot: 'green', color: cfg.color_open || '#4ade80' };
      return { text: t.status.partial(pos), dot: 'orange', color: '#f59e0b' };
    }
    
    const isClosed = state.attributes?.is_closed;
    const isOpening = state.attributes?.is_opening;
    const isClosing = state.attributes?.is_closing;
    const stateVal = state.state;
    
    if (isOpening === true || stateVal === 'opening') {
      return { text: t.status.opening, dot: 'orange', color: '#f59e0b' };
    } else if (isClosing === true || stateVal === 'closing') {
      return { text: t.status.closing, dot: 'orange', color: '#f59e0b' };
    } else if (isClosed === true || stateVal === 'closed' || pos <= 1) {
      return { text: t.status.closed, dot: 'red', color: cfg.color_closed || '#ef4444' };
    } else if (isClosed === false || stateVal === 'open' || pos >= 99) {
      return { text: t.status.open, dot: 'green', color: cfg.color_open || '#4ade80' };
    } else if (stateVal === 'stopped' || stateVal === 'partially-open') {
      if (pos <= 1) return { text: t.status.closed, dot: 'red', color: cfg.color_closed || '#ef4444' };
      else if (pos >= 99) return { text: t.status.open, dot: 'green', color: cfg.color_open || '#4ade80' };
      else return { text: t.status.partial(pos), dot: 'orange', color: '#f59e0b' };
    } else {
      if (pos <= 1) return { text: t.status.closed, dot: 'red', color: cfg.color_closed || '#ef4444' };
      else if (pos >= 99) return { text: t.status.open, dot: 'green', color: cfg.color_open || '#4ade80' };
      else return { text: t.status.partial(pos), dot: 'orange', color: '#f59e0b' };
    }
  }

  _getCameraUrl() {
    const entityId = this._config.camera_entity;
    if (!entityId || !this._hass) return null;
    const state = this._hass.states[entityId];
    if (!state || state.state === 'unavailable' || state.state === 'unknown') return null;
    const token = state.attributes?.access_token;
    const ts = Date.now();
    return token ? `/api/camera_proxy/${entityId}?token=${token}&t=${ts}` : `/api/camera_proxy/${entityId}?t=${ts}`;
  }

  _refreshCamera() {
    const img = this.shadowRoot?.querySelector('#camera-image');
    if (img && this._config.camera_entity) {
      const url = this._getCameraUrl();
      if (url) img.src = url;
    }
  }

  // ─── Генерация ламелей (24 шт) ──────────────────────────────────────
  // position влияет на количество видимых ламелей (сверху вниз)
  // tilt влияет на ширину/угол каждой ламели
  _generateSlats(pos, tilt, color, isDark) {
    let slats = '';
    const numSlats = 24;
    const baseColor = color || (isDark ? 'rgba(60, 60, 80, 0.9)' : 'rgba(210, 210, 220, 0.9)');
    
    const p = (pos !== undefined && pos !== null) ? Math.max(0, Math.min(100, pos)) : 0;
    const t = (tilt !== undefined && tilt !== null) ? Math.max(0, Math.min(100, tilt)) : 50;
    
    // Количество видимых ламелей (зависит от position)
    // position=0% → 24 ламели, position=100% → 0 ламелей
    const visibleCount = Math.round(numSlats * (1 - p / 100));
    
    // Наклон: при 50 — широкие, при 0 или 100 — узкие
    const distanceFromCenter = Math.abs(t - 50) / 50;
    const heightFactor = 1.0 - 0.95 * distanceFromCenter;
    const angleDeg = ((t - 50) / 50) * 90;
    
    // Высота каждой ламели
    const slatHeight = 100 / numSlats;
    const gap = (1 - heightFactor) * slatHeight;
    
    for (let i = 0; i < numSlats; i++) {
      // Ламели появляются сверху: i=0 — самая верхняя
      if (i >= visibleCount) {
        continue;
      }
      
      const y = i * slatHeight + gap / 2;
      const isEven = i % 2 === 0;
      const slatAngle = isEven ? angleDeg : -angleDeg * 0.6;
      const brightness = 0.7 + 0.3 * (isEven ? 1 : 0.85);
      const slatColor = this._adjustColorBrightness(baseColor, brightness);
      
      slats += `<div class="slat" style="
        top:${y}%;
        height:${heightFactor * slatHeight}%;
        transform: rotateX(${slatAngle}deg);
        background: ${slatColor};
        opacity: 1;
        box-shadow: 
          0 1px 3px rgba(0,0,0,0.3),
          inset 0 1px 1px rgba(255,255,255,0.08),
          inset 0 -1px 1px rgba(0,0,0,0.15);
      "></div>`;
    }
    return slats;
  }

  _updateOverlay(side, pos, tilt, blindColor) {
    const overlay = this.shadowRoot?.querySelector(`.shutter-half.${side} .blind-overlay`);
    if (!overlay) return;
    
    overlay.style.transform = 'none';
    overlay.style.background = 'transparent';
    
    const slats = overlay.querySelectorAll('.slat');
    if (slats.length === 0) return;
    
    // ✅ Используем переданные значения
    const p = (pos !== undefined && pos !== null) ? Math.max(0, Math.min(100, pos)) : 0;
    const t = (tilt !== undefined && tilt !== null) ? Math.max(0, Math.min(100, tilt)) : 50;
    const numSlats = 24;
    const baseColor = blindColor || (this._haTheme === 'dark' ? 'rgba(60, 60, 80, 0.9)' : 'rgba(210, 210, 220, 0.9)');
    
    // ✅ Количество видимых ламелей пересчитывается всегда
    const visibleCount = Math.round(numSlats * (1 - p / 100));
    
    // Параметры наклона
    const distanceFromCenter = Math.abs(t - 50) / 50;
    const heightFactor = 1.0 - 0.95 * distanceFromCenter;
    const angleDeg = ((t - 50) / 50) * 90;
    const slatHeight = 100 / numSlats;
    const gap = (1 - heightFactor) * slatHeight;
    
    slats.forEach((slat, i) => {
      if (i < visibleCount) {
        const y = i * slatHeight + gap / 2;
        const isEven = i % 2 === 0;
        const slatAngle = isEven ? angleDeg : -angleDeg * 0.6;
        const brightness = 0.7 + 0.3 * (isEven ? 1 : 0.85);
        const slatColor = this._adjustColorBrightness(baseColor, brightness);
        
        slat.style.cssText = `
          display: block !important;
          position: absolute;
          left: 2%;
          right: 2%;
          top: ${y}%;
          height: ${heightFactor * slatHeight}%;
          transform: rotateX(${slatAngle}deg);
          transform-origin: center center;
          background: ${slatColor};
          opacity: 1;
          border-radius: 2px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.3), inset 0 1px 1px rgba(255,255,255,0.08), inset 0 -1px 1px rgba(0,0,0,0.15);
          pointer-events: none;
          transition: transform 0.5s ease, top 0.5s ease, opacity 0.5s ease;
        `;
      } else {
        const y = i * slatHeight + gap / 2;
        slat.style.cssText = `
          display: block !important;
          position: absolute;
          left: 2%;
          right: 2%;
          top: ${y}%;
          height: ${heightFactor * slatHeight}%;
          transform: rotateX(0deg);
          transform-origin: center center;
          background: transparent;
          opacity: 0;
          border-radius: 2px;
          box-shadow: none;
          pointer-events: none;
          transition: opacity 0.5s ease, top 0.5s ease;
        `;
      }
    });
  }

  _updateProgressBar(side, pos) {
    const fill = this.shadowRoot?.querySelector(`.progress-fill.${side}`);
    const label = this.shadowRoot?.querySelector(`.progress-label.${side}`);
    if (fill) {
      fill.style.width = `${Math.round(pos)}%`;
    }
    if (label) {
      label.textContent = `${Math.round(pos)}%`;
    }
  }

  _setMoving(state) {
    this._isMoving = state;
    if (state) {
      if (this._movementTimer) clearTimeout(this._movementTimer);
      this._movementTimer = setTimeout(() => {
        this._isMoving = false;
        this._update();
      }, 30000);
    } else {
      if (this._movementTimer) {
        clearTimeout(this._movementTimer);
        this._movementTimer = null;
      }
    }
    this._update();
  }

  // ─── Drag-события для управления позицией ────────────────────────────
  _onDragStart(e, side) {
    const cfg = this._config;
    const entityId = side === 'left' ? cfg.left_entity_id : 
                     side === 'right' ? cfg.right_entity_id : 
                     cfg.entity_id;
    if (!entityId || !this._hass) return;
    const event = e.touches ? e.touches[0] : e;
    this._isDragging = true;
    this._dragSide = side;
    this._dragStartY = event.clientY;
    this._dragStartPos = side === 'left' ? this._leftPos : 
                         side === 'right' ? this._rightPos : 
                         this._leftPos;
    this._dragTarget = this._dragStartPos;
    this._dragMode = 'position';
    e.preventDefault();
  }

  _onDragMove(e) {
    if (!this._isDragging || !this._dragSide) return;
    const event = e.touches ? e.touches[0] : e;
    const deltaY = this._dragStartY - event.clientY;
    const deltaPos = Math.round(deltaY * 0.3);
    let newPos = Math.max(0, Math.min(100, this._dragStartPos + deltaPos));
    this._dragTarget = newPos;
    const cfg = this._config;
    if (this._dragSide === 'left') {
      this._leftPos = newPos;
      this._updateOverlay('left', newPos, this._leftTilt, cfg.left_color_blind);
      this._updateProgressBar('left', newPos);
    } else if (this._dragSide === 'right') {
      this._rightPos = newPos;
      this._updateOverlay('right', newPos, this._rightTilt, cfg.right_color_blind);
      this._updateProgressBar('right', newPos);
    } else {
      this._leftPos = newPos;
      this._updateOverlay('single', newPos, this._leftTilt, cfg.color_blind);
      this._updateProgressBar('single', newPos);
    }
    e.preventDefault();
  }

  _onDragEnd(e) {
    if (!this._isDragging) return;
    this._isDragging = false;
    const cfg = this._config;
    const side = this._dragSide;
    if (!side) { this._dragSide = null; return; }
    
    let entityId;
    if (side === 'left') entityId = cfg.left_entity_id;
    else if (side === 'right') entityId = cfg.right_entity_id;
    else entityId = cfg.entity_id;
    
    if (!entityId) { this._dragSide = null; return; }
    const targetPos = Math.round(this._dragTarget);
    
    this._savePosition(entityId, targetPos);
    
    if (cfg.no_feedback && cfg.memory_type === 'input_number') {
      let inputId = null;
      if (cfg.mode === 'dual') {
        if (side === 'left') inputId = cfg.left_input_number;
        else if (side === 'right') inputId = cfg.right_input_number;
      } else {
        inputId = cfg.input_number_entity;
      }
      if (inputId && this._hass) {
        this._hass.callService('input_number', 'set_value', {
          entity_id: inputId,
          value: targetPos
        });
      }
    }
    
    const service = targetPos === 0 ? 'close_cover' : targetPos === 100 ? 'open_cover' : 'set_cover_position';
    if (service === 'set_cover_position') {
      this._hass.callService('cover', 'set_cover_position', { entity_id: entityId, position: targetPos });
    } else {
      this._hass.callService('cover', service, { entity_id: entityId });
    }
    this._dragSide = null;
    e.preventDefault();
  }

  _callTilt(entityId, tiltPos) {
    if (!entityId || !this._hass) return;
    this._hass.callService('cover', 'set_cover_tilt_position', {
      entity_id: entityId,
      tilt_position: Math.max(0, Math.min(100, tiltPos))
    });
  }

  // ─── Рендер ─────────────────────────────────────────────────────────────
  _render() {
    if (!this._hass) {
      this._renderUnconfigured();
      return;
    }

    const cfg = this._config;
    const t = this.t;
    const haTheme = this._haTheme;
    const theme = HA_THEMES[haTheme] || HA_THEMES.dark;
    const isDual = cfg.mode === 'dual';
    const isDark = haTheme === 'dark';
    const tiltEnabled = cfg.show_tilt_visual !== false;
    
    const accent = cfg.color_accent || '#00d4ff';
    const textColor = cfg.color_text || (haTheme === 'dark' ? '#ffffff' : '#1a202c');
    const openColor = cfg.color_open || '#4ade80';
    const closedColor = cfg.color_closed || '#ef4444';

    const bgGrad = shutterPresetGradient(cfg.background_preset, cfg.bg_color1, cfg.bg_color2, cfg.bg_alpha, haTheme);

    let leftStatus, rightStatus, singleStatus;
    let leftTilt = 50, rightTilt = 50;
    
    if (isDual) {
      // ✅ Всегда получаем свежие позиции
      const leftPos = this._getPosition(cfg.left_entity_id);
      const rightPos = this._getPosition(cfg.right_entity_id);
      this._leftPos = leftPos;
      this._rightPos = rightPos;
      
      leftTilt = this._getTilt(cfg.tilt_entity_left || cfg.left_entity_id);
      rightTilt = this._getTilt(cfg.tilt_entity_right || cfg.right_entity_id);
      
      if (!tiltEnabled) {
        leftTilt = 50;
        rightTilt = 50;
      }
      
      this._leftTilt = leftTilt;
      this._rightTilt = rightTilt;
      
      const leftState = this._state(cfg.left_entity_id);
      const rightState = this._state(cfg.right_entity_id);
      leftStatus = this._getStatusText(leftPos, leftState);
      rightStatus = this._getStatusText(rightPos, rightState);
    } else {
      // ✅ Всегда получаем свежую позицию
      const pos = this._getPosition(cfg.entity_id);
      this._leftPos = pos;
      
      const tilt = this._getTilt(cfg.tilt_entity_id || cfg.entity_id);
      this._leftTilt = tiltEnabled ? tilt : 50;
      
      const state = this._state(cfg.entity_id);
      singleStatus = this._getStatusText(pos, state);
    }

    const showCamera = cfg.show_camera !== false && cfg.camera_entity;
    const cameraSize = cfg.camera_size || 'medium';
    const cameraUrl = this._getCameraUrl();
    const bgImage = cfg.bg_image || '';
    const showProgressBar = cfg.show_progress_bar !== false;
    const progressStyle = cfg.progress_bar_style || 'gradient';
    const showTiltControls = cfg.show_tilt_controls || false;

    const customCss = `
      --cv-accent: ${accent};
      --cv-text: ${textColor};
      --cv-open: ${openColor};
      --cv-closed: ${closedColor};
      background: ${bgGrad};
      backdrop-filter: blur(${cfg.bg_blur || 12}px);
      -webkit-backdrop-filter: blur(${cfg.bg_blur || 12}px);
    `;

    // ─── Progress Bar ──────────────────────────────────────────────────
    let progressBarHtml = '';
    if (showProgressBar) {
      if (isDual) {
        progressBarHtml = `
          <div class="progress-wrapper">
            <div style="display:flex;gap:8px;align-items:center;">
              <div class="progress-bar" style="flex:1;">
                <div class="progress-fill left ${progressStyle} ${this._isMoving ? 'animated' : ''}" style="width:${Math.round(this._leftPos)}%;"></div>
                <span class="progress-label left">${Math.round(this._leftPos)}%</span>
              </div>
              <div style="font-size:8px;color:${theme.text_muted};min-width:20px;text-align:center;">|</div>
              <div class="progress-bar" style="flex:1;">
                <div class="progress-fill right ${progressStyle} ${this._isMoving ? 'animated' : ''}" style="width:${Math.round(this._rightPos)}%;"></div>
                <span class="progress-label right">${Math.round(this._rightPos)}%</span>
              </div>
            </div>
          </div>
        `;
      } else {
        progressBarHtml = `
          <div class="progress-wrapper">
            <div class="progress-bar">
              <div class="progress-fill single ${progressStyle} ${this._isMoving ? 'animated' : ''}" style="width:${Math.round(this._leftPos)}%;"></div>
              <span class="progress-label single">${Math.round(this._leftPos)}%</span>
            </div>
          </div>
        `;
      }
    }

    // ─── Tilt Controls ──────────────────────────────────────────────────
    let tiltControlsHtml = '';
    if (showTiltControls && tiltEnabled) {
      if (isDual) {
        tiltControlsHtml = `
          <div class="tilt-controls" style="display:flex;gap:4px;justify-content:space-between;width:100%;">
            <div style="display:flex;gap:4px;">
              <button class="tilt-btn tilt-up" data-side="left" data-tilt="up" title="Наклон левой вверх">↕</button>
              <button class="tilt-btn tilt-reset" data-side="left" data-tilt="reset" title="Сброс левой">⟳</button>
              <button class="tilt-btn tilt-down" data-side="left" data-tilt="down" title="Наклон левой вниз">↕</button>
              <span style="font-size:8px;color:${theme.text_muted};display:flex;align-items:center;padding:0 4px;">Л</span>
            </div>
            <div style="display:flex;gap:4px;">
              <button class="tilt-btn tilt-up" data-side="right" data-tilt="up" title="Наклон правой вверх">↕</button>
              <button class="tilt-btn tilt-reset" data-side="right" data-tilt="reset" title="Сброс правой">⟳</button>
              <button class="tilt-btn tilt-down" data-side="right" data-tilt="down" title="Наклон правой вниз">↕</button>
              <span style="font-size:8px;color:${theme.text_muted};display:flex;align-items:center;padding:0 4px;">П</span>
            </div>
          </div>
        `;
      } else {
        tiltControlsHtml = `
          <div class="tilt-controls" style="display:flex;gap:4px;justify-content:center;width:100%;">
            <button class="tilt-btn tilt-up" data-side="single" data-tilt="up" title="Наклон вверх">↕</button>
            <button class="tilt-btn tilt-reset" data-side="single" data-tilt="reset" title="Сброс наклона">⟳</button>
            <button class="tilt-btn tilt-down" data-side="single" data-tilt="down" title="Наклон вниз">↕</button>
          </div>
        `;
      }
    }

    // ─── Shutter Overlay ──────────────────────────────────────────────
    let shutterOverlayHtml = '';
    if (cfg.entity_id || isDual) {
      if (isDual) {
        const leftColor = cfg.left_color_blind || 'rgba(26,26,46,0.85)';
        const rightColor = cfg.right_color_blind || 'rgba(26,26,46,0.85)';
        
        const effectiveLeftTilt = tiltEnabled ? this._leftTilt : 50;
        const effectiveRightTilt = tiltEnabled ? this._rightTilt : 50;
        
        // ✅ Используем свежие позиции из переменных
        const leftSlats = this._generateSlats(this._leftPos, effectiveLeftTilt, leftColor, isDark);
        const rightSlats = this._generateSlats(this._rightPos, effectiveRightTilt, rightColor, isDark);
        
        let bgImageHtml = '';
        if (!showCamera && bgImage) {
          bgImageHtml = `<div class="shutter-bg-image" style="background-image: url('${bgImage}');"></div>`;
        }
        shutterOverlayHtml = `
          <div class="camera-shutters-overlay dual">
            ${bgImageHtml}
            <div class="shutter-half left" data-side="left">
              <div class="blind-overlay">
                ${leftSlats}
              </div>
            </div>
            <div class="shutter-divider"></div>
            <div class="shutter-half right" data-side="right">
              <div class="blind-overlay">
                ${rightSlats}
              </div>
            </div>
          </div>
        `;
      } else {
        const singleColor = cfg.color_blind || 'rgba(26,26,46,0.85)';
        const effectiveSingleTilt = tiltEnabled ? this._leftTilt : 50;
        
        // ✅ Используем свежую позицию из переменной
        const slats = this._generateSlats(this._leftPos, effectiveSingleTilt, singleColor, isDark);
        
        let bgImageHtml = '';
        if (!showCamera && bgImage) {
          bgImageHtml = `<div class="shutter-bg-image" style="background-image: url('${bgImage}');"></div>`;
        }
        shutterOverlayHtml = `
          <div class="camera-shutters-overlay single">
            <div class="shutter-half single" data-side="single">
              ${bgImageHtml}
              <div class="blind-overlay">
                ${slats}
              </div>
            </div>
          </div>
        `;
      }
    }

    // ─── Camera Overlay ──────────────────────────────────────────────────
    let overlayHtml = '';
    const motionState = this._state(cfg.motion_entity);
    const isMotion = motionState ? motionState.state === 'on' : false;
    const recordingState = this._state(cfg.recording_entity);
    const isRecording = recordingState ? recordingState.state === 'on' : false;
    const now = new Date();
    const timeStr = now.toLocaleTimeString();
    const showLive = showCamera && cameraUrl;
    
    const noFeedbackBadge = cfg.no_feedback ? `
      <span class="no-feedback-badge">📡 Без ОС</span>
    ` : '';
    
    overlayHtml = `
      <div class="camera-overlays">
        <div class="camera-overlay-top">
          ${showLive ? `
            <div class="badge">
              <span class="dot red"></span>
              ${t.labels.live}
            </div>
          ` : ''}
          <div style="display:flex;gap:6px;align-items:center;flex-wrap:wrap;${!showLive ? 'margin-left:auto;' : ''}">
            ${cfg.camera_show_motion !== false ? `
              <div class="badge" style="${isMotion ? 'border:1px solid #f59e0b;' : 'opacity:0.5;'}">
                ${isMotion ? '🔴' : '⚪'} ${t.labels.motion || 'Движение'}
              </div>
            ` : ''}
            ${cfg.camera_show_recording !== false ? `
              <div class="badge" style="${isRecording ? 'border:1px solid #ef4444;' : 'opacity:0.5;'}">
                ${isRecording ? '<span class="recording-indicator"><span class="rec-dot"></span> REC</span>' : '⏹ ' + (t.labels.recording || 'Запись')}
              </div>
            ` : ''}
            ${noFeedbackBadge}
          </div>
        </div>
        <div class="camera-overlay-bottom">
          ${cfg.camera_show_timestamp !== false ? `
            <span class="timestamp">${now.toLocaleDateString()} ${timeStr}</span>
          ` : ''}
          <div style="display:flex;gap:6px;">
            <span class="badge" style="font-size:8px;opacity:0.5;">${cfg.camera_entity ? cfg.camera_entity.split('.')[1] : ''}</span>
          </div>
        </div>
      </div>
    `;

    // ─── Camera Section ──────────────────────────────────────────────────
    let cameraHtml = '';
    if (showCamera) {
      cameraHtml = `
        <div class="camera-section camera-${cameraSize}" id="camera-section">
          ${cameraUrl ? `
            <img id="camera-image" src="${cameraUrl}" alt="${t.labels.camera}" style="display:block;width:100%;height:100%;object-fit:cover;"/>
            ${shutterOverlayHtml}
            ${overlayHtml}
            <div id="camera-loading" class="camera-loading" style="display:none">
              <div class="spinner"></div>
              <span>${t.labels.loading}</span>
            </div>
            <div id="camera-offline" class="camera-offline" style="display:none">
              <span class="ico">📷</span>
              <span>${t.labels.offline}</span>
            </div>
            <div class="drag-handle"></div>
          ` : `
            ${shutterOverlayHtml}
            ${overlayHtml}
            <div id="camera-offline" class="camera-offline" style="display:flex">
              <span class="ico">📷</span>
              <span>${t.labels.offline}</span>
            </div>
          `}
        </div>
      `;
    } else {
      let cameraBgStyle = 'background:rgba(0,0,0,0.3);';
      if (!showCamera && bgImage) cameraBgStyle = 'background:rgba(0,0,0,0.15);';
      cameraHtml = `
        <div class="camera-section camera-${cameraSize}" id="camera-section" style="${cameraBgStyle}min-height:120px;">
          ${shutterOverlayHtml}
          ${overlayHtml}
          <div class="drag-handle"></div>
        </div>
      `;
    }

    // ─── Controls ──────────────────────────────────────────────────────
    const showStatusBar = cfg.show_status !== false;
    const showPosition = cfg.show_position !== false;

    let leftControlsHtml = '', rightControlsHtml = '';
    
    if (isDual && cfg.show_controls !== false) {
      leftControlsHtml = `
        <div class="controls-left">
          <button class="control-btn open" data-side="left" data-action="open" title="${t.labels.open}">
            <span class="ico">▲</span>
            <span>${t.labels.open}</span>
          </button>
          <button class="control-btn stop" data-side="left" data-action="stop" title="${t.labels.stop}">
            <span class="ico">■</span>
            <span>${t.labels.stop}</span>
          </button>
          <button class="control-btn close" data-side="left" data-action="close" title="${t.labels.close}">
            <span class="ico">▼</span>
            <span>${t.labels.close}</span>
          </button>
        </div>
      `;
      rightControlsHtml = `
        <div class="controls-right">
          <button class="control-btn open" data-side="right" data-action="open" title="${t.labels.open}">
            <span class="ico">▲</span>
            <span>${t.labels.open}</span>
          </button>
          <button class="control-btn stop" data-side="right" data-action="stop" title="${t.labels.stop}">
            <span class="ico">■</span>
            <span>${t.labels.stop}</span>
          </button>
          <button class="control-btn close" data-side="right" data-action="close" title="${t.labels.close}">
            <span class="ico">▼</span>
            <span>${t.labels.close}</span>
          </button>
        </div>
      `;
    }

    let controlsTopHtml = '', controlsBottomHtml = '', controlsLeftHtmlSingle = '', controlsRightHtmlSingle = '';
    const controlsPos = cfg.controls_position || 'bottom';

    const controlsHtmlSingle = cfg.show_controls !== false && !isDual ? `
      <div class="controls">
        <button class="control-btn open" id="btn-open" title="${t.labels.open}">
          <span class="ico">▲</span>
          <span>${t.labels.open}</span>
        </button>
        <button class="control-btn stop" id="btn-stop" title="${t.labels.stop}">
          <span class="ico">■</span>
          <span>${t.labels.stop}</span>
        </button>
        <button class="control-btn close" id="btn-close" title="${t.labels.close}">
          <span class="ico">▼</span>
          <span>${t.labels.close}</span>
        </button>
      </div>
    ` : '';

    if (!isDual) {
      if (controlsPos === 'top') controlsTopHtml = controlsHtmlSingle;
      else if (controlsPos === 'bottom') controlsBottomHtml = controlsHtmlSingle;
      else if (controlsPos === 'left') controlsLeftHtmlSingle = controlsHtmlSingle;
      else if (controlsPos === 'right') controlsRightHtmlSingle = controlsHtmlSingle;
    }

    const dualClasses = isDual ? 'shutter-controls-dual' : '';
    const singleClasses = !isDual ? `shutter-controls-${controlsPos}` : '';

    let greetText = '';
    if (cfg.show_greet !== false) {
      try { greetText = t.greet ? t.greet() : ''; } catch (_) { greetText = ''; }
    }

    // ─── Header ──────────────────────────────────────────────────────────
    let headerStatusHtml = '';
    if (!isDual && showStatusBar) {
      headerStatusHtml = `
        <div class="header-status">
          <span class="dot ${singleStatus.dot}"></span>
          ${singleStatus.text}
        </div>
      `;
    } else if (isDual && showStatusBar) {
      headerStatusHtml = `
        <div style="display:flex;gap:12px;font-size:10px;color:${theme.text_muted};flex-wrap:wrap;justify-content:flex-end;">
          <span style="color:${leftStatus.color}">Левая: ${leftStatus.text}</span>
          <span style="color:${theme.text_muted};">|</span>
          <span style="color:${rightStatus.color}">Правая: ${rightStatus.text}</span>
        </div>
      `;
    }

    // ─── Status Bar ──────────────────────────────────────────────────────
    let statusBarHtml = '';
    if (showPosition) {
      if (!isDual) {
        statusBarHtml = `
          <div class="status-bar">
            <div class="status-left">
              <span>${t.labels.position}:</span>
              <span class="state" style="color:${singleStatus.color}">${Math.round(this._leftPos)}%</span>
              ${cfg.no_feedback ? `<span class="no-feedback-badge" style="margin-left:8px;">💾</span>` : ''}
            </div>
          </div>
        `;
      } else {
        statusBarHtml = `
          <div class="status-bar">
            <div class="status-dual">
              <span>Левая:</span>
              <span class="state" style="color:${leftStatus.color}">${Math.round(this._leftPos)}%</span>
              <span style="color:${theme.text_muted};">|</span>
              <span>Правая:</span>
              <span class="state" style="color:${rightStatus.color}">${Math.round(this._rightPos)}%</span>
              ${cfg.no_feedback ? `<span class="no-feedback-badge" style="margin-left:8px;">💾</span>` : ''}
            </div>
          </div>
        `;
      }
    }

    // ─── Финальный HTML ──────────────────────────────────────────────────
    const html = `
      <style>${getShutterCSS(haTheme)}</style>
      <div class="card ${dualClasses} ${singleClasses}" style="${customCss}">
        <div class="inner">
          <div class="header">
            <div class="header-left">
              ${cfg.title ? `<div class="header-title">${cfg.title}</div>` : ''}
              ${cfg.subtitle ? `<div class="header-sub">${cfg.subtitle}</div>` : ''}
            </div>
            <div class="header-right">
              ${greetText ? `<div class="header-greet">${greetText} ${cfg.owner_name || ''}</div>` : ''}
              ${headerStatusHtml}
            </div>
          </div>

          <div class="shutter-layout">
            ${controlsTopHtml}
            ${tiltControlsHtml}

            <div class="shutter-row">
              ${controlsLeftHtmlSingle || leftControlsHtml}
              ${cameraHtml}
              ${controlsRightHtmlSingle || rightControlsHtml}
            </div>

            ${controlsBottomHtml}
            
            ${progressBarHtml}

            ${statusBarHtml}
          </div>
        </div>
      </div>
    `;

    if (!this._container) {
      this._container = document.createElement('div');
      this._container.id = 'shutter-root';
      this.shadowRoot.appendChild(this._container);
    }
    this._container.innerHTML = html;

    this._initialized = true;
    this._bindEvents();
    this.hassSubscribe();
  }

  _renderUnconfigured() {
    if (this._container) {
      this._container.innerHTML = '';
    } else {
      this._container = document.createElement('div');
      this._container.id = 'shutter-root';
      this.shadowRoot.appendChild(this._container);
    }
    this._initialized = false;
  }

  // ─── Update ─────────────────────────────────────────────────────────────
  _update() {
    if (!this._initialized || !this._hass) return;
    const cfg = this._config;
    const isDual = cfg.mode === 'dual';
    const theme = HA_THEMES[this._haTheme] || HA_THEMES.dark;
    const tiltEnabled = cfg.show_tilt_visual !== false;
    
    if (!this._isDragging) {
      if (isDual) {
        const newLeftPos = this._getPosition(cfg.left_entity_id);
        const newRightPos = this._getPosition(cfg.right_entity_id);
        const newLeftTilt = this._getTilt(cfg.tilt_entity_left || cfg.left_entity_id);
        const newRightTilt = this._getTilt(cfg.tilt_entity_right || cfg.right_entity_id);
        
        const effectiveLeftTilt = tiltEnabled ? newLeftTilt : 50;
        const effectiveRightTilt = tiltEnabled ? newRightTilt : 50;
        
        if (newLeftPos !== this._leftPos || effectiveLeftTilt !== this._leftTilt) {
          this._leftPos = newLeftPos;
          this._leftTilt = effectiveLeftTilt;
          this._updateOverlay('left', newLeftPos, effectiveLeftTilt, cfg.left_color_blind);
          this._updateProgressBar('left', newLeftPos);
        }
        if (newRightPos !== this._rightPos || effectiveRightTilt !== this._rightTilt) {
          this._rightPos = newRightPos;
          this._rightTilt = effectiveRightTilt;
          this._updateOverlay('right', newRightPos, effectiveRightTilt, cfg.right_color_blind);
          this._updateProgressBar('right', newRightPos);
        }
        
        const statusDual = this.shadowRoot?.querySelector('.status-dual');
        if (statusDual && isDual) {
          const leftState = this._state(cfg.left_entity_id);
          const rightState = this._state(cfg.right_entity_id);
          const leftStatus = this._getStatusText(this._leftPos, leftState);
          const rightStatus = this._getStatusText(this._rightPos, rightState);
          const spans = statusDual.querySelectorAll('.state');
          if (spans.length >= 2) {
            spans[0].textContent = `${Math.round(this._leftPos)}%`;
            spans[0].style.color = leftStatus.color;
            spans[1].textContent = `${Math.round(this._rightPos)}%`;
            spans[1].style.color = rightStatus.color;
          }
        }
        
        if (cfg.show_status !== false) {
          const headerDual = this.shadowRoot?.querySelector('.header-right > div:last-child');
          if (headerDual && isDual) {
            const leftState = this._state(cfg.left_entity_id);
            const rightState = this._state(cfg.right_entity_id);
            const leftStatus = this._getStatusText(this._leftPos, leftState);
            const rightStatus = this._getStatusText(this._rightPos, rightState);
            headerDual.innerHTML = `
              <span style="color:${leftStatus.color}">Левая: ${leftStatus.text}</span>
              <span style="color:${theme.text_muted};">|</span>
              <span style="color:${rightStatus.color}">Правая: ${rightStatus.text}</span>
            `;
          }
        }
      } else {
        const newPos = this._getPosition(cfg.entity_id);
        const newTilt = this._getTilt(cfg.tilt_entity_id || cfg.entity_id);
        const state = this._state(cfg.entity_id);
        
        const effectiveTilt = tiltEnabled ? newTilt : 50;
        
        if (newPos !== this._leftPos || effectiveTilt !== this._leftTilt) {
          this._leftPos = newPos;
          this._leftTilt = effectiveTilt;
          this._updateOverlay('single', newPos, effectiveTilt, cfg.color_blind);
          this._updateProgressBar('single', newPos);
        }
        
        const status = this._getStatusText(this._leftPos, state);
        
        if (cfg.show_status !== false) {
          const headerStatus = this.shadowRoot?.querySelector('.header-status');
          if (headerStatus) {
            const dot = headerStatus.querySelector('.dot');
            let textNode = null;
            for (let node of headerStatus.childNodes) {
              if (node.nodeType === Node.TEXT_NODE && node.textContent.trim()) {
                textNode = node;
                break;
              }
            }
            if (!textNode) {
              textNode = headerStatus.lastChild;
            }
            if (dot) {
              dot.className = `dot ${status.dot}`;
            }
            if (textNode) {
              textNode.textContent = status.text;
            }
          }
        }
        
        const statusLeft = this.shadowRoot?.querySelector('.status-left .state');
        if (statusLeft) {
          statusLeft.textContent = `${Math.round(this._leftPos)}%`;
          statusLeft.style.color = status.color;
        }
      }
    }
    
    // Обновляем таймстамп
    const timestamp = this.shadowRoot?.querySelector('.timestamp');
    if (timestamp) {
      const now = new Date();
      timestamp.textContent = `${now.toLocaleDateString()} ${now.toLocaleTimeString()}`;
    }
    
    // Обновляем статус движения и записи
    const motionState = this._state(cfg.motion_entity);
    const isMotion = motionState ? motionState.state === 'on' : false;
    const recordingState = this._state(cfg.recording_entity);
    const isRecording = recordingState ? recordingState.state === 'on' : false;
    
    const overlayTop = this.shadowRoot?.querySelector('.camera-overlay-top');
    if (overlayTop) {
      const badges = overlayTop.querySelectorAll('.badge');
      let motionBadge = null, recordingBadge = null;
      badges.forEach(badge => {
        const text = badge.textContent;
        if (text.includes('Движение') || text.includes('движение') || text.includes('Motion')) motionBadge = badge;
        if (text.includes('Запись') || text.includes('запись') || text.includes('REC') || text.includes('recording')) recordingBadge = badge;
      });
      if (motionBadge && cfg.camera_show_motion !== false) {
        motionBadge.textContent = isMotion ? '🔴 Движение' : '⚪ Движение';
        motionBadge.style.border = isMotion ? '1px solid #f59e0b' : 'none';
        motionBadge.style.opacity = isMotion ? '1' : '0.5';
      }
      if (recordingBadge && cfg.camera_show_recording !== false) {
        if (isRecording) {
          recordingBadge.innerHTML = '<span class="recording-indicator"><span class="rec-dot"></span> REC</span>';
          recordingBadge.style.border = '1px solid #ef4444';
          recordingBadge.style.opacity = '1';
        } else {
          recordingBadge.textContent = '⏹ Запись';
          recordingBadge.style.border = 'none';
          recordingBadge.style.opacity = '0.5';
        }
      }
    }
    
    this._refreshCamera();
  }

  // ─── Биндинг событий ──────────────────────────────────────────────────
  _bindEvents() {
    const sr = this.shadowRoot;
    const cfg = this._config;
    const isDual = cfg.mode === 'dual';
    const tiltEnabled = cfg.show_tilt_visual !== false;

    const tiltBtns = sr?.querySelectorAll('.tilt-btn');
    tiltBtns?.forEach(btn => {
      btn.addEventListener('click', (e) => {
        if (!tiltEnabled) return;
        const side = btn.dataset.side;
        const tiltAction = btn.dataset.tilt;
        let entityId;
        let currentTilt;
        
        if (isDual) {
          if (side === 'left') {
            entityId = cfg.tilt_entity_left || cfg.left_entity_id;
            currentTilt = this._leftTilt;
          } else {
            entityId = cfg.tilt_entity_right || cfg.right_entity_id;
            currentTilt = this._rightTilt;
          }
        } else {
          entityId = cfg.tilt_entity_id || cfg.entity_id;
          currentTilt = this._leftTilt;
        }
        
        if (!entityId || !this._hass) return;
        
        let newTilt = currentTilt;
        if (tiltAction === 'up') newTilt = Math.min(100, currentTilt + 10);
        else if (tiltAction === 'down') newTilt = Math.max(0, currentTilt - 10);
        else if (tiltAction === 'reset') newTilt = 50;
        
        this._callTilt(entityId, newTilt);
        
        if (isDual) {
          if (side === 'left') {
            this._leftTilt = newTilt;
            this._updateOverlay('left', this._leftPos, newTilt, cfg.left_color_blind);
          } else {
            this._rightTilt = newTilt;
            this._updateOverlay('right', this._rightPos, newTilt, cfg.right_color_blind);
          }
        } else {
          this._leftTilt = newTilt;
          this._updateOverlay('single', this._leftPos, newTilt, cfg.color_blind);
        }
      });
    });

    if (isDual) {
      const controls = sr?.querySelectorAll('.controls-left .control-btn, .controls-right .control-btn');
      controls?.forEach(btn => {
        btn.addEventListener('click', (e) => {
          const side = btn.dataset.side;
          const action = btn.dataset.action;
          const entityId = side === 'left' ? cfg.left_entity_id : cfg.right_entity_id;
          if (!entityId || !this._hass) return;
          
          this._setMoving(true);
          
          const service = action === 'open' ? 'open_cover' : action === 'stop' ? 'stop_cover' : 'close_cover';
          this._hass.callService('cover', service, { entity_id: entityId });
          
          if (cfg.no_feedback) {
            setTimeout(() => {
              let newPos = this._leftPos;
              if (side === 'left') {
                if (action === 'open') newPos = 100;
                else if (action === 'close') newPos = 0;
                else if (action === 'stop') newPos = this._leftPos;
                this._leftPos = newPos;
                this._updateOverlay('left', newPos, this._leftTilt, cfg.left_color_blind);
                this._updateProgressBar('left', newPos);
                this._savePosition(cfg.left_entity_id, newPos);
              } else {
                if (action === 'open') newPos = 100;
                else if (action === 'close') newPos = 0;
                else if (action === 'stop') newPos = this._rightPos;
                this._rightPos = newPos;
                this._updateOverlay('right', newPos, this._rightTilt, cfg.right_color_blind);
                this._updateProgressBar('right', newPos);
                this._savePosition(cfg.right_entity_id, newPos);
              }
              this._update();
              this._setMoving(false);
            }, 300);
          } else {
            setTimeout(() => {
              this._setMoving(false);
              if (side === 'left') {
                const newPos = this._getPosition(cfg.left_entity_id);
                this._leftPos = newPos;
                this._updateOverlay('left', newPos, this._leftTilt, cfg.left_color_blind);
                this._updateProgressBar('left', newPos);
              } else {
                const newPos = this._getPosition(cfg.right_entity_id);
                this._rightPos = newPos;
                this._updateOverlay('right', newPos, this._rightTilt, cfg.right_color_blind);
                this._updateProgressBar('right', newPos);
              }
            }, 300);
          }
        });
      });

      const halves = sr?.querySelectorAll('.shutter-half');
      halves?.forEach(half => {
        const side = half.dataset.side;
        if (!side || side === 'single') return;
        half.addEventListener('mousedown', (e) => {
          if (e.target.closest('.control-btn') || e.target.closest('.tilt-btn')) return;
          this._onDragStart(e, side);
        });
        half.addEventListener('touchstart', (e) => {
          if (e.target.closest('.control-btn') || e.target.closest('.tilt-btn')) return;
          this._onDragStart(e, side);
        }, { passive: false });
      });
    } else {
      const controls = sr?.querySelector('.controls');
      if (controls) {
        controls.replaceWith(controls.cloneNode(true));
        const newControls = sr.querySelector('.controls');
        if (newControls) {
          newControls.addEventListener('click', (e) => {
            const btn = e.target.closest('.control-btn');
            if (!btn) return;
            if (!cfg.entity_id || !this._hass) return;
            const id = btn.id;
            let service = '';
            let action = '';
            if (id === 'btn-open') { service = 'open_cover'; action = 'open'; }
            else if (id === 'btn-stop') { service = 'stop_cover'; action = 'stop'; }
            else if (id === 'btn-close') { service = 'close_cover'; action = 'close'; }
            else return;
            
            this._setMoving(true);
            this._hass.callService('cover', service, { entity_id: cfg.entity_id });
            
            if (cfg.no_feedback) {
              setTimeout(() => {
                let newPos = this._leftPos;
                if (action === 'open') newPos = 100;
                else if (action === 'close') newPos = 0;
                else if (action === 'stop') newPos = this._leftPos;
                
                this._leftPos = newPos;
                this._updateOverlay('single', newPos, this._leftTilt, cfg.color_blind);
                this._updateProgressBar('single', newPos);
                this._savePosition(cfg.entity_id, newPos);
                
                if (cfg.show_status !== false) {
                  const headerStatus = this.shadowRoot?.querySelector('.header-status');
                  if (headerStatus) {
                    const state = this._state(cfg.entity_id);
                    const status = this._getStatusText(newPos, state);
                    const dot = headerStatus.querySelector('.dot');
                    let textNode = null;
                    for (let node of headerStatus.childNodes) {
                      if (node.nodeType === Node.TEXT_NODE && node.textContent.trim()) {
                        textNode = node;
                        break;
                      }
                    }
                    if (!textNode) textNode = headerStatus.lastChild;
                    if (dot) dot.className = `dot ${status.dot}`;
                    if (textNode) textNode.textContent = status.text;
                  }
                }
                const statusLeft = this.shadowRoot?.querySelector('.status-left .state');
                if (statusLeft) {
                  const state = this._state(cfg.entity_id);
                  const status = this._getStatusText(newPos, state);
                  statusLeft.textContent = `${Math.round(newPos)}%`;
                  statusLeft.style.color = status.color;
                }
                
                this._setMoving(false);
              }, 300);
            } else {
              setTimeout(() => {
                this._setMoving(false);
                const newPos = this._getPosition(cfg.entity_id);
                this._leftPos = newPos;
                this._updateOverlay('single', newPos, this._leftTilt, cfg.color_blind);
                this._updateProgressBar('single', newPos);
                
                if (cfg.show_status !== false) {
                  const headerStatus = this.shadowRoot?.querySelector('.header-status');
                  if (headerStatus) {
                    const state = this._state(cfg.entity_id);
                    const status = this._getStatusText(newPos, state);
                    const dot = headerStatus.querySelector('.dot');
                    let textNode = null;
                    for (let node of headerStatus.childNodes) {
                      if (node.nodeType === Node.TEXT_NODE && node.textContent.trim()) {
                        textNode = node;
                        break;
                      }
                    }
                    if (!textNode) textNode = headerStatus.lastChild;
                    if (dot) dot.className = `dot ${status.dot}`;
                    if (textNode) textNode.textContent = status.text;
                  }
                }
                const statusLeft = this.shadowRoot?.querySelector('.status-left .state');
                if (statusLeft) {
                  const state = this._state(cfg.entity_id);
                  const status = this._getStatusText(newPos, state);
                  statusLeft.textContent = `${Math.round(newPos)}%`;
                  statusLeft.style.color = status.color;
                }
              }, 300);
            }
          });
        }
      }

      const cameraSection = sr?.querySelector('#camera-section');
      if (cameraSection && cfg.camera_entity) {
        cameraSection.addEventListener('mousedown', (e) => {
          if (e.target.closest('.control-btn') || e.target.closest('.tilt-btn')) return;
          if (!cfg.entity_id || !this._hass) return;
          const event = e.touches ? e.touches[0] : e;
          this._isDragging = true;
          this._dragSide = 'single';
          this._dragStartY = event.clientY;
          this._dragStartPos = this._leftPos;
          this._dragTarget = this._leftPos;
          e.preventDefault();
        });
        cameraSection.addEventListener('touchstart', (e) => {
          if (e.target.closest('.control-btn') || e.target.closest('.tilt-btn')) return;
          if (!cfg.entity_id || !this._hass) return;
          const touch = e.touches[0];
          this._isDragging = true;
          this._dragSide = 'single';
          this._dragStartY = touch.clientY;
          this._dragStartPos = this._leftPos;
          this._dragTarget = this._leftPos;
          e.preventDefault();
        }, { passive: false });
      }
    }

    document.addEventListener('mousemove', this._onDragMove.bind(this));
    document.addEventListener('mouseup', this._onDragEnd.bind(this));
    document.addEventListener('touchmove', this._onDragMove.bind(this), { passive: false });
    document.addEventListener('touchend', this._onDragEnd.bind(this));
  }
}

// ─── EDITOR ──────────────────────────────────────────────────────────────
class ShutterCardEditor extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this._config = { ...SHUTTER_DEFAULT_CONFIG };
    this._hass = null;
    this._open = { lang: true, title: true, entities: true, camera: true, overlay: true, colors: false, bg: true, display: true, advanced: false, tilt: false };
    this._picker = null;
    this._updating = false;
  }

  setConfig(config) {
    this._config = { ...SHUTTER_DEFAULT_CONFIG, ...config };
    this._render();
  }

  set hass(h) {
    this._hass = h;
    setTimeout(() => this._syncPickers(), 100);
  }

  get t() {
    return SHUTTER_TRANSLATIONS[this._config.language || 'ru'] || SHUTTER_TRANSLATIONS.ru;
  }

  _fire() {
    this.dispatchEvent(new CustomEvent('config-changed', {
      detail: { config: this._config },
      bubbles: true,
      composed: true,
    }));
  }

  _syncPickers() {
    if (!this._hass || !this.shadowRoot) return;
    const pickers = this.shadowRoot.querySelectorAll('ha-entity-picker');
    if (pickers.length === 0) {
      setTimeout(() => this._syncPickers(), 200);
      return;
    }
    pickers.forEach(p => {
      p.hass = this._hass;
      const domain = p.dataset.domain;
      if (domain) p.includeDomains = domain.split(',');
      const key = p.dataset.key;
      const saved = this._config[key] || '';
      if (saved && p.value !== saved) {
        p.value = saved;
        p.setAttribute('value', saved);
      }
    });
  }

  _toggleSection(id) {
    this._open[id] = !this._open[id];
    const body = this.shadowRoot.getElementById('body-' + id);
    const arrow = this.shadowRoot.getElementById('arrow-' + id);
    if (body) {
      body.style.display = this._open[id] ? 'block' : 'none';
      if (arrow) arrow.textContent = this._open[id] ? '▾' : '▸';
      if (this._open[id]) setTimeout(() => this._syncPickers(), 100);
    }
  }

  _colorRow(key, label) {
    const value = this._config[key] || '#ffffff';
    const isOpen = this._picker === key;
    const swatches = ['#4ade80', '#ef4444', '#f59e0b', '#3b82f6', '#00d4ff', '#a78bfa', '#ffffff', '#94a3b8'];
    return `
      <div class="ci">
        <div class="ci-hdr" data-cp="${key}">
          <div class="ci-swatch" style="background:${value};"></div>
          <span class="ci-label">${label}</span>
          <code class="ci-code">${value}</code>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" class="ci-chv">
            <path d="${isOpen ? 'M7.41 15.41 12 10.83l4.59 4.58L18 14l-6-6-6 6z' : 'M7.41 8.59 12 13.17l4.59-4.58L18 10l-6 6-6-6 1.41-1.41z'}"/>
          </svg>
        </div>
        ${isOpen ? `
          <div class="ci-body">
            <input type="color" data-cp-native="${key}" value="${value}" class="ci-native"/>
            <div class="ci-hex-wrap">
              <span class="ci-hash">#</span>
              <input type="text" data-cp-hex="${key}" value="${value.replace('#','')}" maxlength="6" placeholder="rrggbb" class="ci-hex-inp"/>
            </div>
            <div class="ci-swatches">
              ${swatches.map(c => `<div data-cp-dot="${key}" data-color="${c}" class="ci-dot"
                style="background:${c};outline:${value === c ? '2px solid var(--primary-color)' : '2px solid transparent'};"></div>`).join('')}
            </div>
          </div>
        ` : ''}
      </div>
    `;
  }

  _entityField(key, label, domain) {
    return `
      <div class="row">
        <label>${label}</label>
        <ha-entity-picker data-key="${key}" data-domain="${domain}" allow-custom-entity></ha-entity-picker>
      </div>
    `;
  }

  _toggleSwitch(key, label, desc) {
    const checked = this._config[key] !== false;
    return `
      <div class="disp-row">
        <div class="disp-info">
          <div class="disp-label">${label}</div>
          ${desc ? `<div class="disp-desc">${desc}</div>` : ''}
        </div>
        <label class="tog-wrap">
          <input type="checkbox" class="disp-tog" data-key="${key}" ${checked ? 'checked' : ''}>
          <span class="tog-slider"></span>
        </label>
      </div>
    `;
  }

  _render() {
    const cfg = this._config;
    const t = this.t;
    const lang = cfg.language || 'ru';
    const bgP = cfg.background_preset || 'default';
    const refreshInterval = cfg.camera_refresh_interval || 300;
    const theme = cfg.theme || 'auto';
    const mode = cfg.mode || 'single';
    const controlsPos = cfg.controls_position || 'bottom';
    const noFeedback = cfg.no_feedback || false;
    const memoryType = cfg.memory_type || 'localstorage';
    const showProgressBar = cfg.show_progress_bar !== false;
    const progressStyle = cfg.progress_bar_style || 'gradient';
    const showTiltControls = cfg.show_tilt_controls || false;
    const showTiltVisual = cfg.show_tilt_visual !== false;

    this.shadowRoot.innerHTML = `
      <style>
        :host { display:block; font-family:var(--primary-font-family,'Inter',sans-serif); }
        .editor { background:var(--card-background-color,#fff); color:var(--primary-text-color); }
        .credit {
          display:flex;align-items:center;gap:8px;padding:12px 16px 8px;
          font-size:12px;color:var(--primary-color);font-weight:500;
          border-bottom:1px solid var(--divider-color);
        }
        .acc-wrap { border-bottom:1px solid var(--divider-color); }
        .acc-head {
          display:flex;align-items:center;gap:10px;padding:14px 16px;cursor:pointer;
          user-select:none;font-size:14px;font-weight:500;color:var(--primary-text-color);
          background:var(--secondary-background-color);
          transition:background 0.2s;
        }
        .acc-head:hover { background:var(--divider-color); }
        .acc-arrow { margin-left:auto;font-size:14px;color:var(--secondary-text-color); }
        .acc-body { padding:12px 14px;border-top:1px solid var(--divider-color);background:var(--card-background-color,#fff); }
        .row { display:flex;flex-direction:column;margin-bottom:12px; }
        .row:last-child { margin-bottom:0; }
        .row label { font-size:12px;color:var(--secondary-text-color);margin-bottom:4px;font-weight:600; }
        ha-entity-picker { display:block;width:100%; }
        .lang-grid { display:flex;flex-wrap:wrap;gap:6px; }
        .lang-btn {
          display:flex;align-items:center;gap:5px;padding:7px 10px;border-radius:8px;
          border:1.5px solid var(--divider-color);background:var(--secondary-background-color);
          cursor:pointer;font-size:12px;color:var(--primary-text-color);transition:all .2s;
        }
        .lang-btn:hover { border-color:var(--primary-color); }
        .lang-btn.on { border-color:var(--primary-color);background:rgba(3,169,244,.12);color:var(--primary-color);font-weight:700; }
        .txt-inp {
          background:var(--input-fill-color,rgba(0,0,0,.04));border:1px solid var(--divider-color);
          border-radius:8px;padding:8px 12px;font-size:13px;color:var(--primary-text-color);
          width:100%;box-sizing:border-box;font-family:inherit;
        }
        .txt-inp:focus { outline:none;border-color:var(--primary-color); }
        .bg-grid { display:grid;grid-template-columns:repeat(4,1fr);gap:5px;margin-bottom:10px; }
        .bgs {
          border-radius:7px;height:38px;cursor:pointer;border:2px solid transparent;
          display:flex;align-items:flex-end;padding:3px 5px;font-size:9px;
          color:rgba(255,255,255,.85);text-shadow:0 1px 3px rgba(0,0,0,.9);
          transition:border-color .15s;white-space:nowrap;overflow:hidden;
        }
        .bgs:hover { transform:scale(1.02); }
        .bgs.on { border-color:var(--primary-color);box-shadow:0 0 0 2px rgba(3,169,244,.3); }
        .sl-row { display:flex;align-items:center;gap:10px;margin-top:8px; }
        .sl-row label { font-size:12px;font-weight:600;color:var(--secondary-text-color);min-width:80px; }
        .sl-row input[type=range] { flex:1;accent-color:var(--primary-color);height:4px;cursor:pointer; }
        .slv { font-size:12px;font-weight:700;color:var(--primary-color);min-width:36px;text-align:right; }
        .ci { border:1px solid var(--divider-color);border-radius:8px;overflow:hidden;margin-bottom:8px; }
        .ci:last-child { margin-bottom:0; }
        .ci-hdr { display:flex;align-items:center;gap:10px;padding:10px 12px;cursor:pointer;background:var(--card-background-color,#fff);transition:background 0.2s; }
        .ci-hdr:hover { background:var(--secondary-background-color); }
        .ci-swatch { width:24px;height:24px;border-radius:4px;border:1px solid rgba(0,0,0,.1);flex-shrink:0; }
        .ci-label { font-size:13px;flex:1;color:var(--primary-text-color); }
        .ci-code { font-size:11px;color:var(--secondary-text-color);font-family:monospace;background:var(--secondary-background-color);padding:2px 6px;border-radius:3px;max-width:120px;overflow:hidden;text-overflow:ellipsis; }
        .ci-chv { color:var(--secondary-text-color);flex-shrink:0; }
        .ci-body { padding:12px 14px;background:var(--secondary-background-color);border-top:1px solid var(--divider-color);display:flex;flex-direction:column;gap:10px; }
        .ci-native { width:100%;height:44px;border:1px solid var(--divider-color);border-radius:6px;cursor:pointer;padding:2px;background:transparent; }
        .ci-hex-wrap { display:flex;align-items:center;gap:6px;border:1px solid var(--divider-color);border-radius:4px;padding:6px 10px;background:var(--card-background-color,#fff); }
        .ci-hash { color:var(--secondary-text-color);font-size:12px;font-family:monospace; }
        .ci-hex-inp { border:none;outline:none;width:100%;font-size:14px;color:var(--primary-text-color);font-family:monospace;background:transparent; }
        .ci-swatches { display:flex;gap:6px;flex-wrap:wrap; }
        .ci-dot { width:24px;height:24px;border-radius:50%;cursor:pointer;transition:transform .1s;outline-offset:2px; }
        .ci-dot:hover { transform:scale(1.15); }
        .disp-row { display:flex;align-items:center;gap:10px;padding:8px 0;border-bottom:1px solid var(--divider-color); }
        .disp-row:last-child { border-bottom:none; }
        .disp-info { flex:1;min-width:0; }
        .disp-label { font-size:13px;font-weight:500;color:var(--primary-text-color); }
        .disp-desc { font-size:11px;color:var(--secondary-text-color);margin-top:2px; }
        .tog-wrap { position:relative;width:40px;height:22px;flex-shrink:0;cursor:pointer; }
        .tog-wrap input { opacity:0;width:0;height:0;position:absolute; }
        .tog-slider { position:absolute;inset:0;border-radius:11px;background:var(--divider-color);transition:background .25s; }
        .tog-slider:before { content:'';position:absolute;width:16px;height:16px;border-radius:50%;left:3px;top:3px;background:#fff;transition:transform .25s;box-shadow:0 1px 3px rgba(0,0,0,.3); }
        .tog-wrap input:checked + .tog-slider { background:var(--primary-color); }
        .tog-wrap input:checked + .tog-slider:before { transform:translateX(18px); }
        .reset-btn {
          width:100%;padding:8px;border-radius:7px;border:1px solid var(--divider-color);
          background:transparent;color:var(--secondary-text-color);font-size:12px;
          cursor:pointer;font-family:inherit;margin-top:10px;transition:all 0.2s;
        }
        .reset-btn:hover { background:var(--secondary-background-color);border-color:var(--primary-color);color:var(--primary-color); }
        .select-grid { display:grid;grid-template-columns:1fr 1fr;gap:6px; }
        .sel-btn {
          padding:8px 6px;border-radius:8px;border:2px solid var(--divider-color);
          cursor:pointer;text-align:center;font-size:11px;font-weight:600;
          background:var(--secondary-background-color);color:var(--primary-text-color);
          transition:all .2s;font-family:inherit;
        }
        .sel-btn:hover { border-color:var(--primary-color); }
        .sel-btn.on { border-color:var(--primary-color);background:rgba(3,169,244,.08);color:var(--primary-color); }
        .sel-btn .sub { font-size:9px;font-weight:400;color:var(--secondary-text-color);display:block;margin-top:2px; }
        .sel-btn.on .sub { color:var(--primary-color);opacity:0.7; }
        .theme-grid { display:flex;gap:8px;margin-bottom:12px; }
        .theme-btn {
          flex:1;padding:10px;border-radius:10px;border:2px solid var(--divider-color);
          cursor:pointer;text-align:center;font-size:13px;font-weight:500;
          background:var(--secondary-background-color);color:var(--primary-text-color);
          transition:all .2s;font-family:inherit;
        }
        .theme-btn.on { border-color:var(--primary-color);background:rgba(3,169,244,.08);color:var(--primary-color); }
        .theme-btn .sub { font-size:10px;font-weight:400;color:var(--secondary-text-color);display:block;margin-top:2px; }
        .theme-btn.on .sub { color:var(--primary-color);opacity:0.7; }
        .mode-grid { display:flex;gap:8px;margin-bottom:12px; }
        .mode-btn {
          flex:1;padding:10px;border-radius:10px;border:2px solid var(--divider-color);
          cursor:pointer;text-align:center;font-size:13px;font-weight:500;
          background:var(--secondary-background-color);color:var(--primary-text-color);
          transition:all .2s;font-family:inherit;
        }
        .mode-btn.on { border-color:var(--primary-color);background:rgba(3,169,244,.08);color:var(--primary-color); }
        .mode-btn .sub { font-size:10px;font-weight:400;color:var(--secondary-text-color);display:block;margin-top:2px; }
        .mode-btn.on .sub { color:var(--primary-color);opacity:0.7; }
        .controls-pos-grid { display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-top:8px; }
        .controls-pos-btn {
          padding:8px 6px;border-radius:8px;border:2px solid var(--divider-color);
          cursor:pointer;text-align:center;font-size:11px;font-weight:600;
          background:var(--secondary-background-color);color:var(--primary-text-color);
          transition:all .2s;font-family:inherit;
        }
        .controls-pos-btn:hover { border-color:var(--primary-color); }
        .controls-pos-btn.on { border-color:var(--primary-color);background:rgba(3,169,244,.08);color:var(--primary-color); }
        .controls-pos-btn .sub { font-size:9px;font-weight:400;color:var(--secondary-text-color);display:block;margin-top:2px; }
        .controls-pos-btn.on .sub { color:var(--primary-color);opacity:0.7; }
        .color-blind-row {
          display:flex;gap:8px;align-items:center;margin-top:4px;
        }
        .color-blind-row input[type="color"] {
          width:44px;height:44px;border-radius:8px;border:1px solid var(--divider-color);
          cursor:pointer;padding:2px;background:transparent;
        }
        .color-blind-row input[type="text"] {
          flex:1;
        }
        .color-blind-alpha {
          display:flex;align-items:center;gap:10px;margin-top:6px;
        }
        .color-blind-alpha label {
          font-size:11px;font-weight:600;color:var(--secondary-text-color);
          min-width:80px;
        }
        .color-blind-alpha input[type="range"] {
          flex:1;accent-color:var(--primary-color);height:4px;cursor:pointer;
        }
        .color-blind-alpha .alpha-value {
          font-size:12px;font-weight:700;color:var(--primary-color);min-width:36px;text-align:right;
        }
        .dual-entities {
          display:${mode === 'dual' ? 'block' : 'none'};
          border-top:1px solid var(--divider-color);
          padding-top:12px;
          margin-top:12px;
        }
        .dual-info {
          font-size:11px;color:var(--secondary-text-color);margin-bottom:8px;
          padding:8px 12px;background:var(--secondary-background-color);border-radius:6px;
        }
        .memory-options {
          display:${noFeedback ? 'block' : 'none'};
          margin-top:8px;
        }
        .style-grid {
          display:grid;
          grid-template-columns:1fr 1fr;
          gap:6px;
          margin-top:6px;
        }
        .style-btn {
          padding:6px 8px;
          border-radius:6px;
          border:2px solid var(--divider-color);
          cursor:pointer;
          text-align:center;
          font-size:11px;
          font-weight:500;
          background:var(--secondary-background-color);
          color:var(--primary-text-color);
          transition:all .2s;
          font-family:inherit;
        }
        .style-btn:hover { border-color:var(--primary-color); }
        .style-btn.on { border-color:var(--primary-color);background:rgba(3,169,244,.08);color:var(--primary-color); }
        .tilt-entity-row {
          margin-top:8px;
          padding:8px 12px;
          background:var(--secondary-background-color);
          border-radius:6px;
          border-left:3px solid var(--primary-color);
        }
        .tilt-entity-row .row {
          margin-bottom:8px;
        }
        .tilt-entity-row .row:last-child {
          margin-bottom:0;
        }
      </style>

      <div class="editor">
        <div class="credit">🪟 <strong>Shutter Card</strong>
          <span style="color:var(--secondary-text-color);font-weight:400;">v1.2.2 — Исправлен сброс tilt и обновление ламелей</span>
        </div>

        <!-- Language -->
        <div class="acc-wrap">
          <div class="acc-head" id="head-lang">
            <span>${t.edLang || 'Язык'}</span>
            <span class="acc-arrow" id="arrow-lang">${this._open.lang ? '▾' : '▸'}</span>
          </div>
          <div class="acc-body" id="body-lang" style="display:${this._open.lang ? 'block' : 'none'}">
            <div class="lang-grid">
              ${Object.entries(SHUTTER_TRANSLATIONS).map(([code, tr]) => `
                <div class="lang-btn ${lang === code ? 'on' : ''}" data-lang="${code}">
                  <img src="https://flagcdn.com/20x15/${tr.flag}.png" width="20" height="15" alt="${tr.lang}" style="border-radius:2px;flex-shrink:0;display:block;">
                  ${tr.lang}
                </div>
              `).join('')}
            </div>
          </div>
        </div>

        <!-- Title & Theme -->
        <div class="acc-wrap">
          <div class="acc-head" id="head-title">
            <span>${t.edTitle || 'Название'}</span>
            <span class="acc-arrow" id="arrow-title">${this._open.title ? '▾' : '▸'}</span>
          </div>
          <div class="acc-body" id="body-title" style="display:${this._open.title ? 'block' : 'none'}">
            <div class="row">
              <label>${t.edTitleLabel || 'Название карточки'}</label>
              <input class="txt-inp" type="text" id="inp-title" value="${cfg.title || ''}" placeholder=""/>
            </div>
            <div class="row">
              <label>${t.edSubtitleLabel || 'Подзаголовок'}</label>
              <input class="txt-inp" type="text" id="inp-subtitle" value="${cfg.subtitle || ''}" placeholder=""/>
            </div>
            <div class="row">
              <label>${t.edOwnerName || 'Имя владельца'}</label>
              <input class="txt-inp" type="text" id="inp-owner" value="${cfg.owner_name || ''}" placeholder="Smart Home"/>
            </div>
            <div style="height:1px;background:var(--divider-color);margin:8px 0;"></div>
            
            <label style="font-size:12px;font-weight:600;color:var(--secondary-text-color);margin-bottom:6px;display:block;">${t.edTheme || 'Тема'}</label>
            <div class="theme-grid">
              <div class="theme-btn ${theme === 'auto' ? 'on' : ''}" data-theme="auto">
                ${t.edThemeAuto || 'Авто'}
                <span class="sub">${t.edThemeDesc || 'Системная'}</span>
              </div>
              <div class="theme-btn ${theme === 'dark' ? 'on' : ''}" data-theme="dark">
                ${t.edThemeDark || 'Тёмная'}
                <span class="sub">${t.edThemeDesc || ''}</span>
              </div>
              <div class="theme-btn ${theme === 'light' ? 'on' : ''}" data-theme="light">
                ${t.edThemeLight || 'Светлая'}
                <span class="sub">${t.edThemeDesc || ''}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Mode & Entities -->
        <div class="acc-wrap">
          <div class="acc-head" id="head-entities">
            <span>${t.edEntities || 'Сущности'}</span>
            <span class="acc-arrow" id="arrow-entities">${this._open.entities ? '▾' : '▸'}</span>
          </div>
          <div class="acc-body" id="body-entities" style="display:${this._open.entities ? 'block' : 'none'}">
            <label style="font-size:12px;font-weight:600;color:var(--secondary-text-color);margin-bottom:6px;display:block;">${t.edMode || 'Режим'}</label>
            <div class="mode-grid">
              <div class="mode-btn ${mode === 'single' ? 'on' : ''}" data-mode="single">
                ${t.edModeSingle || 'Одно'}
                <span class="sub">${t.edModeSingleSub || 'Одна шторка'}</span>
              </div>
              <div class="mode-btn ${mode === 'dual' ? 'on' : ''}" data-mode="dual">
                ${t.edModeDual || 'Два'}
                <span class="sub">${t.edModeDualSub || 'Левая + Правая'}</span>
              </div>
            </div>

            <div class="${mode === 'single' ? '' : 'dual-entities'}">
              ${this._entityField('entity_id', t.edEntity || 'Сущность жалюзи', 'cover')}
              <div class="row">
                <label>Цвет шторки (RGBA)</label>
                <div class="color-blind-row">
                  <input type="color" id="color-blind-picker" value="#1a1a2e" />
                  <input class="txt-inp" type="text" id="color-blind-text" 
                    value="${cfg.color_blind || 'rgba(26, 26, 46, 0.85)'}" 
                    placeholder="rgba(26, 26, 46, 0.85)" />
                </div>
                <div class="color-blind-alpha">
                  <label>Прозрачность:</label>
                  <input type="range" id="color-blind-alpha" min="0" max="100" step="1" 
                    value="${parseFloat((cfg.color_blind || 'rgba(26,26,46,0.85)').match(/[\d.]+(?=\))/)?.[0] || 0.85) * 100}" />
                  <span class="alpha-value" id="color-blind-alpha-label">
                    ${Math.round(parseFloat((cfg.color_blind || 'rgba(26,26,46,0.85)').match(/[\d.]+(?=\))/)?.[0] || 0.85) * 100)}%
                  </span>
                </div>
              </div>
              <div class="tilt-entity-row">
                <div style="font-size:11px;font-weight:600;color:var(--secondary-text-color);margin-bottom:6px;">↕ Наклон ламелей</div>
                ${this._entityField('tilt_entity_id', 'Сущность наклона (опционально)', 'cover')}
                <div style="font-size:10px;color:var(--secondary-text-color);margin-top:2px;">Если не указана, используется основная сущность</div>
              </div>
            </div>

            <div class="dual-entities" id="dual-entities">
              <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">
                <div>
                  ${this._entityField('left_entity_id', 'Сущность (левая)', 'cover')}
                  <div class="row">
                    <label>Цвет шторки (левая)</label>
                    <div class="color-blind-row">
                      <input type="color" id="left-color-blind-picker" value="#1a1a2e" />
                      <input class="txt-inp" type="text" id="left-color-blind-text" 
                        value="${cfg.left_color_blind || 'rgba(26, 26, 46, 0.85)'}" 
                        placeholder="rgba(26, 26, 46, 0.85)" />
                    </div>
                    <div class="color-blind-alpha">
                      <label>Прозрачность:</label>
                      <input type="range" id="left-color-blind-alpha" min="0" max="100" step="1" 
                        value="${parseFloat((cfg.left_color_blind || 'rgba(26,26,46,0.85)').match(/[\d.]+(?=\))/)?.[0] || 0.85) * 100}" />
                      <span class="alpha-value" id="left-color-blind-alpha-label">
                        ${Math.round(parseFloat((cfg.left_color_blind || 'rgba(26,26,46,0.85)').match(/[\d.]+(?=\))/)?.[0] || 0.85) * 100)}%
                      </span>
                    </div>
                  </div>
                  <div class="tilt-entity-row">
                    ${this._entityField('tilt_entity_left', 'Наклон (левая)', 'cover')}
                  </div>
                </div>
                <div>
                  ${this._entityField('right_entity_id', 'Сущность (правая)', 'cover')}
                  <div class="row">
                    <label>Цвет шторки (правая)</label>
                    <div class="color-blind-row">
                      <input type="color" id="right-color-blind-picker" value="#1a1a2e" />
                      <input class="txt-inp" type="text" id="right-color-blind-text" 
                        value="${cfg.right_color_blind || 'rgba(26, 26, 46, 0.85)'}" 
                        placeholder="rgba(26, 26, 46, 0.85)" />
                    </div>
                    <div class="color-blind-alpha">
                      <label>Прозрачность:</label>
                      <input type="range" id="right-color-blind-alpha" min="0" max="100" step="1" 
                        value="${parseFloat((cfg.right_color_blind || 'rgba(26,26,46,0.85)').match(/[\d.]+(?=\))/)?.[0] || 0.85) * 100}" />
                      <span class="alpha-value" id="right-color-blind-alpha-label">
                        ${Math.round(parseFloat((cfg.right_color_blind || 'rgba(26,26,46,0.85)').match(/[\d.]+(?=\))/)?.[0] || 0.85) * 100)}%
                      </span>
                    </div>
                  </div>
                  <div class="tilt-entity-row">
                    ${this._entityField('tilt_entity_right', 'Наклон (правая)', 'cover')}
                  </div>
                </div>
              </div>
            </div>

            <div style="height:1px;background:var(--divider-color);margin:12px 0;"></div>
            ${this._entityField('camera_entity', 'Камера', 'camera')}
            ${this._entityField('motion_entity', 'Датчик движения', 'binary_sensor')}
            ${this._entityField('recording_entity', 'Статус записи', 'binary_sensor')}
          </div>
        </div>

        <!-- Tilt Settings -->
        <div class="acc-wrap">
          <div class="acc-head" id="head-tilt">
            <span>↕ Наклон ламелей</span>
            <span class="acc-arrow" id="arrow-tilt">${this._open.tilt ? '▾' : '▸'}</span>
          </div>
          <div class="acc-body" id="body-tilt" style="display:${this._open.tilt ? 'block' : 'none'}">
            ${this._toggleSwitch('show_tilt_visual', 'Включить наклон ламелей', 'Выключено — ламели всегда в положении 50% (закрыты)')}
            ${this._toggleSwitch('show_tilt_controls', 'Показать кнопки наклона', 'Кнопки ↕ ⟳ под шторкой (только если наклон включён)')}
          </div>
        </div>

        <!-- Camera Settings -->
        <div class="acc-wrap">
          <div class="acc-head" id="head-camera">
            <span>${t.edCamera || 'Камера'}</span>
            <span class="acc-arrow" id="arrow-camera">${this._open.camera ? '▾' : '▸'}</span>
          </div>
          <div class="acc-body" id="body-camera" style="display:${this._open.camera ? 'block' : 'none'}">
            ${this._toggleSwitch('show_camera', 'Показать камеру', 'Отображать камеру на карточке')}

            <div style="font-size:11px;font-weight:700;color:var(--secondary-text-color);margin:10px 0 6px;">${t.edCameraSize || 'Размер камеры'}</div>
            <div class="select-grid">
              ${['small', 'medium', 'large'].map(size => `
                <div class="sel-btn ${(cfg.camera_size || 'medium') === size ? 'on' : ''}" data-cam-size="${size}">
                  ${t[`edCameraSize${size.charAt(0).toUpperCase() + size.slice(1)}`] || size}
                </div>
              `).join('')}
            </div>

            <div class="row" style="margin-top:12px;">
              <label>${t.edRefreshInterval || 'Интервал обновления'}</label>
              <div style="display:flex;align-items:center;gap:10px;">
                <input class="txt-inp" type="number" id="inp-refresh-interval" 
                  min="10" max="3600" step="10" 
                  value="${refreshInterval}" 
                  style="width:100px;text-align:center;"/>
                <span style="font-size:12px;color:var(--secondary-text-color);">сек</span>
                <span style="font-size:10px;color:var(--secondary-text-color);opacity:0.6;">(мин: ${Math.round(refreshInterval/60)})</span>
              </div>
              <div style="font-size:11px;color:var(--secondary-text-color);margin-top:4px;">${t.edRefreshIntervalDesc || 'Как часто обновлять кадр камеры (сек)'}</div>
            </div>
          </div>
        </div>

        <!-- Overlay Settings -->
        <div class="acc-wrap">
          <div class="acc-head" id="head-overlay">
            <span>Оверлей</span>
            <span class="acc-arrow" id="arrow-overlay">${this._open.overlay ? '▾' : '▸'}</span>
          </div>
          <div class="acc-body" id="body-overlay" style="display:${this._open.overlay ? 'block' : 'none'}">
            <div style="font-size:11px;color:var(--secondary-text-color);margin-bottom:8px;">Настройки отображения поверх видео</div>
            ${this._toggleSwitch('camera_show_timestamp', 'Показывать время', 'Отображать текущее время на видео')}
            ${this._toggleSwitch('camera_show_motion', 'Индикатор движения', 'Показывать статус датчика движения')}
            ${this._toggleSwitch('camera_show_recording', 'Индикатор записи', 'Показывать статус записи')}
          </div>
        </div>

        <!-- Display -->
        <div class="acc-wrap">
          <div class="acc-head" id="head-display">
            <span>${t.edDisplay || 'Отображение'}</span>
            <span class="acc-arrow" id="arrow-display">${this._open.display ? '▾' : '▸'}</span>
          </div>
          <div class="acc-body" id="body-display" style="display:${this._open.display ? 'block' : 'none'}">
            ${mode === 'single' ? `
              <div style="font-size:11px;font-weight:700;color:var(--secondary-text-color);margin-bottom:6px;">Расположение кнопок управления</div>
              <div class="controls-pos-grid">
                ${[
                  { id: 'bottom', label: '⬇️ Снизу', sub: 'Горизонтально' },
                  { id: 'top', label: '⬆️ Сверху', sub: 'Горизонтально' },
                  { id: 'left', label: '⬅️ Слева', sub: 'Вертикально' },
                  { id: 'right', label: '➡️ Справа', sub: 'Вертикально' },
                ].map(p => `
                  <div class="controls-pos-btn ${controlsPos === p.id ? 'on' : ''}" data-controls-pos="${p.id}">
                    ${p.label}
                    <span class="sub">${p.sub}</span>
                  </div>
                `).join('')}
              </div>
            ` : `
              <div class="dual-info">
                📌 В режиме "Два" кнопки управления расположены:<br>
                ⬅️ Слева — для левой шторки<br>
                ➡️ Справа — для правой шторки
              </div>
            `}

            <div style="height:1px;background:var(--divider-color);margin:12px 0;"></div>

            ${this._toggleSwitch('show_greet', 'Приветствие', 'Показать приветствие по времени суток')}
            ${this._toggleSwitch('show_position', 'Показать позицию', '')}
            ${this._toggleSwitch('show_controls', 'Показать управление', '')}
            ${this._toggleSwitch('show_status', 'Показать статус', '')}
            ${this._toggleSwitch('invert_position', 'Инвертировать позицию', 'Инвертировать значение позиции (100% = закрыто)')}
          </div>
        </div>

        <!-- Advanced Settings -->
        <div class="acc-wrap">
          <div class="acc-head" id="head-advanced">
            <span>⚙️ Расширенные настройки</span>
            <span class="acc-arrow" id="arrow-advanced">${this._open.advanced ? '▾' : '▸'}</span>
          </div>
          <div class="acc-body" id="body-advanced" style="display:${this._open.advanced ? 'block' : 'none'}">
            
            <div style="font-size:12px;font-weight:700;color:var(--secondary-text-color);margin-bottom:6px;">📊 Шкала прогресса</div>
            ${this._toggleSwitch('show_progress_bar', 'Показать шкалу прогресса', 'Отображать анимированную шкалу под шторкой')}
            
            <div style="font-size:11px;font-weight:600;color:var(--secondary-text-color);margin:8px 0 4px;">Стиль шкалы</div>
            <div class="style-grid">
              <div class="style-btn ${progressStyle === 'gradient' ? 'on' : ''}" data-progress-style="gradient">🌈 Градиент</div>
              <div class="style-btn ${progressStyle === 'solid' ? 'on' : ''}" data-progress-style="solid">⬛ Сплошной</div>
            </div>

            <div style="height:1px;background:var(--divider-color);margin:12px 0;"></div>

            <div style="font-size:12px;font-weight:700;color:var(--secondary-text-color);margin-bottom:6px;">📡 Режим без обратной связи</div>
            ${this._toggleSwitch('no_feedback', 'Включить режим без ОС', 'Для устройств без датчика положения')}
            
            <div class="memory-options" id="memory-options">
              <div style="font-size:11px;font-weight:600;color:var(--secondary-text-color);margin:8px 0 4px;">Способ хранения позиции</div>
              <div class="style-grid">
                <div class="style-btn ${memoryType === 'localstorage' ? 'on' : ''}" data-memory-type="localstorage">💾 localStorage</div>
                <div class="style-btn ${memoryType === 'input_number' ? 'on' : ''}" data-memory-type="input_number">📝 input_number</div>
              </div>
              
              <div id="input-number-fields" style="display:${memoryType === 'input_number' ? 'block' : 'none'};margin-top:8px;">
                ${mode === 'single' ? `
                  ${this._entityField('input_number_entity', 'Input number для хранения позиции', 'input_number')}
                ` : `
                  ${this._entityField('left_input_number', 'Input number (левая)', 'input_number')}
                  ${this._entityField('right_input_number', 'Input number (правая)', 'input_number')}
                `}
              </div>
            </div>
          </div>
        </div>

        <!-- Colors -->
        <div class="acc-wrap">
          <div class="acc-head" id="head-colors">
            <span>${t.edColors || 'Цвета'}</span>
            <span class="acc-arrow" id="arrow-colors">${this._open.colors ? '▾' : '▸'}</span>
          </div>
          <div class="acc-body" id="body-colors" style="display:${this._open.colors ? 'block' : 'none'}">
            ${this._colorRow('color_open', 'Цвет открыто')}
            ${this._colorRow('color_closed', 'Цвет закрыто')}
            ${this._colorRow('color_accent', 'Акцентный цвет')}
            ${this._colorRow('color_text', 'Цвет текста')}
            <button class="reset-btn" id="btn-reset-colors">↩ Сбросить цвета</button>
          </div>
        </div>

        <!-- Background -->
        <div class="acc-wrap">
          <div class="acc-head" id="head-bg">
            <span>${t.edBg || 'Фон для шторки'}</span>
            <span class="acc-arrow" id="arrow-bg">${this._open.bg ? '▾' : '▸'}</span>
          </div>
          <div class="acc-body" id="body-bg" style="display:${this._open.bg ? 'block' : 'none'}">
            <div class="row">
              <label>URL фонового изображения (под шторкой)</label>
              <input class="txt-inp" type="text" id="inp-bg-image" 
                value="${cfg.bg_image || ''}" 
                placeholder="https://example.com/background.jpg или /local/image.jpg"/>
              <div style="font-size:10px;color:var(--secondary-text-color);margin-top:4px;">
                Изображение будет показано как фон под шторкой, только когда камера выключена.
              </div>
            </div>

            <div style="height:1px;background:var(--divider-color);margin:12px 0;"></div>

            <div style="font-size:11px;font-weight:700;color:var(--secondary-text-color);margin-bottom:8px;">${t.edBgPresets || 'Пресет градиента'}</div>
            <div class="bg-grid">
              ${SHUTTER_BG_PRESETS.map(p => {
                const c1 = p.c1 || '#888', c2 = p.c2 || '#444';
                const isC = p.id === 'custom';
                return `<div class="bgs ${bgP === p.id ? 'on' : ''}" data-bg="${p.id}"
                  style="${isC ? 'background:linear-gradient(135deg,#e0e0e0,#bdbdbd);color:#555;text-shadow:none;' : 'background:linear-gradient(135deg,' + c1 + 'cc 0%,' + c2 + '55 100%);'}">${p.label}</div>`;
              }).join('')}
            </div>
            ${bgP === 'custom' ? `
              <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:8px;">
                ${this._colorRow('bg_color1', 'Цвет 1')}
                ${this._colorRow('bg_color2', 'Цвет 2')}
              </div>
            ` : ''}
            <div class="sl-row">
              <label>${t.edBgAlpha || 'Прозрачность'}</label>
              <input type="range" id="inp-bg-alpha" min="0" max="100" step="1" value="${cfg.bg_alpha !== undefined ? cfg.bg_alpha : 85}"/>
              <span class="slv" id="bg-alpha-lbl">${cfg.bg_alpha !== undefined ? cfg.bg_alpha : 85}%</span>
            </div>
            <div class="sl-row" style="margin-top:4px;">
              <label>${t.edBgBlur || 'Размытие'}</label>
              <input type="range" id="inp-bg-blur" min="0" max="30" step="1" value="${cfg.bg_blur !== undefined ? cfg.bg_blur : 12}"/>
              <span class="slv" id="bg-blur-lbl">${cfg.bg_blur !== undefined ? cfg.bg_blur : 12}px</span>
            </div>
          </div>
        </div>
      </div>
    `;

    this._bindEvents();
    setTimeout(() => this._syncPickers(), 200);
  }

  _bindEvents() {
    const sr = this.shadowRoot;

    ['lang', 'title', 'entities', 'camera', 'overlay', 'display', 'colors', 'bg', 'advanced', 'tilt'].forEach(id => {
      const hdr = sr.getElementById('head-' + id);
      if (hdr) hdr.addEventListener('click', () => this._toggleSection(id));
    });

    sr.querySelectorAll('[data-lang]').forEach(btn =>
      btn.addEventListener('click', () => {
        this._config.language = btn.dataset.lang;
        this._fire();
        this._render();
      }));

    sr.querySelectorAll('[data-theme]').forEach(btn =>
      btn.addEventListener('click', () => {
        this._config.theme = btn.dataset.theme;
        this._fire();
        this._render();
      }));

    sr.querySelectorAll('[data-mode]').forEach(btn =>
      btn.addEventListener('click', () => {
        this._config.mode = btn.dataset.mode;
        this._fire();
        this._render();
      }));

    sr.querySelectorAll('[data-cam-size]').forEach(btn =>
      btn.addEventListener('click', () => {
        this._config.camera_size = btn.dataset.camSize;
        this._fire();
        this._render();
      }));

    sr.querySelectorAll('[data-controls-pos]').forEach(btn =>
      btn.addEventListener('click', () => {
        this._config.controls_position = btn.dataset.controlsPos;
        this._fire();
        this._render();
      }));

    sr.querySelectorAll('[data-progress-style]').forEach(btn =>
      btn.addEventListener('click', () => {
        this._config.progress_bar_style = btn.dataset.progressStyle;
        this._fire();
        this._render();
      }));

    sr.querySelectorAll('[data-memory-type]').forEach(btn =>
      btn.addEventListener('click', () => {
        this._config.memory_type = btn.dataset.memoryType;
        this._fire();
        this._render();
      }));

    const wireText = (id, key) => {
      const el = sr.getElementById(id);
      if (!el) return;
      el.addEventListener('change', () => {
        this._config[key] = el.value.trim();
        this._fire();
      });
      el.addEventListener('blur', () => {
        this._config[key] = el.value.trim();
        this._fire();
      });
      el.addEventListener('input', () => {
        this._config[key] = el.value.trim();
      });
    };
    wireText('inp-title', 'title');
    wireText('inp-subtitle', 'subtitle');
    wireText('inp-owner', 'owner_name');

    const bindColorPicker = (pickerId, textId, alphaId, alphaLabelId, configKey) => {
      const picker = sr.getElementById(pickerId);
      const text = sr.getElementById(textId);
      const alphaSlider = sr.getElementById(alphaId);
      const alphaLabel = sr.getElementById(alphaLabelId);
      
      if (picker && text && alphaSlider && alphaLabel) {
        const getHexFromRgba = (rgba) => {
          if (!rgba) return '#1a1a2e';
          const match = rgba.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
          if (match) {
            return '#' + [match[1], match[2], match[3]].map(x => parseInt(x).toString(16).padStart(2, '0')).join('');
          }
          if (rgba.startsWith('#')) return rgba;
          return '#1a1a2e';
        };
        
        const getAlphaFromRgba = (rgba) => {
          if (!rgba) return 0.85;
          const match = rgba.match(/[\d.]+(?=\))/);
          return match ? parseFloat(match[0]) : 0.85;
        };
        
        const currentValue = this._config[configKey] || 'rgba(26, 26, 46, 0.85)';
        picker.value = getHexFromRgba(currentValue);
        text.value = currentValue;
        const currentAlpha = getAlphaFromRgba(currentValue);
        alphaSlider.value = Math.round(currentAlpha * 100);
        alphaLabel.textContent = Math.round(currentAlpha * 100) + '%';
        
        picker.addEventListener('input', () => {
          const alpha = parseFloat(alphaSlider.value) / 100;
          const hex = picker.value;
          const rgba = `rgba(${parseInt(hex.slice(1,3), 16)}, ${parseInt(hex.slice(3,5), 16)}, ${parseInt(hex.slice(5,7), 16)}, ${alpha})`;
          text.value = rgba;
          this._config[configKey] = rgba;
        });
        
        picker.addEventListener('change', () => {
          const alpha = parseFloat(alphaSlider.value) / 100;
          const hex = picker.value;
          const rgba = `rgba(${parseInt(hex.slice(1,3), 16)}, ${parseInt(hex.slice(3,5), 16)}, ${parseInt(hex.slice(5,7), 16)}, ${alpha})`;
          text.value = rgba;
          this._config[configKey] = rgba;
          this._fire();
        });
        
        alphaSlider.addEventListener('input', () => {
          const alpha = parseFloat(alphaSlider.value) / 100;
          const hex = picker.value;
          const rgba = `rgba(${parseInt(hex.slice(1,3), 16)}, ${parseInt(hex.slice(3,5), 16)}, ${parseInt(hex.slice(5,7), 16)}, ${alpha})`;
          text.value = rgba;
          this._config[configKey] = rgba;
          alphaLabel.textContent = Math.round(alpha * 100) + '%';
        });
        
        alphaSlider.addEventListener('change', () => {
          const alpha = parseFloat(alphaSlider.value) / 100;
          const hex = picker.value;
          const rgba = `rgba(${parseInt(hex.slice(1,3), 16)}, ${parseInt(hex.slice(3,5), 16)}, ${parseInt(hex.slice(5,7), 16)}, ${alpha})`;
          text.value = rgba;
          this._config[configKey] = rgba;
          alphaLabel.textContent = Math.round(alpha * 100) + '%';
          this._fire();
        });
        
        text.addEventListener('change', () => {
          const val = text.value.trim();
          if (val) {
            this._config[configKey] = val;
            if (val.startsWith('#')) {
              picker.value = val;
            }
            const alpha = getAlphaFromRgba(val);
            alphaSlider.value = Math.round(alpha * 100);
            alphaLabel.textContent = Math.round(alpha * 100) + '%';
            this._fire();
          }
        });
        
        text.addEventListener('input', () => {
          const val = text.value.trim();
          if (val && val.startsWith('#')) {
            picker.value = val;
          }
        });
      }
    };

    bindColorPicker('color-blind-picker', 'color-blind-text', 'color-blind-alpha', 'color-blind-alpha-label', 'color_blind');
    bindColorPicker('left-color-blind-picker', 'left-color-blind-text', 'left-color-blind-alpha', 'left-color-blind-alpha-label', 'left_color_blind');
    bindColorPicker('right-color-blind-picker', 'right-color-blind-text', 'right-color-blind-alpha', 'right-color-blind-alpha-label', 'right_color_blind');

    const refreshInterval = sr.getElementById('inp-refresh-interval');
    if (refreshInterval) {
      refreshInterval.addEventListener('change', () => {
        const val = parseInt(refreshInterval.value) || 300;
        this._config.camera_refresh_interval = Math.max(10, Math.min(3600, val));
        const minSpan = refreshInterval.parentElement?.querySelector('span:last-child');
        if (minSpan) {
          minSpan.textContent = `(мин: ${Math.round(this._config.camera_refresh_interval/60)})`;
        }
        this._fire();
      });
    }

    sr.querySelectorAll('[data-bg]').forEach(tile =>
      tile.addEventListener('click', () => {
        this._config.background_preset = tile.dataset.bg;
        this._fire();
        this._render();
      }));

    const bgAlphaSlider = sr.getElementById('inp-bg-alpha');
    if (bgAlphaSlider) {
      const lbl = sr.getElementById('bg-alpha-lbl');
      bgAlphaSlider.addEventListener('input', () => {
        if (lbl) lbl.textContent = bgAlphaSlider.value + '%';
        this._config.bg_alpha = parseInt(bgAlphaSlider.value);
      });
      bgAlphaSlider.addEventListener('change', () => {
        this._fire();
      });
    }

    const blurSlider = sr.getElementById('inp-bg-blur');
    if (blurSlider) {
      const lbl = sr.getElementById('bg-blur-lbl');
      blurSlider.addEventListener('input', () => {
        if (lbl) lbl.textContent = blurSlider.value + 'px';
        this._config.bg_blur = parseInt(blurSlider.value);
      });
      blurSlider.addEventListener('change', () => {
        this._fire();
      });
    }

    const bgImageInput = sr.getElementById('inp-bg-image');
    if (bgImageInput) {
      bgImageInput.addEventListener('change', () => {
        this._config.bg_image = bgImageInput.value.trim();
        this._fire();
      });
      bgImageInput.addEventListener('blur', () => {
        this._config.bg_image = bgImageInput.value.trim();
        this._fire();
      });
      bgImageInput.addEventListener('input', () => {
        this._config.bg_image = bgImageInput.value.trim();
      });
    }

    sr.querySelectorAll('[data-cp]').forEach(hdr =>
      hdr.addEventListener('click', () => {
        this._picker = this._picker === hdr.dataset.cp ? null : hdr.dataset.cp;
        this._render();
      }));

    sr.querySelectorAll('[data-cp-native]').forEach(inp => {
      inp.addEventListener('input', () => {
        const ci = inp.closest('.ci');
        const sw = ci?.querySelector('.ci-swatch');
        const code = ci?.querySelector('.ci-code');
        const hex = sr.querySelector(`[data-cp-hex="${inp.dataset.cpNative}"]`);
        if (sw) sw.style.background = inp.value;
        if (code) code.textContent = inp.value;
        if (hex) hex.value = inp.value.replace('#', '');
        this._config[inp.dataset.cpNative] = inp.value;
      });
      inp.addEventListener('change', () => {
        this._config[inp.dataset.cpNative] = inp.value;
        this._fire();
        this._render();
      });
    });

    sr.querySelectorAll('[data-cp-hex]').forEach(inp =>
      inp.addEventListener('change', () => {
        const val = '#' + inp.value.replace('#', '');
        if (/^#[0-9a-fA-F]{6}$/.test(val)) {
          this._config[inp.dataset.cpHex] = val;
          this._fire();
          this._render();
        }
      }));

    sr.querySelectorAll('[data-cp-dot]').forEach(dot =>
      dot.addEventListener('click', () => {
        this._config[dot.dataset.cpDot] = dot.dataset.color;
        this._fire();
        this._render();
      }));

    const resetBtn = sr.getElementById('btn-reset-colors');
    if (resetBtn) resetBtn.addEventListener('click', () => {
      ['color_open', 'color_closed', 'color_accent', 'color_text'].forEach(k => delete this._config[k]);
      this._fire();
      this._render();
    });

    sr.querySelectorAll('.disp-tog').forEach(tog =>
      tog.addEventListener('change', () => {
        this._config[tog.dataset.key] = tog.checked;
        this._fire();
        if (tog.dataset.key === 'no_feedback' || tog.dataset.key === 'show_tilt_controls' || tog.dataset.key === 'show_tilt_visual') {
          this._render();
        }
        if (tog.dataset.key === 'show_progress_bar') {
          this._fire();
        }
      }));

    sr.querySelectorAll('ha-entity-picker[data-key]').forEach(picker =>
      picker.addEventListener('value-changed', e => {
        const key = picker.dataset.key;
        const val = e.detail.value;
        const c = { ...this._config };
        if (val) c[key] = val;
        else delete c[key];
        this._config = c;
        this._fire();
      }));
  }
}

// ─── REGISTER ────────────────────────────────────────────────────────────
customElements.define('shutter-card', ShutterCard);
customElements.define('shutter-card-editor', ShutterCardEditor);

window.customCards = window.customCards || [];
window.customCards.push({
  type: 'shutter-card',
  name: 'Shutter Card',
  description: 'Управление жалюзи с 24 ламелями, появляющимися сверху вниз',
  preview: true,
});

console.info(
  '%c 🪟 Shutter Card %c v1.2.2 %c Исправлен сброс tilt и обновление ламелей при перезагрузке!',
  'background:#0a1628;color:#00d4ff;font-weight:700;padding:2px 6px;border-radius:4px 0 0 4px;font-size:12px',
  'background:#00d4ff;color:#0a1628;font-weight:700;padding:2px 6px;border-radius:0 4px 4px 0;font-size:12px',
  'color:#4ade80;font-weight:400;font-size:11px;margin-left:4px'
);