import React, { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Search, X, Plus, Pencil, Trash2, Download, GripVertical } from "lucide-react";
import "./RoutineDashboard.css";

const API_BASE = process.env.REACT_APP_API_URL || "http://localhost:5001/api";
async function apiFetch(path, opts = {}) {
  const token = localStorage.getItem('brightsteps_token');
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    ...opts,
  });
  if (!res.ok) throw new Error(`API ${res.status}: ${await res.text()}`);
  return res.json();
}

const CHILD_NAME = "John";
const BADGES = [
  { id:"first",     emoji:"🌟", label:"First Star",  threshold:1  },
  { id:"five",      emoji:"⭐", label:"5 Stars",      threshold:5  },
  { id:"ten",       emoji:"🔥", label:"10 Stars",     threshold:10 },
  { id:"twenty",    emoji:"💪", label:"20 Stars",     threshold:20 },
  { id:"superstar", emoji:"👑", label:"Superstar",    threshold:50 },
];

const CLS_META = {
  morning: { accent:"var(--rose)",  accentDark:"var(--rose-dk)",  accentBg:"var(--rose-bg)",  iconBg:"var(--rose-bg)"  },
  school:  { accent:"var(--sky)",   accentDark:"var(--sky-dk)",   accentBg:"var(--sky-bg)",   iconBg:"var(--sky-bg)"   },
  bedtime: { accent:"var(--sage)",  accentDark:"var(--sage-dk)",  accentBg:"var(--sage-bg)",  iconBg:"var(--sage-bg)"  },
  custom:  { accent:"var(--lav)",   accentDark:"var(--lav-dk)",   accentBg:"var(--lav-bg)",   iconBg:"var(--lav-bg)"   },
};
const CLS_META_AUTISM = {
  morning: { accent:"var(--lav)",   accentDark:"var(--lav-dk)",   accentBg:"var(--lav-bg)",   iconBg:"var(--lav-bg)"   },
  school:  { accent:"var(--amber)", accentDark:"var(--amber-dk)", accentBg:"var(--amber-bg)", iconBg:"var(--amber-bg)" },
  bedtime: { accent:"var(--sky)",   accentDark:"var(--sky-dk)",   accentBg:"var(--sky-bg)",   iconBg:"var(--sky-bg)"   },
  custom:  { accent:"var(--lav)",   accentDark:"var(--lav-dk)",   accentBg:"var(--lav-bg)",   iconBg:"var(--lav-bg)"   },
};
function getMeta(type, cls) {
  return type==="autism" ? (CLS_META_AUTISM[cls]||CLS_META_AUTISM.custom) : (CLS_META[cls]||CLS_META.custom);
}

const ICON_OPTIONS = ["☀️","🌙","🎒","📚","🌸","🧩","💙","🏃","🎨","🍎","🚿","🎵","💤","🌿","📖"];
const TYPE_OPTIONS = [{ value:"adhd", label:"⚡ ADHD" }, { value:"autism", label:"🧩 Autism" }];
const CLS_OPTIONS  = [{ value:"morning",label:"🌅 Morning" },{ value:"school",label:"🎒 After School" },{ value:"bedtime",label:"🌙 Bedtime" },{ value:"custom",label:"✨ Custom" }];

const DEFAULT_ADHD_ROUTINES = [
  { _id:"adhd-1", cls:"morning", type:"adhd", isDefault:true, emoji:"🌅", iconEmoji:"☀️", title:"ADHD Morning Routine",     goal:"Build independent morning skills",         tags:["Self-Care","Focus","Morning"],  badge:"Daily Must!",   defaultTasks:[{label:"Wake Up with Alarm",mins:2},{label:"Brush Teeth",mins:3},{label:"Wash Face",mins:2},{label:"Get Dressed",mins:5},{label:"Eat Breakfast",mins:10}] },
  { _id:"adhd-2", cls:"school",  type:"adhd", isDefault:true, emoji:"🎒", iconEmoji:"📚", title:"ADHD After School Routine", goal:"Transition smoothly from school to home",  tags:["Homework","Snack","Focus"],    badge:null,            defaultTasks:[{label:"Put away school bag",mins:2},{label:"Healthy snack",mins:10},{label:"Complete homework",mins:30},{label:"Free play time",mins:20}] },
  { _id:"adhd-3", cls:"bedtime", type:"adhd", isDefault:true, emoji:"🌙", iconEmoji:"🌙", title:"ADHD Bedtime Routine",      goal:"Wind down for restful sleep",              tags:["Sleep","Calm","Self-Care"],    badge:"Sweet Dreams!", defaultTasks:[{label:"Take a shower",mins:10},{label:"Put on pyjamas",mins:3},{label:"Read a book",mins:15},{label:"Lights off & sleep",mins:0}] },
];
const DEFAULT_AUTISM_ROUTINES = [
  { _id:"aut-1",  cls:"morning", type:"autism",isDefault:true, emoji:"🌅", iconEmoji:"🌸", title:"Autism Morning Routine",     goal:"Structured morning independence",           tags:["Structure","Self-Care","Morning"],badge:"Daily Must!",   defaultTasks:[{label:"Wake Up with Alarm",mins:2},{label:"Brush Teeth",mins:3},{label:"Wash Face",mins:2},{label:"Get Dressed",mins:5},{label:"Eat Breakfast",mins:10}] },
  { _id:"aut-2",  cls:"school",  type:"autism",isDefault:true, emoji:"🎒", iconEmoji:"🧩", title:"Autism After School Routine",goal:"Predictable transition from school",        tags:["Structure","Sensory","Calm"],   badge:null,            defaultTasks:[{label:"Put away school bag",mins:2},{label:"Sensory break",mins:15},{label:"Healthy snack",mins:10},{label:"Complete homework",mins:30}] },
  { _id:"aut-3",  cls:"bedtime", type:"autism",isDefault:true, emoji:"🌙", iconEmoji:"💙", title:"Autism Bedtime Routine",     goal:"Calm, predictable end to the day",         tags:["Structure","Calm","Sleep"],    badge:"Sweet Dreams!", defaultTasks:[{label:"Warm shower",mins:10},{label:"Put on pyjamas",mins:3},{label:"Quiet activity",mins:15},{label:"Lights off & sleep",mins:0}] },
];

function generateReportPDF({ totalStars, completedRoutines, earnedBadges }) {
  const date = new Date().toLocaleDateString("en-GB",{day:"numeric",month:"long",year:"numeric"});
  const nextBadge = BADGES.find((b) => totalStars < b.threshold);
  const nextTxt   = nextBadge ? `Earn <strong>${nextBadge.threshold - totalStars} more ⭐</strong> to unlock ${nextBadge.emoji} <strong>${nextBadge.label}</strong>` : "🏆 All badges earned!";
  const badgeRows = BADGES.map((b) => { const earned = totalStars >= b.threshold; return `<tr class="${earned?"earned-row":"locked-row"}"><td>${earned?b.emoji:"🔒"}&nbsp; ${b.label}</td><td class="center">${b.threshold}★</td><td class="center ${earned?"status-earned":"status-locked"}">${earned?"✅ Earned":"Locked"}</td></tr>`; }).join("");
  const html = `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"/><title>BrightSteps Report</title><style>@import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;700;800;900&display=swap');@page{margin:20mm 18mm;}*{box-sizing:border-box;margin:0;padding:0;}body{font-family:'Nunito',sans-serif;background:#FEFCF5;color:#1E1007;font-size:14px;}.page{max-width:680px;margin:0 auto;padding:32px;}.report-header{background:linear-gradient(135deg,#FEF4CC,#E0F7F3,#E1F3FB);border-radius:20px;padding:28px 32px;margin-bottom:28px;display:flex;align-items:center;gap:18px;border:2px solid rgba(61,181,160,0.3);}.report-header .icon{font-size:3.2rem;}.report-header h1{font-size:1.55rem;font-weight:900;color:#1E1007;}.report-header p{font-size:0.85rem;font-weight:700;color:#6B4C30;}.pills{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-bottom:28px;}.pill{border-radius:14px;padding:18px 12px;text-align:center;border:2px solid;}.pill strong{display:block;font-size:2.2rem;font-weight:900;line-height:1.1;}.pill small{font-size:0.72rem;font-weight:800;color:#6B4C30;display:block;margin-top:4px;}.p-green{background:#E2F6E7;border-color:#5EAD6E;}.p-sky{background:#E1F3FB;border-color:#44A7CE;}.p-rose{background:#FDEAE6;border-color:#E85C45;}.section-heading{font-size:1rem;font-weight:900;color:#1E1007;margin:24px 0 12px;display:flex;align-items:center;gap:8px;}.section-heading::after{content:'';flex:1;height:2px;background:rgba(61,181,160,0.2);border-radius:2px;}table{width:100%;border-collapse:collapse;}thead tr{background:#E0F7F3;}th{padding:10px 14px;text-align:left;font-size:0.78rem;font-weight:900;color:#1E8C78;}td{padding:9px 14px;font-size:0.85rem;font-weight:700;border-bottom:1px solid #f0f9f6;}.center{text-align:center;}.earned-row td{background:#fafffe;}.locked-row td{color:#B8906A;}.status-earned{color:#3D8450;font-weight:900;}.status-locked{color:#B8906A;}.next-goal{background:#E1F3FB;border:2px solid #44A7CE;border-radius:14px;padding:14px 18px;font-size:0.9rem;font-weight:700;color:#2478A4;margin-top:20px;}.report-footer{text-align:center;margin-top:36px;padding-top:20px;border-top:2px dashed rgba(61,181,160,0.3);font-size:0.78rem;color:#B8906A;font-weight:700;}</style></head><body><div class="page"><div class="report-header"><div class="icon">📊</div><div><h1>BrightSteps Progress Report</h1><p>for <strong>${CHILD_NAME}</strong> · Generated on ${date}</p></div></div><div class="pills"><div class="pill p-green"><strong>${totalStars}</strong><small>⭐ Stars</small></div><div class="pill p-sky"><strong>${completedRoutines}</strong><small>✅ Routines</small></div><div class="pill p-rose"><strong>${earnedBadges.length}/${BADGES.length}</strong><small>🏅 Badges</small></div></div><div class="section-heading">🏅 Badge Progress</div><table><thead><tr><th>Badge</th><th class="center">Stars Required</th><th class="center">Status</th></tr></thead><tbody>${badgeRows}</tbody></table><div class="next-goal">🎯 Next Goal: ${nextTxt}</div><div class="report-footer">BrightSteps · Keep going, ${CHILD_NAME}! 🌟</div></div><script>window.onload=()=>{setTimeout(()=>window.print(),400);}</script></body></html>`;
  const blob = new Blob([html],{type:"text/html"}); const url = URL.createObjectURL(blob); const win = window.open(url,"_blank"); if (win) win.onafterprint=()=>URL.revokeObjectURL(url);
}

function ConfirmDeleteModal({ routine, onConfirm, onCancel }) {
  return (
    <div className="rd-overlay" onClick={(e) => e.target===e.currentTarget && onCancel()}>
      <div className="rd-modal rd-confirm-modal">
        <div className="rd-confirm-icon">🗑️</div>
        <h2 className="rd-confirm-title">Delete Routine?</h2>
        <p className="rd-confirm-sub">Are you sure you want to delete <strong>"{routine.title}"</strong>? This cannot be undone.</p>
        <div className="rd-confirm-actions">
          <button className="rd-ghost-btn" onClick={onCancel}>Cancel</button>
          <button className="rd-danger-btn" onClick={onConfirm}>Yes, Delete</button>
        </div>
      </div>
    </div>
  );
}

function RoutineFormModal({ initial, onSave, onClose }) {
  const isEdit    = !!initial;
  const blankTask = [{ id:1, label:"", mins:"" }];
  const [form, setForm] = useState(() => {
    if (!initial) return { title:"",goal:"",skillFocus:"",desc:"",type:"adhd",cls:"morning",iconEmoji:"☀️",badge:"",tagsStr:"",tasks:blankTask };
    return { title:initial.title||"",goal:initial.goal||"",skillFocus:initial.skillFocus||"",desc:initial.desc||"",type:initial.type||"adhd",cls:initial.cls||"morning",iconEmoji:initial.iconEmoji||"☀️",badge:initial.badge||"",tagsStr:(initial.tags||[]).join(", "),tasks:(initial.defaultTasks||blankTask).map((t,i)=>({id:i+1,label:typeof t==="string"?t:t.label,mins:typeof t==="object"&&t.mins?String(t.mins):""})) };
  });
  const [errors,setErrors] = useState({});
  const [draggedTask,setDraggedTask] = useState(null);
  const [dragOverTask,setDragOverTask] = useState(null);

  const set     = (k,v) => setForm((f) => ({...f,[k]:v}));
  const setTask = (id,k,v) => setForm((f) => ({...f,tasks:f.tasks.map((t) => t.id===id?{...t,[k]:v}:t)}));
  const addRow  = () => setForm((f) => ({...f,tasks:[...f.tasks,{id:Date.now(),label:"",mins:""}]}));
  const removeRow = (id) => setForm((f) => ({...f,tasks:f.tasks.filter((t) => t.id!==id)}));

  const validate = () => { const e={}; if(!form.title.trim())e.title="Title is required."; if(!form.goal.trim())e.goal="Goal is required."; if(!form.tasks.some((t)=>t.label.trim()))e.tasks="Add at least one task."; setErrors(e); return !Object.keys(e).length; };
  const handleDragStart=(e,i)=>{e.dataTransfer.effectAllowed="move";e.dataTransfer.setData("text/plain",i);setDraggedTask(i);};
  const handleDragOver=(e,i)=>{e.preventDefault();e.dataTransfer.dropEffect="move";if(dragOverTask!==i)setDragOverTask(i);};
  const handleDrop=(e,ti)=>{e.preventDefault();const si=draggedTask;if(si===null||si===ti)return;setForm((f)=>{const t=Array.from(f.tasks);const[m]=t.splice(si,1);t.splice(ti,0,m);return{...f,tasks:t};});setDraggedTask(null);setDragOverTask(null);};
  const handleDragEnd=()=>{setDraggedTask(null);setDragOverTask(null);};

  const handleSave = () => {
    if(!validate())return;
    const meta=getMeta(form.type,form.cls);
    const tags=form.tagsStr.split(",").map((s)=>s.trim()).filter(Boolean);
    const tasks=form.tasks.filter((t)=>t.label.trim()).map((t)=>({label:t.label.trim(),mins:parseInt(t.mins)||0}));
    onSave({_id:initial?._id||undefined,title:form.title.trim(),goal:form.goal.trim(),skillFocus:form.skillFocus.trim(),desc:form.desc.trim(),type:form.type,cls:form.cls,iconEmoji:form.iconEmoji,emoji:form.iconEmoji,badge:form.badge.trim()||null,tags,defaultTasks:tasks,isDefault:false,iconBg:meta.iconBg});
  };
  const meta=getMeta(form.type,form.cls);

  return (
    <div className="rd-overlay" onClick={(e)=>e.target===e.currentTarget&&onClose()}>
      <div className="rd-modal rd-form-modal">
        <button className="rd-modal-close" onClick={onClose}><X size={16}/></button>
        <div className="rd-form-header">
          <div className="rd-form-icon-preview" style={{background:meta.iconBg}}>{form.iconEmoji}</div>
          <div><h2 className="rd-form-title">{isEdit?"✏️ Edit Routine":"✨ New Routine"}</h2><p className="rd-form-sub">Fill in the details below</p></div>
        </div>
        <div className="rd-form-body">
          <div className="rd-form-row-2">
            <div className="rd-field"><label className="rd-label">Type</label><div className="rd-radio-group">{TYPE_OPTIONS.map((o)=><button key={o.value} type="button" className={`rd-radio-btn ${form.type===o.value?"active":""}`} onClick={()=>set("type",o.value)}>{o.label}</button>)}</div></div>
            <div className="rd-field"><label className="rd-label">Category</label><div className="rd-radio-group">{CLS_OPTIONS.map((o)=><button key={o.value} type="button" className={`rd-radio-btn ${form.cls===o.value?"active":""}`} onClick={()=>set("cls",o.value)}>{o.label}</button>)}</div></div>
          </div>
          <div className="rd-field"><label className="rd-label">Icon</label><div className="rd-icon-picker">{ICON_OPTIONS.map((ic)=><button key={ic} type="button" className={`rd-icon-opt ${form.iconEmoji===ic?"active":""}`} onClick={()=>set("iconEmoji",ic)}>{ic}</button>)}</div></div>
          <div className="rd-field"><label className="rd-label">Title <span className="rd-required">*</span></label><input className={`rd-input ${errors.title?"error":""}`} placeholder="e.g. Morning Routine" value={form.title} onChange={(e)=>set("title",e.target.value)}/>{errors.title&&<span className="rd-error-msg">{errors.title}</span>}</div>
          <div className="rd-field"><label className="rd-label">Goal <span className="rd-required">*</span></label><input className={`rd-input ${errors.goal?"error":""}`} placeholder="e.g. Build morning independence" value={form.goal} onChange={(e)=>set("goal",e.target.value)}/>{errors.goal&&<span className="rd-error-msg">{errors.goal}</span>}</div>
          <div className="rd-field"><label className="rd-label">Tags <span className="rd-hint">(comma separated)</span></label><input className="rd-input" placeholder="e.g. Morning, Focus" value={form.tagsStr} onChange={(e)=>set("tagsStr",e.target.value)}/></div>
          <div className="rd-field"><label className="rd-label">Badge <span className="rd-hint">(optional)</span></label><input className="rd-input" placeholder="e.g. Daily Must!" value={form.badge} onChange={(e)=>set("badge",e.target.value)}/></div>
          <div className="rd-field">
            <label className="rd-label">Tasks <span className="rd-required">*</span><span className="rd-hint"> — drag to reorder</span></label>
            {errors.tasks&&<span className="rd-error-msg">{errors.tasks}</span>}
            <div className="rd-task-builder">
              {form.tasks.map((task,idx)=>(
                <div key={task.id} className={`rd-task-build-row ${draggedTask===idx?"dragging":""} ${dragOverTask===idx?"drag-over":""}`}
                  draggable onDragStart={(e)=>handleDragStart(e,idx)} onDragOver={(e)=>handleDragOver(e,idx)} onDrop={(e)=>handleDrop(e,idx)} onDragEnd={handleDragEnd}>
                  <div className="rd-task-drag-handle"><GripVertical size={16}/></div>
                  <span className="rd-task-num">{idx+1}</span>
                  <input className="rd-input rd-task-label-input" placeholder="Task name" value={task.label} onChange={(e)=>setTask(task.id,"label",e.target.value)}/>
                  <input className="rd-input rd-task-mins-input" type="number" min="0" placeholder="min" value={task.mins} onChange={(e)=>setTask(task.id,"mins",e.target.value)}/>
                  <button type="button" className="rd-task-remove-btn" onClick={()=>removeRow(task.id)} disabled={form.tasks.length===1}><X size={13}/></button>
                </div>
              ))}
              <button type="button" className="rd-add-task-row-btn" onClick={addRow}><Plus size={14}/> Add Task</button>
            </div>
          </div>
        </div>
        <div className="rd-form-actions">
          <button className="rd-ghost-btn" onClick={onClose}>Cancel</button>
          <button className="rd-primary-btn rd-save-routine-btn" onClick={handleSave}>{isEdit?"💾 Save Changes":"✨ Create Routine"}</button>
        </div>
      </div>
    </div>
  );
}

function ReportModal({ onClose, totalStars, completedRoutines, earnedBadges }) {
  return (
    <div className="rd-overlay" onClick={(e)=>e.target===e.currentTarget&&onClose()}>
      <div className="rd-modal rd-report">
        <button className="rd-modal-close" onClick={onClose}><X size={16}/></button>
        <div className="rd-report-top"><span className="rd-report-icon">📊</span><div><h2>Progress Report</h2><p>for <strong>{CHILD_NAME}</strong></p></div></div>
        <div className="rd-report-pills">
          <div className="rd-rpill rp-green"><strong>{totalStars}</strong><small>⭐ Stars</small></div>
          <div className="rd-rpill rp-sky"><strong>{completedRoutines}</strong><small>✅ Done</small></div>
          <div className="rd-rpill rp-peach"><strong>{earnedBadges.length}</strong><small>🏅 Badges</small></div>
        </div>
        <p className="rd-section-label">🏅 Badges</p>
        <div className="rd-badges-grid">
          {BADGES.map((b)=>{const earned=totalStars>=b.threshold;return(<div key={b.id} className={`rd-badge-chip ${earned?"earned":"locked"}`}><span>{earned?b.emoji:"🔒"}</span><small>{b.label}</small><small className="rd-badge-req">{b.threshold}★</small></div>);})}
        </div>
        <p className="rd-section-label">🎯 Next Goal</p>
        <div className="rd-next-goal">{(()=>{const next=BADGES.find((b)=>totalStars<b.threshold);if(!next)return<p>🏆 All badges earned! You're a superstar!</p>;return<p>Earn <strong>{next.threshold-totalStars} more ⭐</strong> to unlock <strong>{next.emoji} {next.label}</strong></p>;})()}</div>
        {totalStars===0&&<div className="rd-empty-note">📝 Complete tasks to earn stars!</div>}
        <button className="rd-download-btn" onClick={()=>generateReportPDF({totalStars,completedRoutines,earnedBadges})}><Download size={16}/> Download PDF</button>
        <button className="rd-ghost-btn rd-close-report-btn" onClick={onClose}>Close</button>
      </div>
    </div>
  );
}

function RewardModal({ taskLabel, totalStars, onClose }) {
  const latestBadge=[...BADGES].reverse().find((b)=>totalStars>=b.threshold);
  return (
    <div className="rd-overlay">
      <div className="rd-modal rd-reward">
        <div className="rd-reward-emoji">{latestBadge?latestBadge.emoji:"⭐"}</div>
        <h2>Amazing, {CHILD_NAME}! 🎉</h2>
        <p className="rd-reward-task">You finished:<br/><strong>"{taskLabel}"</strong></p>
        <div className="rd-reward-stars"><span className="rd-star-count">⭐ {totalStars} stars!</span></div>
        {latestBadge&&totalStars===latestBadge.threshold&&<div className="rd-badge-unlocked">🎉 Badge: <strong>{latestBadge.emoji} {latestBadge.label}</strong></div>}
        <button className="rd-primary-btn" onClick={onClose} style={{marginTop:20}}>Keep Going! 🚀</button>
      </div>
    </div>
  );
}

function ChecklistModal({ routine, onClose, totalStars, onStarEarned, onRoutineComplete, onTaskAdded }) {
  const [tasks,setTasks] = useState(routine.defaultTasks.map((t,i)=>({id:i,label:typeof t==="string"?t:t.label,mins:typeof t==="object"?t.mins:0,done:false})));
  const [newTask,setNewTask] = useState("");
  const [reward,setReward] = useState(null);
  const [localStars,setLocalStars] = useState(totalStars);
  const [draggedTask,setDraggedTask] = useState(null);
  const [dragOverTask,setDragOverTask] = useState(null);

  const toggleTask=(id)=>{const task=tasks.find((t)=>t.id===id);if(!task||task.done)return;const updated=tasks.map((t)=>t.id===id?{...t,done:true}:t);setTasks(updated);const newTotal=localStars+1;setLocalStars(newTotal);onStarEarned(1);setReward({label:task.label,stars:newTotal});if(updated.every((t)=>t.done))onRoutineComplete();};
  const handleDragStart=(e,i)=>{const task=tasks[i];if(task.done){e.preventDefault();return;}e.dataTransfer.effectAllowed="move";e.dataTransfer.setData("text/plain",i);setDraggedTask(i);};
  const handleDragOver=(e,i)=>{e.preventDefault();e.dataTransfer.dropEffect="move";if(dragOverTask!==i)setDragOverTask(i);};
  const handleDrop=(e,ti)=>{e.preventDefault();const si=draggedTask;if(si===null||si===ti)return;if(tasks[si].done||tasks[ti].done)return;setTasks((p)=>{const t=Array.from(p);const[m]=t.splice(si,1);t.splice(ti,0,m);return t;});setDraggedTask(null);setDragOverTask(null);};
  const handleDragEnd=()=>{setDraggedTask(null);setDragOverTask(null);};
  const addTask=()=>{const label=newTask.trim();if(!label)return;const task={id:Date.now(),label,mins:0,done:false};setTasks((p)=>[...p,task]);onTaskAdded(routine._id,{label,mins:0});setNewTask("");};
  const removeTask=(id)=>setTasks((p)=>p.filter((t)=>t.id!==id));
  const doneCount=tasks.filter((t)=>t.done).length;
  const progress=tasks.length?Math.round((doneCount/tasks.length)*100):0;

  if(reward)return<RewardModal taskLabel={reward.label} totalStars={reward.stars} onClose={()=>setReward(null)}/>;
  return (
    <div className="rd-overlay" onClick={(e)=>e.target===e.currentTarget&&onClose()}>
      <div className={`rd-modal rd-checklist-modal ${routine.type}`}>
        <button className="rd-modal-close" onClick={onClose}><X size={16}/></button>
        <div className="rd-cl-header">
          <div className="rd-cl-icon" style={{background:routine.iconBg||getMeta(routine.type,routine.cls).iconBg}}><span>{routine.iconEmoji}</span></div>
          <div className="rd-cl-title-block"><h2>{routine.title}</h2>{routine.goal&&<p><strong>Goal:</strong> {routine.goal}</p>}</div>
        </div>
        <div className="rd-progress-row">
          <div className="rd-progress-bar"><div className="rd-progress-fill" style={{width:`${progress}%`}}/></div>
          <span className="rd-progress-label">{doneCount}/{tasks.length} · ⭐ {localStars}</span>
        </div>
        <div className="rd-task-list">
          {tasks.map((task,idx)=>(
            <div key={task.id} className={`rd-task-row ${task.done?"done":""} ${draggedTask===idx?"dragging":""} ${dragOverTask===idx?"drag-over":""}`}
              draggable={!task.done} onDragStart={(e)=>handleDragStart(e,idx)} onDragOver={(e)=>handleDragOver(e,idx)} onDrop={(e)=>handleDrop(e,idx)} onDragEnd={handleDragEnd}>
              {!task.done&&<div className="rd-task-drag-handle"><GripVertical size={16}/></div>}
              <div className={`rd-tick ${task.done?"checked":""}`} onClick={()=>!task.done&&toggleTask(task.id)}>{task.done&&"✓"}</div>
              <span className="rd-task-label" onClick={()=>!task.done&&toggleTask(task.id)}>{task.label}</span>
              {task.done&&<span className="rd-task-star">⭐</span>}
              {task.mins>0&&!task.done&&<span className="rd-task-mins">{task.mins}m</span>}
              {!task.done&&<button className="rd-remove" onClick={(e)=>{e.stopPropagation();removeTask(task.id);}}><X size={13}/></button>}
            </div>
          ))}
        </div>
        <div className="rd-add-row">
          <input className="rd-add-input" placeholder="Add a task…" value={newTask} onChange={(e)=>setNewTask(e.target.value)} onKeyDown={(e)=>e.key==="Enter"&&addTask()}/>
          <button className="rd-add-task-btn" onClick={addTask}>+</button>
        </div>
        <button className="rd-primary-btn" onClick={onClose} style={{marginTop:20}}>{doneCount===tasks.length&&tasks.length>0?"All done! 🎉":"Save & Close"}</button>
      </div>
    </div>
  );
}

function RoutineCard({ routine, onOpen, onEdit, onDelete }) {
  const meta=getMeta(routine.type,routine.cls);
  return (
    <div className={`rd-card type-${routine.type} cls-${routine.cls}`}
      style={{"--card-accent":meta.accent,"--card-accent-dark":meta.accentDark,"--card-accent-bg":meta.accentBg}}
      data-emoji={routine.iconEmoji}>
      <div className="rd-card-stripe"/>
      <div className="rd-card-icon-wrap" style={{background:routine.iconBg||meta.iconBg}}>
        <span className="rd-card-icon">{routine.iconEmoji}</span>
      </div>
      <div className="rd-card-body">
        <div className="rd-card-title-row">
          <h3>{routine.title}</h3>
          <div className="rd-card-title-right">
            {routine.badge&&<span className="rd-card-badge">{routine.badge}</span>}
            {!routine.isDefault&&<span className="rd-custom-chip">Custom</span>}
          </div>
        </div>
        {routine.goal&&<p className="rd-card-goal"><strong>Goal:</strong> {routine.goal}</p>}
        <div className="rd-card-tags">{(routine.tags||[]).map((t)=><span key={t} className="rd-tag">{t}</span>)}</div>
        <p className="rd-task-count">📋 {(routine.defaultTasks||[]).length} tasks</p>
      </div>
      <div className="rd-card-actions">
        {!routine.isDefault&&(
          <div className="rd-crud-btns">
            <button className="rd-crud-btn rd-edit-btn" title="Edit" onClick={()=>onEdit(routine)}><Pencil size={14}/></button>
            <button className="rd-crud-btn rd-delete-btn" title="Delete" onClick={()=>onDelete(routine)}><Trash2 size={14}/></button>
          </div>
        )}
        <button className="rd-open-btn" onClick={()=>onOpen(routine)}>
          <span className="rd-open-btn-arrow">▶</span>
          <span className="rd-open-btn-label">Start</span>
        </button>
        <span className="rd-solo-label">👤 Solo</span>
      </div>
    </div>
  );
}

export default function RoutineDashboard() {
  const [activeTab,setActiveTab]           = useState("adhd");
  const [searchQuery,setSearchQuery]       = useState("");
  const [activeRoutine,setActiveRoutine]   = useState(null);
  const [showReport,setShowReport]         = useState(false);
  const [showForm,setShowForm]             = useState(false);
  const [editTarget,setEditTarget]         = useState(null);
  const [deleteTarget,setDeleteTarget]     = useState(null);
  const [customRoutines,setCustomRoutines] = useState([]);
  const [loading,setLoading]               = useState(true);
  const [apiError,setApiError]             = useState("");
  const [extraTasksMap,setExtraTasksMap]   = useState({});

  const [totalStars,setTotalStars] = useState(()=>{try{const u=JSON.parse(localStorage.getItem('brightsteps_user'));const uid=u?._id||u?.user?.id||'guest';return parseInt(localStorage.getItem(`br_stars_${uid}`))||0;}catch{return 0;}});
  const [completedRoutines,setCompletedRoutines] = useState(()=>{try{const u=JSON.parse(localStorage.getItem('brightsteps_user'));const uid=u?._id||u?.user?.id||'guest';return parseInt(localStorage.getItem(`br_routines_${uid}`))||0;}catch{return 0;}});

  useEffect(()=>{try{const u=JSON.parse(localStorage.getItem('brightsteps_user'));const uid=u?._id||u?.user?.id||'guest';localStorage.setItem(`br_stars_${uid}`,totalStars.toString());localStorage.setItem(`br_routines_${uid}`,completedRoutines.toString());}catch{}},[totalStars,completedRoutines]);

  useEffect(()=>{
    async function boot(){setLoading(true);setApiError("");try{const[r,e]=await Promise.all([apiFetch("/routines"),apiFetch("/extra-tasks")]);setCustomRoutines(r);const map={};(e||[]).forEach(({routineId,tasks})=>{map[routineId]=tasks;});setExtraTasksMap(map);}catch{setApiError("Backend unavailable — running offline.");}finally{setLoading(false);}}
    boot();
  },[]);

  const handleStarEarned=()=>setTotalStars((s)=>s+1);
  const handleRoutineComplete=()=>setCompletedRoutines((c)=>c+1);
  const handleTaskAdded=async(routineId,newTask)=>{setExtraTasksMap((p)=>({...p,[routineId]:[...(p[routineId]||[]),newTask]}));try{await apiFetch(`/extra-tasks/${routineId}`,{method:"POST",body:JSON.stringify(newTask)});}catch{}};
  const handleCreate=async(data)=>{try{const saved=await apiFetch("/routines",{method:"POST",body:JSON.stringify(data)});setCustomRoutines((p)=>[...p,saved]);}catch{setCustomRoutines((p)=>[...p,{...data,_id:"local-"+Date.now()}]);}setShowForm(false);};
  const handleUpdate=async(data)=>{try{const saved=await apiFetch(`/routines/${data._id}`,{method:"PUT",body:JSON.stringify(data)});setCustomRoutines((p)=>p.map((r)=>r._id===saved._id?saved:r));}catch{setCustomRoutines((p)=>p.map((r)=>r._id===data._id?data:r));}setEditTarget(null);};
  const handleDelete=async()=>{try{await apiFetch(`/routines/${deleteTarget._id}`,{method:"DELETE"});}catch{}setCustomRoutines((p)=>p.filter((r)=>r._id!==deleteTarget._id));setDeleteTarget(null);};

  function mergeExtras(routine){const extras=extraTasksMap[routine._id];if(!extras||extras.length===0)return routine;return{...routine,defaultTasks:[...routine.defaultTasks,...extras]};}

  const defaultsForTab=activeTab==="adhd"?DEFAULT_ADHD_ROUTINES:DEFAULT_AUTISM_ROUTINES;
  const customForTab=customRoutines.filter((r)=>r.type===activeTab);
  const allForTab=[...defaultsForTab,...customForTab].map(mergeExtras);

  const filtered=useMemo(()=>{if(!searchQuery.trim())return allForTab;const q=searchQuery.toLowerCase();return allForTab.filter((r)=>r.title.toLowerCase().includes(q)||(r.goal||"").toLowerCase().includes(q)||(r.tags||[]).some((t)=>t.toLowerCase().includes(q)));},[allForTab,searchQuery]);

  const earnedBadges=BADGES.filter((b)=>totalStars>=b.threshold);
  const latestBadge=earnedBadges[earnedBadges.length-1];

  return (
    <div className="rd-page">

      {/* HERO */}
      <div className="rd-hero">
        <div className="rd-blob rd-blob-1" aria-hidden="true"/>
        <div className="rd-blob rd-blob-2" aria-hidden="true"/>
        <div className="rd-blob rd-blob-3" aria-hidden="true"/>
        <span className="rd-deco deco-star1"  aria-hidden="true">⭐</span>
        <span className="rd-deco deco-star2"  aria-hidden="true">✨</span>
        <span className="rd-deco deco-star3"  aria-hidden="true">💫</span>
        <span className="rd-deco deco-cloud1" aria-hidden="true">☁️</span>
        <span className="rd-deco deco-cloud2" aria-hidden="true">🌤️</span>
        <span className="rd-deco deco-rocket" aria-hidden="true">🚀</span>
        <span className="rd-deco deco-rainbow"aria-hidden="true">🌈</span>
        <span className="rd-deco deco-balloon"aria-hidden="true">🎈</span>
        <span className="rd-deco deco-heart"  aria-hidden="true">💛</span>
        <span className="rd-deco deco-music"  aria-hidden="true">🎵</span>

        <div className="rd-hero-top">
          <Link to="/dashboard" className="rd-back-link"><ArrowLeft size={17}/> Back</Link>
          <div className="rd-hero-right">
            <div className="rd-stars-chip"><span>⭐</span><span>{totalStars} stars</span>{latestBadge&&<span className="rd-latest-badge-chip">{latestBadge.emoji}</span>}</div>
            <button className="rd-report-link" onClick={()=>setShowReport(true)}>📊 Report</button>
          </div>
        </div>

        <div className="rd-hero-title-block">
          <div className="rd-hero-emoji-row" aria-hidden="true">
            <span>🌅</span><span>🌟</span><span>📋</span><span>🌟</span><span>🌙</span>
          </div>
          <h1 className="rd-hub-title">
            <span className="rd-tw rd-tw-rose">My</span>
            <span className="rd-tw rd-tw-amber">Routines</span>
          </h1>
          <p className="rd-hub-subtitle">Pick a routine and let's get started! 🏆</p>
          <div className="rd-hero-stats">
            <span className="rd-stat-pill rd-sp-rose">📋 {allForTab.length} Routines</span>
            <span className="rd-stat-pill rd-sp-amber">🏅 Earn Stars</span>
            <span className="rd-stat-pill rd-sp-sage">🧠 Build Habits</span>
          </div>
        </div>
      </div>

      {/* TAB BAR */}
      <div className="rd-tab-bar">
        <div className="rd-tab-bar-inner">
          <div className="rd-tabs">
            <button className={`rd-tab ${activeTab==="adhd"?"active":""}`} onClick={()=>{setActiveTab("adhd");setSearchQuery("");}}>⚡ ADHD</button>
            <button className={`rd-tab ${activeTab==="autism"?"active":""}`} onClick={()=>{setActiveTab("autism");setSearchQuery("");}}>🧩 Autism</button>
          </div>
          <div className="rd-search-wrap">
            <Search size={15} className="rd-search-icon"/>
            <input className="rd-search" placeholder="Search routines…" value={searchQuery} onChange={(e)=>setSearchQuery(e.target.value)}/>
            {searchQuery&&<button className="rd-search-clear" onClick={()=>setSearchQuery("")}><X size={13}/></button>}
          </div>
          <button className="rd-create-btn" onClick={()=>setShowForm(true)}><Plus size={16}/> New Routine</button>
        </div>
      </div>

      {/* CARDS */}
      <section className="rd-cards-section">
        {apiError&&<div className="rd-api-notice">⚠️ {apiError}</div>}
        <div className="rd-cards-heading">
          <h2>{activeTab==="adhd"?"⚡ ADHD":"🧩 Autism"} Routines <span className="rd-count-chip">{filtered.length}</span></h2>
        </div>
        {loading?(
          <div className="rd-loading"><div className="rd-spinner"/><p>Loading routines…</p></div>
        ):filtered.length===0?(
          <div className="rd-empty"><span>🔍</span><p>No routines match "<strong>{searchQuery}</strong>"</p><button className="rd-text-btn" onClick={()=>setSearchQuery("")}>Clear search</button></div>
        ):(
          <div className="rd-game-cards-wrapper">
            {filtered.map((routine,i)=>(
              <div key={routine._id} className="rd-card-anim" style={{animationDelay:`${i*0.08}s`}}>
                <RoutineCard routine={routine} onOpen={setActiveRoutine} onEdit={setEditTarget} onDelete={setDeleteTarget}/>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* FOOTER */}
      <div className="rd-footer-section">
        <div className="rd-encourage-row">
          <div className="rd-encourage-card"><span className="rd-ec-emoji">🏆</span><div className="rd-ec-text"><h3>Every routine is a win!</h3><p>No rush. Build habits one step at a time. 🌱</p></div></div>
          <div className="rd-encourage-card"><span className="rd-ec-emoji">💛</span><div className="rd-ec-text"><h3>You're a superstar, {CHILD_NAME}!</h3><p>Keep shining — we're proud of you! ✨</p></div></div>
        </div>
      </div>

      {activeRoutine&&<ChecklistModal routine={activeRoutine} onClose={()=>setActiveRoutine(null)} totalStars={totalStars} onStarEarned={handleStarEarned} onRoutineComplete={handleRoutineComplete} onTaskAdded={handleTaskAdded}/>}
      {showReport&&<ReportModal onClose={()=>setShowReport(false)} totalStars={totalStars} completedRoutines={completedRoutines} earnedBadges={earnedBadges}/>}
      {showForm&&<RoutineFormModal onSave={handleCreate} onClose={()=>setShowForm(false)}/>}
      {editTarget&&<RoutineFormModal initial={editTarget} onSave={handleUpdate} onClose={()=>setEditTarget(null)}/>}
      {deleteTarget&&<ConfirmDeleteModal routine={deleteTarget} onConfirm={handleDelete} onCancel={()=>setDeleteTarget(null)}/>}
    </div>
  );
}