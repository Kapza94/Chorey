// ParentComponents.jsx — shared primitives for parent app
// Reuses Icon from KidComponents (loaded after this one).

function ParentHeader({ title, subtitle, action }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between',
      padding: '12px 22px 14px',
    }}>
      <div>
        {subtitle && (
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em',
                        textTransform: 'uppercase', color: 'var(--fg-3)' }}>
            {subtitle}
          </div>
        )}
        <div style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 30,
                      lineHeight: 1.05, color: 'var(--fg-1)',
                      letterSpacing: '-0.02em', marginTop: 2 }}>
          {title}
        </div>
      </div>
      {action}
    </div>
  );
}

function KidCard({ kid, onTap }) {
  // kid: { name, age, avatar (letter), earned, allowance, savings, giving, choresDone, choresTotal }
  const pct = Math.round((kid.choresDone / kid.choresTotal) * 100);
  return (
    <div
      onClick={onTap}
      style={{
        background: 'var(--cream-3)', borderRadius: 18,
        border: '1px solid var(--border)', boxShadow: 'var(--shadow-xs)',
        padding: '18px 18px 16px', cursor: 'pointer',
        display: 'flex', flexDirection: 'column', gap: 14,
      }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{
          width: 44, height: 44, borderRadius: 999,
          background: `var(--${kid.tone}-200)`, color: `var(--${kid.tone}-800)`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 22,
          border: '1px solid var(--border)',
        }}>{kid.avatar}</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--fg-1)' }}>{kid.name}</div>
          <div style={{ fontSize: 12, color: 'var(--fg-3)' }}>{kid.age} · {kid.choresDone} of {kid.choresTotal} chores done</div>
        </div>
        <Icon name="chev" size={18} color="var(--fg-3)"/>
      </div>

      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
        <div style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 32,
                      lineHeight: 1, color: 'var(--fg-1)',
                      fontVariantNumeric: 'tabular-nums' }}>
          ${kid.earned.toFixed(2)}
        </div>
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em',
                      textTransform: 'uppercase', color: 'var(--fg-3)' }}>
          this {kid.cadence === 'monthly' ? 'month' : 'week'}
        </div>
      </div>

      {/* Budget cap meter — earned toward the period budget */}
      {kid.budget != null && (() => {
        const bpct = Math.min(100, (kid.earned / kid.budget) * 100);
        const over = kid.assigned != null && kid.assigned > kid.budget;
        return (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between',
                          fontSize: 11, color: 'var(--fg-2)', marginBottom: 6 }}>
              <span><b style={{ color: 'var(--fg-1)' }}>${kid.earned.toFixed(2)}</b> of ${kid.budget.toFixed(0)} {kid.cadence === 'monthly' ? 'monthly' : 'weekly'} budget</span>
              {over && (
                <span style={{ color: 'var(--warning-600)', fontWeight: 700 }}>
                  +${(kid.assigned - kid.budget).toFixed(2)} extra
                </span>
              )}
            </div>
            <div style={{ height: 6, background: 'var(--cream-1)', borderRadius: 999, overflow: 'hidden', position: 'relative' }}>
              <div style={{ width: bpct + '%', height: '100%', borderRadius: 999,
                            background: bpct >= 100 ? 'var(--giving-400)' : 'var(--allowance-400)' }}/>
            </div>
          </div>
        );
      })()}

      {/* 40/40/20 meter */}
      <div>
        <div style={{ display: 'flex', height: 8, borderRadius: 999, overflow: 'hidden', gap: 2 }}>
          <div style={{ flex: 40, background: 'var(--allowance-400)' }}/>
          <div style={{ flex: 40, background: 'var(--savings-400)' }}/>
          <div style={{ flex: 20, background: 'var(--giving-400)' }}/>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8,
                      fontSize: 11, color: 'var(--fg-2)' }}>
          <span><b style={{ color: 'var(--allowance-800)' }}>${kid.allowance.toFixed(2)}</b> spend</span>
          <span><b style={{ color: 'var(--savings-800)' }}>${kid.savings.toFixed(2)}</b> save</span>
          <span><b style={{ color: 'var(--giving-800)' }}>${kid.giving.toFixed(2)}</b> give</span>
        </div>
      </div>

      {kid.pendingApprovals > 0 && (
        <div style={{
          background: 'var(--warning-100)', color: 'var(--warning-600)',
          borderRadius: 10, padding: '8px 12px',
          fontSize: 12, fontWeight: 700,
          display: 'flex', alignItems: 'center', gap: 6,
        }}>
          <Icon name="spark" size={14} strokeWidth={2.4}/>
          {kid.pendingApprovals} {kid.pendingApprovals === 1 ? 'chore' : 'chores'} need your OK
        </div>
      )}
    </div>
  );
}

function ParentTabBar({ active, onChange }) {
  const tabs = [
    { id: 'kids',     icon: 'user',  label: 'Kids' },
    { id: 'chores',   icon: 'home',  label: 'Chores' },
    { id: 'pay',      icon: 'wallet', label: 'Pay' },
    { id: 'settings', icon: 'gear',  label: 'Settings' },
  ];
  return (
    <div style={{
      position: 'absolute', left: 0, right: 0, bottom: 34,
      padding: '10px 24px 14px',
      display: 'flex', justifyContent: 'space-around',
      background: 'rgba(246, 239, 227, 0.92)',
      backdropFilter: 'blur(20px) saturate(140%)',
      WebkitBackdropFilter: 'blur(20px) saturate(140%)',
      borderTop: '1px solid var(--border)',
      zIndex: 40,
    }}>
      {tabs.map(t => (
        <button key={t.id}
          onClick={() => onChange(t.id)}
          style={{
            background: 'transparent', border: 0, cursor: 'pointer',
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
            color: active === t.id ? 'var(--accent-600)' : 'var(--fg-3)',
            padding: '4px 10px', fontFamily: 'inherit',
          }}>
          <ParentIcon name={t.icon} size={22} active={active === t.id}/>
          <span style={{ fontSize: 11, fontWeight: 700 }}>{t.label}</span>
        </button>
      ))}
    </div>
  );
}

// extra icon set — extends Icon with a gear and wallet
function ParentIcon({ name, size = 24, active }) {
  if (name === 'gear') {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
           stroke="currentColor" strokeWidth={active ? 2.4 : 2}
           strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 7h-9"/><path d="M14 17H5"/>
        <circle cx="17" cy="17" r="3"/><circle cx="7" cy="7" r="3"/>
      </svg>
    );
  }
  if (name === 'wallet') {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
           stroke="currentColor" strokeWidth={active ? 2.4 : 2}
           strokeLinecap="round" strokeLinejoin="round">
        <path d="M19 7V5a2 2 0 0 0-2-2H5a2 2 0 0 0 0 4h15a1 1 0 0 1 1 1v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5"/>
        <path d="M17.5 13a.5.5 0 1 0 0-1 .5.5 0 0 0 0 1Z" fill="currentColor"/>
      </svg>
    );
  }
  return <Icon name={name} size={size} strokeWidth={active ? 2.4 : 2}/>;
}

Object.assign(window, { ParentHeader, KidCard, ParentTabBar, ParentIcon });
