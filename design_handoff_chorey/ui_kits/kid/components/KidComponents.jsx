// KidComponents.jsx — shared primitives for the kid app
// Exports to window: KidHeader, KidHeroBalance, BucketTriple, ChoreRow, KidTabBar, Icon

const Icon = ({ name, size = 24, color = 'currentColor', strokeWidth = 2 }) => {
  const paths = {
    home: <><path d="M3 12 L 12 4 L 21 12"/><path d="M5 10 V 20 H 19 V 10"/></>,
    heart: <path d="M19 14c1.5-1.5 3-3.5 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.8 0-3 .5-4.5 2-1.5-1.5-2.7-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2 1.5 4 3 5.5l7 7Z"/>,
    user: <><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/></>,
    check: <path d="M5 13l4 4L19 7"/>,
    plus: <path d="M5 12h14M12 5v14"/>,
    chev: <path d="m9 18 6-6-6-6"/>,
    spark: <><path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M5.6 18.4l2.1-2.1M16.3 7.7l2.1-2.1"/></>,
    flame: <path d="M12 22a7 7 0 0 0 7-7c0-3-2-5-3-7-2 1-3 3-3 5 0-3-1-6-3-8-1 4-5 6-5 11a7 7 0 0 0 7 6Z"/>,
    arrowR: <><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></>,
    lock: <><rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/></>,
    gift: <><path d="M20 12v9H4v-9"/><rect x="2" y="7" width="20" height="5"/><path d="M12 22V7M12 7H7a2 2 0 1 1 0-4c4 0 5 4 5 4M12 7h5a2 2 0 1 0 0-4c-4 0-5 4-5 4"/></>,
  };
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
         stroke={color} strokeWidth={strokeWidth}
         strokeLinecap="round" strokeLinejoin="round">
      {paths[name] || null}
    </svg>
  );
};

function KidHeader({ name = 'Mia', streak = 4 }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '12px 22px 6px',
    }}>
      <div>
        <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--fg-3)',
                      letterSpacing: '0.08em', textTransform: 'uppercase' }}>
          Saturday
        </div>
        <div style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 32,
                      lineHeight: 1.05, letterSpacing: '-0.02em', color: 'var(--fg-1)',
                      marginTop: 2 }}>
          Hey, {name}.
        </div>
      </div>
      <div style={{
        display: 'inline-flex', alignItems: 'center', gap: 6,
        padding: '6px 12px', background: 'var(--warning-100)',
        color: 'var(--warning-600)', borderRadius: 999, fontSize: 13, fontWeight: 700,
      }}>
        <Icon name="flame" size={15} />{streak}-day streak
      </div>
    </div>
  );
}

// Hero balance card with 40/40/20 split
function KidHeroBalance({ earned, allowance, savings, giving }) {
  return (
    <div style={{
      margin: '10px 18px 0',
      background: 'var(--cream-3)',
      borderRadius: 26,
      padding: '22px 22px 18px',
      boxShadow: 'var(--shadow-md)',
    }}>
      <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em',
                    textTransform: 'uppercase', color: 'var(--fg-3)' }}>
        This week so far
      </div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginTop: 4 }}>
        <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 64, lineHeight: 1,
                       letterSpacing: '-0.02em', color: 'var(--fg-1)',
                       fontVariantNumeric: 'tabular-nums' }}>
          ${Math.floor(earned)}
        </span>
        <span style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 30, lineHeight: 1,
                       color: 'var(--fg-2)', fontVariantNumeric: 'tabular-nums',
                       }}>
          .{String(Math.round((earned % 1) * 100)).padStart(2, '0')}
        </span>
      </div>
      <BucketTriple allowance={allowance} savings={savings} giving={giving} />
    </div>
  );
}

function BucketTriple({ allowance, savings, giving, compact }) {
  const Bucket = ({ tone, label, amount, lockIcon }) => (
    <div style={{
      flex: tone === 'give' ? 1 : 1,
      background: `var(--${tone}-100)`,
      borderRadius: 14,
      padding: compact ? '10px 12px' : '12px 14px',
      display: 'flex', flexDirection: 'column', gap: 2,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 4,
                    fontSize: 10, fontWeight: 700, letterSpacing: '0.06em',
                    textTransform: 'uppercase', color: `var(--${tone}-800)` }}>
        {lockIcon && <Icon name="lock" size={11} color={`var(--${tone}-800)`} strokeWidth={2.4}/>}
        {label}
      </div>
      <div style={{ fontFamily: 'var(--font-body)', fontWeight: 700,
                    fontSize: compact ? 16 : 19, color: `var(--${tone}-800)`,
                    fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.01em' }}>
        ${amount.toFixed(2)}
      </div>
    </div>
  );
  return (
    <div style={{
      display: 'flex', gap: 8, marginTop: compact ? 0 : 16,
    }}>
      <Bucket tone="allowance" label="Spend" amount={allowance} />
      <Bucket tone="savings" label="Save" amount={savings} lockIcon />
      <Bucket tone="giving" label="Give" amount={giving} />
    </div>
  );
}

function ChoreRow({ chore, onToggle }) {
  return (
    <div
      onClick={() => onToggle && onToggle(chore.id)}
      style={{
        display: 'flex', alignItems: 'center', gap: 14,
        padding: '14px 18px',
        borderBottom: '1px solid var(--border)',
        cursor: 'pointer',
        transition: 'background 140ms var(--ease-out)',
        background: 'transparent',
      }}
      onMouseEnter={(e) => e.currentTarget.style.background = 'var(--cream-1)'}
      onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
    >
      <div style={{
        width: 26, height: 26, borderRadius: 9, flexShrink: 0,
        border: chore.done ? 'none' : '1.5px solid var(--border-strong)',
        background: chore.done ? 'var(--giving-400)' : 'var(--cream-2)',
        color: 'var(--giving-800)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        transition: 'all 220ms var(--ease-spring)',
      }}>
        {chore.done && <Icon name="check" size={16} strokeWidth={3} />}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontSize: 15, fontWeight: 600,
          color: chore.done ? 'var(--fg-3)' : 'var(--fg-1)',
          textDecoration: chore.done ? 'line-through' : 'none',
          textDecorationColor: 'var(--fg-4)',
        }}>{chore.name}</div>
        {chore.note && (
          <div style={{ fontSize: 11, color: 'var(--fg-3)', marginTop: 1 }}>
            {chore.note}
          </div>
        )}
      </div>
      <div style={{
        fontWeight: 700, fontSize: 15,
        fontVariantNumeric: 'tabular-nums',
        color: chore.done ? 'var(--giving-600)' : 'var(--fg-1)',
      }}>
        {chore.done ? '+' : ''}${chore.value.toFixed(2)}
      </div>
    </div>
  );
}

function KidTabBar({ active, onChange }) {
  const tabs = [
    { id: 'home', icon: 'home', label: 'Home' },
    { id: 'wish', icon: 'heart', label: 'Wishlist' },
    { id: 'you', icon: 'user', label: 'You' },
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
            padding: '4px 14px',
            fontFamily: 'inherit',
          }}>
          <Icon name={t.icon} size={22} strokeWidth={active === t.id ? 2.4 : 2} />
          <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.01em' }}>{t.label}</span>
        </button>
      ))}
    </div>
  );
}

Object.assign(window, { Icon, KidHeader, KidHeroBalance, BucketTriple, ChoreRow, KidTabBar });
