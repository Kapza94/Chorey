// OnboardingShared.jsx — scaffold + reusable bits for the Chorey onboarding flow
// Exports: OBShell, OBProgress, OBPrimary, OBSecondary, OBField, BackChevron, useMounted

function useMounted(delay = 60) {
  const [on, setOn] = React.useState(false);
  React.useEffect(() => {
    const t = setTimeout(() => setOn(true), delay);
    return () => clearTimeout(t);
  }, []);
  return on;
}

function BackChevron({ onClick }) {
  if (!onClick) return <div style={{ width: 30 }} />;
  return (
    <button onClick={onClick} aria-label="Back" style={{
      width: 30, height: 30, borderRadius: 999, border: 0,
      background: 'var(--cream-3)', cursor: 'pointer',
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      boxShadow: 'var(--shadow-xs)',
    }}>
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--fg-1)"
           strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
        <path d="m15 18-6-6 6-6"/>
      </svg>
    </button>
  );
}

function OBProgress({ index, total }) {
  if (!total) return null;
  return (
    <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
      {Array.from({ length: total }).map((_, i) => (
        <div key={i} style={{
          height: 4, borderRadius: 999,
          width: i === index ? 22 : 6,
          background: i <= index ? 'var(--accent-600)' : 'var(--border-strong)',
          transition: 'all 300ms var(--ease-out)',
        }}/>
      ))}
    </div>
  );
}

// Full-bleed onboarding screen scaffold inside the phone.
function OBShell({ children, footer, onBack, progress, tone }) {
  return (
    <div style={{
      position: 'absolute', inset: 0,
      display: 'flex', flexDirection: 'column',
      background: tone || 'var(--cream-2)',
      paddingTop: 52,
      fontFamily: 'var(--font-body)',
      color: 'var(--fg-1)',
    }}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 14,
        padding: '6px 22px 2px', minHeight: 38,
      }}>
        <BackChevron onClick={onBack} />
        {progress && <OBProgress index={progress.index} total={progress.total} />}
      </div>
      <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', padding: '10px 26px 0' }}>
        {children}
      </div>
      <div style={{ padding: '14px 26px 30px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {footer}
      </div>
    </div>
  );
}

function OBPrimary({ children, onClick, disabled }) {
  return (
    <button onClick={onClick} disabled={disabled} style={{
      width: '100%', padding: '15px', borderRadius: 999, border: 0,
      background: disabled ? 'var(--cream-0)' : 'var(--accent-600)',
      color: disabled ? 'var(--fg-4)' : 'var(--cream-4)',
      fontWeight: 700, fontSize: 16, cursor: disabled ? 'default' : 'pointer',
      fontFamily: 'inherit', letterSpacing: '-0.01em',
      whiteSpace: 'nowrap',
      transition: 'transform 140ms var(--ease-out), background 140ms var(--ease-out)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
    }}
    onMouseDown={e => !disabled && (e.currentTarget.style.transform = 'scale(0.975)')}
    onMouseUp={e => (e.currentTarget.style.transform = 'scale(1)')}
    onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
    >{children}</button>
  );
}

function OBSecondary({ children, onClick }) {
  return (
    <button onClick={onClick} style={{
      width: '100%', padding: '13px', borderRadius: 999,
      border: 0, background: 'transparent',
      color: 'var(--fg-2)', fontWeight: 700, fontSize: 14,
      cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap',
    }}>{children}</button>
  );
}

function OBField({ label, value, onChange, placeholder, prefix, type, maxLength, autoFocus }) {
  return (
    <label style={{ display: 'block' }}>
      {label && (
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em',
                      textTransform: 'uppercase', color: 'var(--fg-3)', marginBottom: 7 }}>
          {label}
        </div>
      )}
      <div style={{ position: 'relative' }}>
        {prefix && (
          <span style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)',
                         color: 'var(--fg-3)', fontSize: 16, fontWeight: 600 }}>{prefix}</span>
        )}
        <input
          value={value} onChange={e => onChange(e.target.value)}
          placeholder={placeholder} type={type || 'text'} maxLength={maxLength}
          autoFocus={autoFocus}
          style={{
            width: '100%', boxSizing: 'border-box',
            background: 'var(--cream-3)',
            border: '1.5px solid var(--border-mid)',
            borderRadius: 12, padding: prefix ? '14px 16px 14px 28px' : '14px 16px',
            fontFamily: 'inherit', fontSize: 16, color: 'var(--fg-1)',
            fontVariantNumeric: 'tabular-nums',
            outline: 'none', transition: 'border-color 140ms var(--ease-out)',
          }}
          onFocus={e => e.target.style.borderColor = 'var(--accent-600)'}
          onBlur={e => e.target.style.borderColor = 'var(--border-mid)'}
        />
      </div>
    </label>
  );
}

Object.assign(window, { useMounted, BackChevron, OBProgress, OBShell, OBPrimary, OBSecondary, OBField });
